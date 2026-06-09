# Local Correction Queue

This local correction queue is repo-local, template-only, non-live, and not evidence. It separates missing owner input from repo-local correction work without recording real owner corrections, owner feedback, owner decisions, owner approval, preview evidence, production evidence, or deployment approval.

## Queue Statuses

- `Not evaluated` - no local review has assigned a correction lane.
- `Owner input required` - correction cannot proceed because owner facts or wording are missing.
- `Ready for local correction` - the needed change is deterministic, repo-local, and not owner-dependent.
- `Local correction in progress` - a local branch may adjust protected/admin/public repo files within approved scope.
- `Local correction complete` - only use when the correction is deterministic, repo-local, tested, and not owner-dependent.
- `Blocked before public visibility` - the item must not appear on public routes.
- `Blocked before deployment planning` - the item cannot move into deployment planning.
- `Requires separate deployment approval` - the item needs explicit deployment approval outside this queue.

## Correction Lanes

| Correction lane | Default queue status | Template handling | Public exposure boundary | Admin-only handling | Evidence status |
| --- | --- | --- | --- | --- | --- |
| Public copy | Owner input required | Keep public wording generic until owner wording exists. | No owner-input intake control, correction queue, handoff closure, release-control, owner-review template, or admin URL leakage. | Protected admin may show that public wording needs review. | [NOT EVIDENCE / NOT RECORDED] |
| Listing/category content | Owner input required | Keep unsupported listing/category facts absent. | No fake dimensions, quantities, locations, service areas, or claims. | Admin-only listing/category summaries can flag missing facts. | [NOT EVIDENCE / NOT RECORDED] |
| Media/alt text | Owner input required | Keep repo-local image metadata placeholders only. | No client names, certifications, awards, guarantees, or unsupported facts. | Admin-only media review may flag image and alt-text gaps. | [NOT EVIDENCE / NOT RECORDED] |
| Quote/enquiry wording | Ready for local correction | Use receipt-style quote/enquiry request wording without operational promises. | No public quote tracking, customer accounts, uploads, notifications, CRM, or completion flow. | Protected quote helper copy may remain admin-only. | [NOT EVIDENCE / NOT RECORDED] |
| Protected admin helper text | Ready for local correction | Keep helper text generic and role-free. | No protected helper text on public routes. | Admin-only summaries can separate missing owner input from local corrections. | [NOT EVIDENCE / NOT RECORDED] |
| Admin workflow privacy | Ready for local correction | Keep internal notes, workflow states, and operator context protected. | Public users must not see internal notes or admin workflow details. | Protected admin-only review remains allowed. | [NOT EVIDENCE / NOT RECORDED] |
| Fake-fact removal | Ready for local correction | Remove unsupported contact, business-hour, service-area, legal, guarantee, award, and testimonial claims. | Public routes stay free of invented facts. | Admin-only docs may identify missing fact categories only. | [NOT EVIDENCE / NOT RECORDED] |
| Public leakage removal | Ready for local correction | Remove protected admin, release-control, owner-review, recovery, safeguard, and transition details from public source. | Public routes expose only rental/enquiry website copy. | Admin-only details stay in protected shell and docs. | [NOT EVIDENCE / NOT RECORDED] |
| Provider/deployment boundary | Requires separate deployment approval | Keep deployment/provider work blocked. | No preview/production claims or provider setup appears publicly. | Protected release-control may state approval is not granted. | [NOT EVIDENCE / NOT RECORDED] |
