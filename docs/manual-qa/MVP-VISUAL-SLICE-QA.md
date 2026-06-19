# MVP Visual Slice Manual QA

Use this checklist for the visible public catalogue -> enquiry -> protected
admin triage flow. This checklist is for final MVP acceptance, not launch governance or provider readiness.

## Final Visible-MVP Acceptance

1. Confirm the homepage -> catalogue path makes the furniture/event rental catalogue understandable before a visitor asks for help.
2. Confirm catalogue -> listing detail -> quote request preserves selected listing context where the public listing is available.
3. Confirm quote validation and failed-submit recovery explain that the quote request was not sent, keep entered details where possible, and invite the visitor to review details and try again.
4. Confirm quote success/receipt copy explains manual follow-up and does not imply an instant rental confirmation.
5. Confirm chat unavailable/error behavior shows an error message and does not show a fake/canned assistant response.
6. Confirm protected admin quote triage shows the submitted quote request context, missing-information cues, manual next actions, and protected status update controls.
7. Confirm protected admin listing/media management still focuses on public-ready listing details and public image metadata using existing admin paths.
8. Confirm fallback and empty states for homepage listings, catalogue filters, listing unavailable pages, no public image, quote selected-listing context, failed submit, and protected admin unavailable states provide useful next steps.
9. Run a basic mobile smoke pass across homepage, catalogue cards, listing detail media, quote form, quote receipt, admin quote inbox, and admin listing/media management.

## Public Visitor Flow

1. Open the homepage.
2. Confirm the first screen clearly says this is a furniture/event rental website and a catalogue for browsing real rental listings.
3. Confirm the homepage explains the enquiry path: browse catalogue/listings, view listing details before requesting a quote, submit an editable quote request, and team manual follow-up.
4. Confirm quote-prep guidance names event date, venue or location, requested rental listings/items, approximate quantities, setup/access/timing notes, and alternates.
5. Confirm homepage trust cues explain that visitors share event/rental details for manual follow-up and that the site does not create an instant rental confirmation.
6. Confirm homepage guidance CTAs reach the catalogue, rental listings, and the quote request.
7. Use the homepage CTA to browse rental listings or the catalogue.
8. Browse catalogue/listing cards.
9. Use listing search, category filters, event-use filters, and reset filters if available.
10. Confirm the listing results summary updates the shown count and active browsing context.
11. Confirm the catalogue shows a "How to choose a rental listing" browse helper that guides visitors to compare category/type, short description, rental unit, and listing details before sending a quote request.
12. Confirm featured and catalogue listing cards show useful rental details from existing catalogue data: public rental listing cue, name, category/type when available, short description, rental unit, listing reference, public image status or representative image cue, detail CTA, and quote/enquiry CTA.
13. Confirm the primary card action opens rental details and the quote request action continues to `/quote?listing=<listing-slug>`.
14. Open a listing detail page or use a card CTA to start the enquiry flow.
15. Confirm the listing detail page shows the primary public image when available, shows visitor-friendly photo fallback copy when no image is available, and keeps internal media/source details hidden.
16. Confirm the listing detail page explains that the selected listing carries into editable enquiry text and shows the listing reference, category/type, rental unit, and quote-request decision cues.
17. Confirm the listing detail quote CTA names the selected listing and opens `/quote?listing=<listing-slug>`.
18. Confirm the quote page shows a selected rental listing panel near the top when a listing is carried in from `/quote?listing=<listing-slug>`.
19. Confirm the selected listing starts editable requested-listings text only and can be kept, changed, removed, or expanded with quantities, alternates, event date or rental period notes, venue/location, setup/access notes, and timing details before submit.
20. Submit the form without name or contact details and confirm inline required-field guidance appears while entered rental details remain in the form.
21. Submit a quote/enquiry request with name, email or phone, event date if known, venue or location, requested listings/items, quantities, setup/access notes, timing notes, and alternates if relevant.
22. Confirm the submit button uses a clear sending state and cannot be accidentally submitted twice while the request is in progress.
23. Confirm the success receipt appears with a public receipt reference when returned, a next team action, manual follow-up copy, requested listing/item context language, a selected-listing detail link when the enquiry started from a listing, and browsing/another-enquiry actions.
24. Confirm the success receipt does not expose admin status, tracking, provider, database IDs, or internal workflow details.

## Persistence And Admin Triage

1. Confirm the public submit path uses `/api/quote`.
2. Confirm the app is configured for Supabase-backed quote persistence before treating the submission as end-to-end data verification.
3. Open protected admin quote requests.
4. Confirm the submitted enquiry appears with public reference, created time, customer contact, event date, venue/location, requested listing/item details, source path/listing context, current internal status, and submitted notes.
5. Confirm each quote card starts with an admin triage snapshot that groups public reference, visitor/contact details, event details, rental details, setup/access notes, source listing, and current status.
6. Confirm each quote card shows admin follow-up priorities for confirming requested listing/item, quantity, event/rental timing, venue/access details, contact method, and source listing/path.
7. Confirm the main quote card shows source context and a manual follow-up checklist using the submitted public reference, visitor name, email/phone, event date, venue/location, requested rental listings/items, setup/access/timing notes, and source listing/path.
8. Confirm quote cards with missing details clearly cue manual follow-up for missing requested listing/item, quantity, event/rental timing, venue/access details, contact method, and source listing context.
9. Confirm quote cards with a source listing slug provide safe next-step links to view the public listing, review protected listing management, and manage listing images.
10. Confirm the main quote card does not show old CRM handoff placeholder, provider, contact ID, deal ID, or per-enquiry queue-prep controls.
11. Confirm admins are guided to review requested rental details, check event date/venue/quantities/setup/access notes, contact the visitor manually, and update protected triage status after review.
12. Update internal triage status.
13. Confirm the admin status banner names the submitted enquiry reference and the saved triage status.
14. Confirm the status update remains protected admin-only and does not contact the customer, sync to CRM, send email, call n8n, or expose a public tracking page.

## Protected Admin Catalogue Content

1. Open the protected admin overview.
2. Confirm normal admin navigation focuses on listings, categories, media, and quote requests.
3. Confirm normal admin navigation does not present content-readiness, public-parity, release-control, CRM/provider, governance, or phase work as a visible admin workflow.
4. Open protected admin listings.
5. Confirm each listing card is easy to scan for listing name, category/type, public slug, visibility status, public-ready status, rental unit, and image/fallback presence.
6. Confirm the public-ready listing helper uses existing listing fields only and calls out draft/not-public status, missing category, short description, full description, rental details, active public image, primary public image, and primary image alt text where relevant.
7. Confirm each listing card includes links to view the public listing, jump to the edit form, manage images, and return to catalogue admin.
8. Confirm draft/published/archived visibility cues stay protected-admin guidance and do not imply availability, reservation, payment, or completed rental.
9. Confirm save, public visibility, draft visibility, and archive actions continue to use the existing protected admin listing paths.
10. Open protected admin categories and media; confirm visible helper copy uses category visibility, media coverage, public-ready listing, quote request, enquiry, and manual follow-up language instead of old internal ladder wording.

## Scope Guard

1. Confirm no cart, checkout, payment, order, booking, reservation, customer account, or provider-sync flow appears.
2. Confirm no HubSpot API call, n8n workflow/runtime, email sending, provider credentials, or `website/chat-config.js` access is required for this QA path.
3. Record any environment limitation honestly, especially missing local Supabase env or blocked Docker-dependent validation.
