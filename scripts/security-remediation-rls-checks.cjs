const assert = require('node:assert/strict');

function registerSecurityRemediationRlsChecks({
  check,
  ids,
  psql,
  queryCommittedAs,
  scalarAs,
  statementFailsAs,
}) {
  function proofFor({
    quoteId,
    workspaceId = ids.workspaceA,
    publicReference,
    customerName,
    submissionId,
    claimToken,
  }) {
    const output = psql(`
      with material as (
        select
          public.get_public_quote_submission_digest(
            '${quoteId}', '${workspaceId}', '${publicReference}',
            '${customerName}', 'security-customer@example.test', null, null,
            null, null, '/quote', null, '${submissionId}', '[]'::jsonb,
            '${claimToken}'
          ) as digest,
          floor(extract(epoch from clock_timestamp()))::bigint + 60 as expires_at
      )
      select
        digest || '|' || expires_at::text || '|' ||
        encode(
          extensions.hmac(
            convert_to(
              concat_ws(
                E'\\n', 'skr.quote.submit.v1', '${workspaceId}',
                '${submissionId}', digest, expires_at::text
              ),
              'UTF8'
            ),
            convert_to('local-rls-quote-admission-secret-for-tests-only', 'UTF8'),
            'sha256'
          ),
          'hex'
        )
      from material
    `);
    const [digest, expiresAt, signature] = output.split('|');

    return { digest, expiresAt, signature };
  }

  check('pgcrypto matches the production extensions schema', () => {
    assert.equal(
      psql(`
        select namespace.nspname
        from pg_catalog.pg_extension extension
        join pg_catalog.pg_namespace namespace
          on namespace.oid = extension.extnamespace
        where extension.extname = 'pgcrypto'
      `),
      'extensions',
    );
    assert.equal(
      psql(`select (to_regprocedure('public.digest(bytea,text)') is null)::text`),
      'true',
      'The production-shaped database must not expose public.digest(bytea, text).',
    );
    assert.equal(
      psql(`select (to_regprocedure('public.hmac(bytea,bytea,text)') is null)::text`),
      'true',
      'The production-shaped database must not expose public.hmac(bytea, bytea, text).',
    );
    assert.equal(
      psql(`select (to_regprocedure('extensions.digest(bytea,text)') is not null)::text`),
      'true',
    );
    assert.equal(
      psql(`select (to_regprocedure('extensions.hmac(bytea,bytea,text)') is not null)::text`),
      'true',
    );
    assert.match(
      psql(`
        select private.quote_submission_payload_digest(
          '70000000-0000-4000-8000-000000000129',
          '${ids.workspaceA}',
          'quote-security-pgcrypto',
          'Security Customer',
          'security-customer@example.test',
          null,
          null,
          null,
          null,
          '/quote',
          null,
          'security-pgcrypto-129',
          '[]'::jsonb,
          '71000000-0000-4000-8000-000000000129'
        )
      `),
      /^[a-f0-9]{64}$/,
      'The private payload digest must execute against extensions.digest.',
    );
    assert.equal(
      scalarAs(
        'authenticated',
        ids.authMemberA,
        `select public.enqueue_search_index_job(
          '${ids.workspaceA}',
          'listing',
          'f3000000-0000-4000-8000-000000000129',
          'admin_only',
          'upsert',
          'pgcrypto-schema-v1',
          null,
          '{"source": "pgcrypto-schema-test"}'::jsonb
        )->>'status'`,
      ),
      'queued',
      'The search-index fallback digest must resolve pgcrypto from extensions.',
    );
  });

  function submitSql(
    {
      quoteId,
      workspaceId = ids.workspaceA,
      publicReference,
      customerName,
      submissionId,
      claimToken,
    },
    { digest, expiresAt, signature },
  ) {
    return `
      select quote_request_id::text || '|' || handoff_claim_status
      from public.submit_public_quote_request(
        '${quoteId}', '${workspaceId}', '${publicReference}',
        '${customerName}', 'security-customer@example.test', null, null,
        null, null, '/quote', null, '${submissionId}', '[]'::jsonb,
        '${claimToken}', '${digest}', ${expiresAt}, '${signature}'
      )
    `;
  }

  check('quote durable mutation requires a valid payload-bound server admission proof', () => {
    const base = {
      quoteId: '70000000-0000-4000-8000-000000000130',
      publicReference: 'quote-security-admission',
      customerName: 'Security Customer',
      submissionId: 'security-admission-130',
      claimToken: '71000000-0000-4000-8000-000000000130',
    };
    const proof = proofFor(base);

    statementFailsAs(
      'anon',
      null,
      submitSql(base, { ...proof, signature: 'malformed' }),
      /quote admission proof is invalid/i,
    );
    statementFailsAs(
      'anon',
      null,
      submitSql(base, { ...proof, signature: '0'.repeat(64) }),
      /quote admission proof is invalid/i,
    );
    statementFailsAs(
      'anon',
      null,
      submitSql(base, { ...proof, expiresAt: '1' }),
      /quote admission proof is invalid/i,
    );
    statementFailsAs(
      'anon',
      null,
      submitSql({ ...base, workspaceId: ids.workspaceB }, proof),
      /quote admission proof is invalid/i,
    );
    statementFailsAs(
      'anon',
      null,
      submitSql({ ...base, submissionId: 'security-admission-different' }, proof),
      /quote admission proof is invalid/i,
    );
    statementFailsAs(
      'anon',
      null,
      submitSql({ ...base, customerName: 'Changed Security Customer' }, proof),
      /quote admission proof is invalid/i,
    );

    assert.equal(
      queryCommittedAs('anon', null, submitSql(base, proof)),
      `${base.quoteId}|claimed`,
    );
    assert.equal(
      queryCommittedAs('anon', null, submitSql(base, proof)),
      `${base.quoteId}|in_progress`,
      'a valid in-window proof may replay only through the durable idempotency contract.',
    );
    assert.equal(
      psql(`select count(*)::text from public.quote_requests where id = '${base.quoteId}'`),
      '1',
    );
    assert.equal(
      psql(`select count(*)::text from public.quote_handoff_outbox where quote_request_id = '${base.quoteId}'`),
      '1',
    );

    const conflicting = { ...base, customerName: 'Changed Security Customer' };
    statementFailsAs(
      'anon',
      null,
      submitSql(conflicting, proofFor(conflicting)),
      /payload mismatch/i,
    );
  });

  check('trusted delivery history is created only by one valid unexpired claim finalization', () => {
    const quoteId = '70000000-0000-4000-8000-000000000130';
    const claimToken = '71000000-0000-4000-8000-000000000130';

    for (const [role, authUserId] of [
      ['anon', null],
      ['authenticated', ids.authMemberA],
    ]) {
      statementFailsAs(
        role,
        authUserId,
        `insert into public.quote_email_delivery_log (
          workspace_id, quote_request_id, public_reference, provider,
          delivery_status, request_id
        ) values (
          '${ids.workspaceA}', '${quoteId}', 'forged', 'n8n', 'delivered',
          'forged-${role}'
        )`,
        /permission denied/i,
      );
    }
    assert.equal(
      psql(`
        select (not exists (
          select 1
          from pg_class relation
          cross join lateral aclexplode(
            coalesce(relation.relacl, acldefault('r', relation.relowner))
          ) acl
          where relation.oid = 'public.quote_email_delivery_log'::regclass
            and acl.grantee = 0
            and acl.privilege_type = 'INSERT'
        ))::text
      `),
      'true',
      'PUBLIC must have no delivery-log INSERT ACL.',
    );

    statementFailsAs(
      'anon',
      null,
      `select public.finalize_public_quote_handoff(
        '${quoteId}', '${ids.workspaceB}', 'security-admission-130',
        '${claimToken}', 'completed', 'delivered', 'provider-message', null,
        'security-finalize-wrong-workspace'
      )`,
      /workspace is not available/i,
    );
    statementFailsAs(
      'anon',
      null,
      `select public.finalize_public_quote_handoff(
        '${quoteId}', '${ids.workspaceA}', 'security-admission-130',
        '71000000-0000-4000-8000-000000000139', 'completed', 'delivered',
        'provider-message', null, 'security-finalize-wrong-claim'
      )`,
      /claim is unavailable/i,
    );

    assert.equal(
      queryCommittedAs(
        'anon',
        null,
        `select public.finalize_public_quote_handoff(
          '${quoteId}', '${ids.workspaceA}', 'security-admission-130',
          '${claimToken}', 'completed', 'delivered', 'provider-message', null,
          'security-finalize-valid'
        )::text`,
      ),
      'true',
    );
    assert.equal(
      psql(`select count(*)::text from public.quote_email_delivery_log
        where quote_request_id = '${quoteId}' and handoff_claim_token = '${claimToken}'`),
      '1',
    );
    assert.equal(
      psql(`select provider || '|' || delivery_status || '|' || provider_message_id
        from public.quote_email_delivery_log where quote_request_id = '${quoteId}'`),
      'n8n|delivered|provider-message',
    );

    for (const finalization of [
      ['completed', 'delivered', 'different-provider-message', 'null'],
      ['retryable_failed', 'failed', 'null', "'conflicting_failure'"],
    ]) {
      statementFailsAs(
        'anon',
        null,
        `select public.finalize_public_quote_handoff(
          '${quoteId}', '${ids.workspaceA}', 'security-admission-130',
          '${claimToken}', '${finalization[0]}', '${finalization[1]}',
          ${finalization[2] === 'null' ? 'null' : `'${finalization[2]}'`},
          ${finalization[3]}, 'security-finalize-duplicate'
        )`,
        /claim is unavailable/i,
      );
    }
    assert.equal(
      psql(`select count(*)::text from public.quote_email_delivery_log
        where quote_request_id = '${quoteId}'`),
      '1',
      'duplicate or conflicting completion must not forge a second trusted record.',
    );

    const stale = {
      quoteId: '70000000-0000-4000-8000-000000000131',
      publicReference: 'quote-security-stale',
      customerName: 'Stale Security Customer',
      submissionId: 'security-admission-131',
      claimToken: '71000000-0000-4000-8000-000000000131',
    };
    queryCommittedAs('anon', null, submitSql(stale, proofFor(stale)));
    psql(`update public.quote_handoff_outbox set claim_expires_at = now() - interval '1 second'
      where quote_request_id = '${stale.quoteId}'`);
    statementFailsAs(
      'anon',
      null,
      `select public.finalize_public_quote_handoff(
        '${stale.quoteId}', '${ids.workspaceA}', '${stale.submissionId}',
        '${stale.claimToken}', 'completed', 'delivered', 'stale-message', null,
        'security-finalize-stale'
      )`,
      /claim is unavailable/i,
    );
  });

  check('workspace-local admin disable and removal preserve shared global identity and other workspace access', () => {
    const sharedAuth = '20000000-0000-4000-8000-000000000020';
    const sharedAdmin = '30000000-0000-4000-8000-000000000020';
    const sharedEmail = 'shared-admin@example.test';

    psql(`
      insert into public.admin_users (id, auth_user_id, email, display_name)
      values ('${sharedAdmin}', '${sharedAuth}', '${sharedEmail}', 'Shared Admin');
      insert into public.memberships (workspace_id, admin_user_id, role, status)
      values
        ('${ids.workspaceA}', '${sharedAdmin}', 'admin', 'active'),
        ('${ids.workspaceB}', '${sharedAdmin}', 'admin', 'active');
      insert into public.admin_access (
        workspace_id, normalized_email, role, status, linked_admin_user_id
      ) values
        ('${ids.workspaceA}', '${sharedEmail}', 'admin', 'active', '${sharedAdmin}'),
        ('${ids.workspaceB}', '${sharedEmail}', 'admin', 'active', '${sharedAdmin}');
    `);

    assert.match(
      queryCommittedAs(
        'authenticated',
        ids.authMemberA,
        `select public.execute_admin_access_write(
          '${ids.workspaceA}', 'disable_admin', '${sharedEmail}'
        )::text`,
      ),
      /"ok": true/,
    );
    assert.equal(psql(`select status from public.admin_users where id = '${sharedAdmin}'`), 'active');
    assert.equal(psql(`select status from public.admin_access where workspace_id = '${ids.workspaceA}' and linked_admin_user_id = '${sharedAdmin}'`), 'disabled');
    assert.equal(psql(`select status from public.memberships where workspace_id = '${ids.workspaceA}' and admin_user_id = '${sharedAdmin}'`), 'suspended');
    assert.equal(psql(`select status from public.admin_access where workspace_id = '${ids.workspaceB}' and linked_admin_user_id = '${sharedAdmin}'`), 'active');
    assert.equal(psql(`select status from public.memberships where workspace_id = '${ids.workspaceB}' and admin_user_id = '${sharedAdmin}'`), 'active');
    assert.equal(scalarAs('authenticated', sharedAuth, `select public.is_workspace_product_manager('${ids.workspaceB}')::text`), 'true');
    assert.equal(scalarAs('authenticated', sharedAuth, `select public.is_workspace_quote_manager('${ids.workspaceB}')::text`), 'true');

    queryCommittedAs('authenticated', ids.authMemberA, `select public.execute_admin_access_write('${ids.workspaceA}', 'add_admin', '${sharedEmail}')`);
    queryCommittedAs('authenticated', ids.authMemberA, `select public.execute_admin_access_write('${ids.workspaceA}', 'remove_admin', '${sharedEmail}')`);
    queryCommittedAs('authenticated', ids.authMemberA, `select public.execute_admin_access_write('${ids.workspaceA}', 'remove_admin', '${sharedEmail}')`);
    assert.equal(psql(`select status from public.admin_users where id = '${sharedAdmin}'`), 'active');
    assert.equal(psql(`select status from public.memberships where workspace_id = '${ids.workspaceB}' and admin_user_id = '${sharedAdmin}'`), 'active');
    assert.equal(scalarAs('authenticated', sharedAuth, `select public.is_workspace_product_manager('${ids.workspaceB}')::text`), 'true');
    assert.equal(scalarAs('authenticated', sharedAuth, `select public.is_workspace_quote_manager('${ids.workspaceB}')::text`), 'true');

    assert.match(
      queryCommittedAs('authenticated', ids.authMemberA, `select public.execute_admin_access_write('${ids.workspaceA}', 'add_admin', '${sharedEmail}')::text`),
      /"status": "active"/,
    );
    assert.equal(psql(`select status from public.memberships where workspace_id = '${ids.workspaceA}' and admin_user_id = '${sharedAdmin}'`), 'active');
    assert.match(
      queryCommittedAs('authenticated', ids.authMemberA, `select public.execute_admin_access_write('${ids.workspaceA}', 'remove_admin', 'admin-a@example.test')::text`),
      /owner_immutable/,
    );
  });

  check('forward remediation removes anonymous admin access execution', () => {
    const signature = 'public.execute_admin_access_write(uuid,text,text)';

    assert.equal(
      psql(`select has_function_privilege('anon', '${signature}', 'EXECUTE')::text`),
      'false',
      'anon must not execute the owner-only admin access write function.',
    );
    assert.equal(
      psql(`select has_function_privilege(
        'authenticated', '${signature}', 'EXECUTE'
      )::text`),
      'true',
      'authenticated must retain the deliberate admin access write grant.',
    );
    assert.equal(
      psql(`select has_function_privilege(
        'service_role', '${signature}', 'EXECUTE'
      )::text`),
      'true',
      'The forward migration must not change the existing service_role grant.',
    );
    assert.equal(
      psql(`
        select (not exists (
          select 1
          from pg_catalog.pg_proc proc
          cross join lateral pg_catalog.aclexplode(
            coalesce(proc.proacl, pg_catalog.acldefault('f', proc.proowner))
          ) acl
          where proc.oid = '${signature}'::regprocedure
            and acl.grantee = 0
            and acl.privilege_type = 'EXECUTE'
        ))::text
      `),
      'true',
      'PUBLIC must not provide inherited anonymous execution.',
    );
    assert.equal(
      psql(`select prosecdef::text from pg_catalog.pg_proc
        where oid = '${signature}'::regprocedure`),
      'true',
      'The owner-only admin access write function must remain SECURITY DEFINER.',
    );
    statementFailsAs(
      'anon',
      null,
      `select public.execute_admin_access_write(
        '${ids.workspaceA}', 'add_admin', 'anonymous-denied@example.test'
      )`,
      /permission denied for function execute_admin_access_write/i,
    );
  });

  check('workspace-local admin re-add cannot reactivate an inactive shared global identity', () => {
    const sharedAuth = '20000000-0000-4000-8000-000000000021';
    const sharedAdmin = '30000000-0000-4000-8000-000000000021';
    const sharedEmail = 'inactive-shared-admin@example.test';

    psql(`
      insert into public.admin_users (
        id, auth_user_id, email, display_name, status
      ) values (
        '${sharedAdmin}', '${sharedAuth}', '${sharedEmail}',
        'Inactive Shared Admin', 'inactive'
      );
      insert into public.memberships (workspace_id, admin_user_id, role, status)
      values
        ('${ids.workspaceA}', '${sharedAdmin}', 'admin', 'suspended'),
        ('${ids.workspaceB}', '${sharedAdmin}', 'admin', 'active');
      insert into public.admin_access (
        workspace_id, normalized_email, role, status, linked_admin_user_id
      ) values
        ('${ids.workspaceA}', '${sharedEmail}', 'admin', 'removed', '${sharedAdmin}'),
        ('${ids.workspaceB}', '${sharedEmail}', 'admin', 'active', '${sharedAdmin}');
    `);

    assert.match(
      queryCommittedAs(
        'authenticated',
        ids.authMemberA,
        `select public.execute_admin_access_write(
          '${ids.workspaceA}', 'add_admin', '${sharedEmail}'
        )::text`,
      ),
      /"status": "active"/,
    );

    assert.equal(
      psql(`select status from public.admin_users where id = '${sharedAdmin}'`),
      'inactive',
      'workspace A re-add must not reactivate the shared global identity.',
    );
    assert.equal(
      psql(`select role || '|' || status from public.admin_access where workspace_id = '${ids.workspaceA}' and linked_admin_user_id = '${sharedAdmin}'`),
      'admin|active',
    );
    assert.equal(
      psql(`select role || '|' || status from public.memberships where workspace_id = '${ids.workspaceA}' and admin_user_id = '${sharedAdmin}'`),
      'admin|active',
    );
    assert.equal(
      psql(`select role || '|' || status from public.admin_access where workspace_id = '${ids.workspaceB}' and linked_admin_user_id = '${sharedAdmin}'`),
      'admin|active',
      'workspace B access must remain unchanged.',
    );
    assert.equal(
      psql(`select role || '|' || status from public.memberships where workspace_id = '${ids.workspaceB}' and admin_user_id = '${sharedAdmin}'`),
      'admin|active',
      'workspace B membership must remain unchanged.',
    );
  });
}

module.exports = { registerSecurityRemediationRlsChecks };
