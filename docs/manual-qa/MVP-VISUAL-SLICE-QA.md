# MVP Visual Slice Manual QA

Use this checklist for the visible public catalogue -> enquiry -> protected
admin triage flow. It is a local/preview QA path, not deployment approval.

## Public Visitor Flow

1. Open the homepage.
2. Confirm the first screen clearly says this is a furniture/event rental website.
3. Use the homepage CTA to browse rental listings or the catalogue.
4. Browse catalogue/listing cards.
5. Use listing search, category filters, event-use filters, and reset filters if available.
6. Confirm the listing results summary updates the shown count and active browsing context.
7. Confirm featured and catalogue listing cards show useful rental details from existing catalogue data: name, category when available, description, rental unit, listing reference, image or fallback image, and quote/enquiry CTA.
8. Confirm the primary card action starts a quote request and the secondary action opens rental details.
9. Open a listing detail page or use a card CTA to start the enquiry flow.
10. Confirm the listing detail page explains that the selected listing carries into editable enquiry text and shows the listing reference.
11. Confirm the quote page shows a selected rental listing panel near the top when a listing is carried in.
12. Confirm the selected listing starts editable requested-listings text only and can be changed before submit.
13. Submit the form without name or contact details and confirm inline required-field guidance appears while entered rental details remain in the form.
14. Submit a quote/enquiry request with name, email or phone, event date if known, venue or location, requested listings/items, quantities, setup/access notes, timing notes, and alternates if relevant.
15. Confirm the submit button uses a clear sending state and cannot be accidentally submitted twice while the request is in progress.
16. Confirm the success receipt appears with a public receipt reference when returned, a next team action, and browsing/another-enquiry actions.
17. Confirm the success receipt does not expose admin status, tracking, provider, database IDs, or internal workflow details.

## Persistence And Admin Triage

1. Confirm the public submit path uses `/api/quote`.
2. Confirm the app is configured for Supabase-backed quote persistence before treating the submission as end-to-end data verification.
3. Open protected admin quote requests.
4. Confirm the submitted enquiry appears with public reference, created time, customer contact, event date, venue/location, requested listing/item details, source path/listing context, current internal status, and submitted notes.
5. Confirm each quote card starts with an admin triage snapshot that groups public reference, visitor/contact details, event details, rental details, setup/access notes, source listing, and current status.
6. Confirm submitted enquiry details, the triage snapshot, and the protected internal status control appear before secondary future CRM handoff readiness sections.
7. Update internal triage status.
8. Confirm the admin status banner names the submitted enquiry reference and the saved triage status.
9. Confirm the status update remains protected admin-only and does not contact the customer, sync to CRM, send email, call n8n, or expose a public tracking page.

## Scope Guard

1. Confirm no cart, checkout, payment, order, booking, reservation, customer account, or provider-sync flow appears.
2. Confirm no HubSpot API call, n8n workflow/runtime, email sending, provider credentials, or `website/chat-config.js` access is required for this QA path.
3. Record any environment limitation honestly, especially missing local Supabase env or blocked Docker-dependent validation.
