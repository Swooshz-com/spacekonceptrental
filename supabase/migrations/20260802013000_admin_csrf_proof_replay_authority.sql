-- Durable, privacy-minimized one-time consumption authority for authenticated
-- administrator CSRF proofs. The table stores only an HMAC fingerprint and
-- bounded authorization metadata; raw proof material never reaches Postgres.

create table public.admin_csrf_proof_consumptions (
  proof_fingerprint text primary key,
  workspace_id uuid not null,
  operation text not null,
  actor_admin_user_id uuid not null,
  issued_at timestamptz not null,
  expires_at timestamptz not null,
  consumed_at timestamptz not null default statement_timestamp(),
  constraint admin_csrf_proof_consumptions_fingerprint_check
    check (proof_fingerprint ~ '^[0-9a-f]{64}$'),
  constraint admin_csrf_proof_consumptions_operation_check
    check (
      operation in (
        'product.write',
        'category.write',
        'productImage.write',
        'hero.write',
        'quote.write',
        'membership.manage',
        'admin.setupRecipe.read',
        'admin.setupRecipe.write'
      )
    ),
  constraint admin_csrf_proof_consumptions_timestamps_finite_check
    check (
      pg_catalog.isfinite(issued_at)
      and pg_catalog.isfinite(expires_at)
      and pg_catalog.isfinite(consumed_at)
    ),
  constraint admin_csrf_proof_consumptions_expiry_check
    check (expires_at > issued_at),
  constraint admin_csrf_proof_consumptions_lifetime_check
    check (expires_at - issued_at <= interval '5 minutes')
);

create index admin_csrf_proof_consumptions_expires_at_idx
  on public.admin_csrf_proof_consumptions (expires_at);

alter table public.admin_csrf_proof_consumptions enable row level security;

revoke all privileges on table public.admin_csrf_proof_consumptions
  from public, anon, authenticated, service_role;

create function public.consume_admin_csrf_proof(
  p_operation text,
  p_expected_workspace_id uuid,
  p_proof_fingerprint text,
  p_issued_at_ms bigint,
  p_expires_at_ms bigint
)
returns boolean
language plpgsql
volatile
security definer
set search_path = pg_catalog
as $$
declare
  actor_admin_user_id uuid;
  issued_at_timestamp timestamptz;
  expires_at_timestamp timestamptz;
  inserted boolean;
begin
  if p_expected_workspace_id is null then
    return false;
  end if;

  actor_admin_user_id :=
    public.current_product_admin_user_id(p_expected_workspace_id);

  if actor_admin_user_id is null then
    return false;
  end if;

  if p_operation is null or p_operation not in (
    'product.write',
    'category.write',
    'productImage.write',
    'hero.write',
    'quote.write',
    'membership.manage',
    'admin.setupRecipe.read',
    'admin.setupRecipe.write'
  ) then
    return false;
  end if;

  if p_proof_fingerprint is null
    or p_proof_fingerprint !~ '^[0-9a-f]{64}$'
  then
    return false;
  end if;

  if p_issued_at_ms is null
    or p_expires_at_ms is null
    or p_issued_at_ms < 0
    or p_expires_at_ms < 0
    or p_issued_at_ms > 9007199254740991
    or p_expires_at_ms > 9007199254740991
    or p_expires_at_ms <= p_issued_at_ms
    or p_expires_at_ms - p_issued_at_ms > 300000
  then
    return false;
  end if;

  begin
    issued_at_timestamp :=
      pg_catalog.to_timestamp(p_issued_at_ms::double precision / 1000.0);
    expires_at_timestamp :=
      pg_catalog.to_timestamp(p_expires_at_ms::double precision / 1000.0);
  exception
    when others then
      return false;
  end;

  if not pg_catalog.isfinite(issued_at_timestamp)
    or not pg_catalog.isfinite(expires_at_timestamp)
    or expires_at_timestamp <= issued_at_timestamp
    or expires_at_timestamp - issued_at_timestamp > interval '5 minutes'
    or expires_at_timestamp <= pg_catalog.statement_timestamp()
  then
    return false;
  end if;

  with expired_fingerprints as (
    select consumption.proof_fingerprint
    from public.admin_csrf_proof_consumptions consumption
    where consumption.expires_at <= pg_catalog.statement_timestamp()
    order by consumption.expires_at, consumption.proof_fingerprint
    limit 128
    for update skip locked
  )
  delete from public.admin_csrf_proof_consumptions consumption
  using expired_fingerprints
  where consumption.proof_fingerprint =
    expired_fingerprints.proof_fingerprint;

  with inserted_consumption as (
    insert into public.admin_csrf_proof_consumptions (
      proof_fingerprint,
      workspace_id,
      operation,
      actor_admin_user_id,
      issued_at,
      expires_at
    ) values (
      p_proof_fingerprint,
      p_expected_workspace_id,
      p_operation,
      actor_admin_user_id,
      issued_at_timestamp,
      expires_at_timestamp
    )
    on conflict (proof_fingerprint) do nothing
    returning true
  )
  select coalesce(
    (select true from inserted_consumption),
    false
  )
  into inserted;

  return inserted is true;
end;
$$;

revoke execute on function public.consume_admin_csrf_proof(
  text,
  uuid,
  text,
  bigint,
  bigint
) from public, anon, authenticated, service_role;

grant execute on function public.consume_admin_csrf_proof(
  text,
  uuid,
  text,
  bigint,
  bigint
) to authenticated;

comment on table public.admin_csrf_proof_consumptions is
  'Privacy-minimized durable replay authority storing only HMAC proof fingerprints and bounded authorization metadata.';

comment on function public.consume_admin_csrf_proof(
  text,
  uuid,
  text,
  bigint,
  bigint
) is
  'Atomically consumes one authenticated workspace-bound administrator CSRF proof fingerprint and returns true only to the first transaction.';
