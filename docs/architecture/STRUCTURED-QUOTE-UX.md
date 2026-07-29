# Structured Quote UX

## Scope

The public quote experience supports a review-only structured draft. It does
not submit, persist, email, deliver, reserve, price or promise availability.
The current submission capability is server-owned, compile-time fixed and
disabled.

## Browser selection contract

The per-tab storage key is `skr.quoteSelection.v2`. Its JSON value is a
versioned object with at most 20 raw and canonical rows and at most 8,192
serialized UTF-8 bytes.

Catalogue rows store only:

- a public listing reference;
- integer quantity `1..99`;
- source (`catalogue` or single-listing `url` fallback); and
- stable order.

Manual rows store only:

- an opaque browser-generated key;
- plain-text description of 1-180 characters;
- integer quantity `1..99`;
- optional plain-text notes up to 500 characters;
- source `manual`; and
- stable order.

No price, availability, workspace identifier, database identifier, customer
contact data or catalogue display label is stored. Duplicate catalogue
references aggregate in first-seen order. Aggregate overflow rejects the
operation without replacing the prior valid value. Manual rows remain
distinct. Stored zero is invalid; zero is accepted only by the explicit remove
operation.

## Identity and recovery

The browser reference is not record authority. Current server catalogue data
owns the public label and publication result. Stored or URL-supplied labels,
UUIDs, prices, availability and workspace claims are rejected and never
trusted.

Only `/quote?listing=<slug>&qty=<1..99>` can seed one catalogue row. Invalid
references or quantities do not seed a row. Full selections and manual
requirements never enter URLs.

Missing or unpublished references remain visible as `unavailable`; they
cannot become an accepted item and are never silently substituted. Recovery
offers Remove and Browse alternatives. The UI distinguishes `No items
selected yet` from `Catalogue unavailable right now`. A valid manual-only
draft may continue for review.

## Form and accessibility

Name and preferred contact method are required. Email is required for email
follow-up; phone is required for phone follow-up. Every supplied contact value
is validated. At least one valid catalogue or manual row is required.

Native required attributes, inline errors and the linked error summary express
the same conditions. Quantity inputs expose integer minimum, maximum and step
constraints. Selection actions are at least 44 by 44 CSS pixels. The review
control is at least 48 pixels high and uses separate real text and icon
elements so its label can wrap at narrow widths.

## Disabled submission boundary

`website/lib/quote/submission-capability.ts` exports the fixed disabled
capability. Environment configuration cannot enable it.

While disabled:

- the browser contains no quote request call;
- the visible control says submission is unavailable during review;
- direct `POST /api/quote` returns a generic HTTP 503;
- the route returns before body parsing, catalogue access, quote persistence,
  Supabase, email or n8n delivery; and
- the dormant pipeline remains covered by regression tests but is unreachable
  from the public route.

No database migration or atomic quote RPC change is part of this boundary.

## Storage adapter removal contract

Both production browser-storage adapters (`QuoteSelectionControls.tsx` and
`QuoteRequestForm.tsx`) support the optional `remove` operation. When the
original storage state was `null` (key absent) and a commit fails after
writing, the transaction removes the key and verifies that `read()` returns
`null`. If the adapter has no `remove` method, if `remove` throws, or if the
read-back after removal is not `null`, the result is `restore-failed`. No
success event is dispatched on any failed commit or restoration. No UI update
is applied until the actual storage state has been re-read. The empty string
`""` is never substituted for absence.

On `restore-failed`, `read-back-mismatch`, or `storage-exception`, the form
resynchronises its displayed selection from actual storage and shows a bounded
user-safe error. The form does not claim preservation when restoration failed.

## Setup recipe composition deferral

Setup recipe composition is deferred to issue #319. The production runtime
contains no recipe resolver, no `setupPieces` cast, and no recipe type that
could be invoked as current production authority. The `quoteSetupRecipes`
function, `resolveSetupRecipesForCatalogue`, `resolveSetupRecipe`, and
`SetupRecipeAuthoritativePiece` / `SetupRecipeAuthoritativeProduct` /
`SetupRecipeResolution` types have been removed from the production path.

No production-facing code currently derives setup included pieces from
catalogue order, category similarity, slugs, names, browser storage, or
fixture-only fields. Where a recipe context would otherwise appear, the
visible UI shows: `Included rental pieces will be confirmed during manual
review.` Setup selection remains visible, grouped, and removable in the
quote summary. `0 pieces` is never shown as an authoritative recipe count.

Issue #319 owns the future authoritative server-side relation, migration,
constraints, RLS, RPC projection, product type, repository mapping, admin
editing, and production data.
