const preMigrationPublicSecurityDefinerSignatures = Object.freeze([
  'public.current_admin_access_email()',
  'public.current_admin_access_id(uuid)',
  'public.current_product_admin_user_id(uuid)',
  'public.current_quote_admin_user_id(uuid)',
  'public.enqueue_search_index_job(uuid,text,uuid,text,text,text,text,jsonb,text)',
  'public.ensure_admin_access_membership(uuid)',
  'public.execute_admin_access_write(uuid,text,text)',
  'public.execute_admin_homepage_hero_image_write(uuid,jsonb)',
  'public.execute_admin_homepage_hero_write(uuid,jsonb)',
  'public.execute_admin_product_write(text,uuid,uuid,jsonb)',
  'public.execute_admin_public_page_media_write(uuid,text,jsonb)',
  'public.execute_admin_quote_crm_handoff_queue_update(uuid,uuid,text,text)',
  'public.execute_admin_quote_workflow(uuid,uuid,text,text)',
  'public.finalize_public_quote_handoff(uuid,uuid,text,uuid,text,text)',
  'public.finalize_public_quote_handoff(uuid,uuid,text,uuid,text,text,text,text,text)',
  'public.get_admin_access_membership(uuid,uuid)',
  'public.get_public_catalogue(uuid,text)',
  'public.get_public_homepage_hero(uuid)',
  'public.get_public_page_media(uuid,text)',
  'public.get_public_quote_submission_digest(uuid,uuid,text,text,text,text,text,date,text,text,text,text,jsonb,uuid)',
  'public.insert_transcript_audit_event(uuid,jsonb)',
  'public.insert_transcript_evidence_record(uuid,jsonb)',
  'public.is_public_website_quote_request(uuid,uuid)',
  'public.is_workspace_admin_access_member(uuid)',
  'public.is_workspace_admin_access_owner(uuid)',
  'public.is_workspace_member(uuid)',
  'public.is_workspace_product_manager(uuid)',
  'public.is_workspace_quote_manager(uuid)',
  'public.list_admin_access_records(uuid)',
  'public.persist_transcript_batch(uuid,jsonb,jsonb)',
  'public.prevent_admin_access_owner_mutation()',
  'public.submit_public_quote_request(uuid,uuid,text,text,text,text,text,date,text,text,text,text,jsonb,uuid,text,bigint,text)',
  'public.touch_admin_access_updated_at()',
]);

const movedPublicSecurityDefinerSignatures = Object.freeze([
  'public.is_public_website_quote_request(uuid,uuid)',
  'public.is_workspace_member(uuid)',
  'public.is_workspace_quote_manager(uuid)',
]);

const finalPublicSecurityDefinerSignatures = Object.freeze(
  preMigrationPublicSecurityDefinerSignatures.filter(
    (signature) => !movedPublicSecurityDefinerSignatures.includes(signature),
  ),
);

const anonymousPublicSecurityDefinerAllowlist = Object.freeze([
  'public.finalize_public_quote_handoff(uuid,uuid,text,uuid,text,text,text,text,text)',
  'public.get_public_catalogue(uuid,text)',
  'public.get_public_homepage_hero(uuid)',
  'public.get_public_page_media(uuid,text)',
  'public.get_public_quote_submission_digest(uuid,uuid,text,text,text,text,text,date,text,text,text,text,jsonb,uuid)',
  'public.submit_public_quote_request(uuid,uuid,text,text,text,text,text,date,text,text,text,text,jsonb,uuid,text,bigint,text)',
]);

const authenticatedPublicSecurityDefinerAllowlist = Object.freeze([
  'public.enqueue_search_index_job(uuid,text,uuid,text,text,text,text,jsonb,text)',
  'public.ensure_admin_access_membership(uuid)',
  'public.execute_admin_access_write(uuid,text,text)',
  'public.execute_admin_homepage_hero_image_write(uuid,jsonb)',
  'public.execute_admin_product_write(text,uuid,uuid,jsonb)',
  'public.execute_admin_public_page_media_write(uuid,text,jsonb)',
  'public.execute_admin_quote_crm_handoff_queue_update(uuid,uuid,text,text)',
  'public.execute_admin_quote_workflow(uuid,uuid,text,text)',
  'public.get_admin_access_membership(uuid,uuid)',
  'public.list_admin_access_records(uuid)',
]);

const serviceRolePublicSecurityDefinerAllowlist = Object.freeze([]);

const finalPrivateFunctionSignatures = Object.freeze([
  'private.current_quote_admin_user_id(uuid)',
  'private.is_hero_media_admin_object(text,text)',
  'private.is_listing_media_product_admin_object(text,text)',
  'private.is_public_website_quote_request(uuid,uuid)',
  'private.is_workspace_admin_access_member(uuid)',
  'private.is_workspace_member(uuid)',
  'private.is_workspace_product_manager(uuid)',
  'private.is_workspace_quote_manager(uuid)',
  'private.quote_submission_payload_digest(uuid,uuid,text,text,text,text,text,date,text,text,text,text,jsonb,uuid)',
  'private.submit_public_quote_request_unadmitted(uuid,uuid,text,text,text,text,text,date,text,text,text,text,jsonb,uuid)',
]);

const privatePolicyHelperGrants = Object.freeze({
  anon: [
    'private.is_public_website_quote_request(uuid,uuid)',
  ],
  authenticated: [
    'private.current_quote_admin_user_id(uuid)',
    'private.is_hero_media_admin_object(text,text)',
    'private.is_listing_media_product_admin_object(text,text)',
    'private.is_workspace_admin_access_member(uuid)',
    'private.is_workspace_member(uuid)',
    'private.is_workspace_product_manager(uuid)',
    'private.is_workspace_quote_manager(uuid)',
  ],
});

module.exports = {
  anonymousPublicSecurityDefinerAllowlist,
  authenticatedPublicSecurityDefinerAllowlist,
  finalPrivateFunctionSignatures,
  finalPublicSecurityDefinerSignatures,
  movedPublicSecurityDefinerSignatures,
  preMigrationPublicSecurityDefinerSignatures,
  privatePolicyHelperGrants,
  serviceRolePublicSecurityDefinerAllowlist,
};
