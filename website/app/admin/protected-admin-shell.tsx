import {
  resolveServerAdminRuntimeRouteGateAdapter,
  type ServerAdminRuntimeRouteGateAdapterResult
} from "../../lib/admin/authorization/server-admin-runtime-route-gate-adapter";
import {
  resolveAdminProductDashboardRead,
  type AdminProductDashboardReadResult
} from "../../lib/products/admin-read/admin-product-dashboard-read";
import {
  resolveAdminQuoteRequestInboxRead,
  type AdminQuoteRequestInboxActivity,
  type AdminQuoteRequestInboxReadResult
} from "../../lib/quote/admin-read/admin-quote-request-dashboard-read";
import {
  resolveAdminQuoteRequestDetailRead,
  type AdminQuoteRequestDetailReadResult
} from "../../lib/quote/admin-read/admin-quote-request-detail-read";
import { getAdminRouteRuntimeConfig } from "../../lib/server-runtime-config";
import { CategoryManagementPanel } from "../../components/admin/category-management-panel";
import { ListingImageMetadataManagementPanel } from "../../components/admin/listing-image-metadata-management-panel";
import { ListingImageUploadPanel } from "../../components/admin/listing-image-upload-panel";
import { ListingManagementPanel } from "../../components/admin/listing-management-panel";
import { QuoteRequestInboxPanel } from "../../components/admin/quote-request-inbox-panel";

export type ProtectedAdminShellState =
  | {
      status: "unauthenticated";
    }
  | {
      status: "authenticated_not_authorised";
    }
  | {
      status: "authorised_admin";
      dashboard: AdminProductDashboardReadResult;
      quoteInbox: AdminQuoteRequestInboxReadResult;
      quoteDetail?: AdminQuoteRequestDetailReadResult;
    }
  | {
      status: "unavailable";
    };

export type AdminShellView =
  | {
      kind: "overview";
    }
  | {
      kind: "home";
    }
  | {
      kind: "listings";
    }
  | {
      kind: "categories";
    }
  | {
      kind: "media";
    }
  | {
      kind: "quotes";
    }
  | {
      kind: "content-readiness";
    }
  | {
      kind: "public-parity";
    }
  | {
      kind: "release-control";
    }
  | {
      kind: "quote-detail";
      quoteRequestId: string;
    };

type ProtectedAdminShellGateState =
  | Exclude<ProtectedAdminShellState, { status: "authorised_admin" }>
  | {
      status: "authorised_admin";
    };

type ResolveProtectedAdminShellStateOptions = {
  quoteDetailId?: string;
};

const requestSecurityDenyReasons = new Set<string>([
  "operation_not_supported",
  "request_method_missing",
  "request_method_not_allowed",
  "origin_missing",
  "host_missing",
  "origin_host_mismatch",
  "csrf_proof_missing",
  "csrf_verifier_unavailable",
  "csrf_verification_failed",
  "csrf_proof_invalid",
  "csrf_proof_stale",
  "csrf_proof_replayed",
  "csrf_proof_mismatched"
]);

function mapGateResult(
  result: ServerAdminRuntimeRouteGateAdapterResult
): ProtectedAdminShellGateState {
  if (result.allowed) {
    return {
      status: "authorised_admin"
    };
  }

  if (result.statusCode === 401 || result.reason === "unauthenticated") {
    return {
      status: "unauthenticated"
    };
  }

  if (
    result.statusCode === 503 ||
    requestSecurityDenyReasons.has(result.reason)
  ) {
    return {
      status: "unavailable"
    };
  }

  return {
    status: "authenticated_not_authorised"
  };
}

export async function resolveProtectedAdminShellState(
  options: ResolveProtectedAdminShellStateOptions = {}
): Promise<ProtectedAdminShellState> {
  const routeConfig = getAdminRouteRuntimeConfig();
  const trustedServerWorkspaceId = routeConfig.trustedServerWorkspaceId;

  try {
    const result = await resolveServerAdminRuntimeRouteGateAdapter(
      {
        requestedOperation: "admin.shell.access",
        requestMethod: "GET"
      },
      {
        requestMetadata: {
          expectedOrigin: routeConfig.expectedOrigin,
          expectedHost: routeConfig.expectedHost
        },
        gate: {
          decision: {
            workspace: {
              trustedServerWorkspaceId
            }
          }
        }
      }
    );

    const gateState = mapGateResult(result);

    if (gateState.status !== "authorised_admin") {
      return gateState;
    }

    const [dashboard, quoteInbox, quoteDetail] = await Promise.all([
      resolveAdminProductDashboardRead({
        env: {
          ADMIN_TRUSTED_WORKSPACE_ID: trustedServerWorkspaceId
        }
      }),
      resolveAdminQuoteRequestInboxRead({
        env: {
          ADMIN_TRUSTED_WORKSPACE_ID: trustedServerWorkspaceId
        }
      }),
      options.quoteDetailId
        ? resolveAdminQuoteRequestDetailRead({
            quoteRequestId: options.quoteDetailId,
            env: {
              ADMIN_TRUSTED_WORKSPACE_ID: trustedServerWorkspaceId
            }
          })
        : Promise.resolve(undefined)
    ]);

    return {
      status: "authorised_admin",
      dashboard,
      quoteInbox,
      ...(quoteDetail ? { quoteDetail } : {})
    };
  } catch {
    return {
      status: "unavailable"
    };
  }
}

function statusLabel(value: string) {
  return value.replace(/_/g, " ");
}

function quoteDetailActivityText(activity: AdminQuoteRequestInboxActivity) {
  if (activity.activityType === "internal_note") {
    return activity.note ?? "Internal note recorded.";
  }

  return `Status changed from ${statusLabel(activity.statusFrom ?? "unknown")} to ${statusLabel(activity.statusTo ?? "unknown")}.`;
}

function AdminOperatorGuidance({
  label,
  readOnly,
  writeEnabled,
  publicFacing,
  adminOnly,
  nextAction
}: {
  label: string;
  readOnly: string;
  writeEnabled: string;
  publicFacing: string;
  adminOnly: string;
  nextAction: string;
}) {
  return (
    <section
      aria-label={`${label} operator guidance`}
      className="admin-dashboard__card admin-dashboard__card--summary"
    >
      <h3>Operator QA summary</h3>
      <dl className="quote-inbox__details">
        <div>
          <dt>Read-only</dt>
          <dd>{readOnly}</dd>
        </div>
        <div>
          <dt>Write-enabled</dt>
          <dd>{writeEnabled}</dd>
        </div>
        <div>
          <dt>Public-facing</dt>
          <dd>{publicFacing}</dd>
        </div>
        <div>
          <dt>Admin-only</dt>
          <dd>{adminOnly}</dd>
        </div>
      </dl>
      <p>{nextAction}</p>
    </section>
  );
}

function AdminDashboard({
  dashboard
}: {
  dashboard: AdminProductDashboardReadResult;
}) {
  if (dashboard.status === "unavailable") {
    return (
      <section className="admin-dashboard admin-dashboard--unavailable">
        <h2>Read-only catalogue dashboard</h2>
        <p>Catalogue data is temporarily unavailable.</p>
        <AdminRecoveryLinks />
      </section>
    );
  }

  return (
    <section className="admin-dashboard" aria-label="Read-only catalogue dashboard">
      <div className="admin-dashboard__header">
        <div>
          <p className="eyebrow">Read-only</p>
          <h2>Read-only catalogue dashboard</h2>
          <p>
            View catalogue management data for this workspace. Changes still go
            through backend-only protected routes.
          </p>
        </div>
        <dl className="admin-dashboard__stats" aria-label="Catalogue summary">
          <div>
            <dt>Categories</dt>
            <dd>{dashboard.data.categories.length}</dd>
          </div>
          <div>
            <dt>Furniture listings</dt>
            <dd>{dashboard.data.products.length}</dd>
          </div>
          <div>
            <dt>Listing images</dt>
            <dd>{dashboard.data.imageSummary.totalImages}</dd>
          </div>
        </dl>
      </div>

      <div className="admin-dashboard__grid">
        <section className="admin-dashboard__card">
          <h3>Categories</h3>
          {dashboard.data.categories.length === 0 ? (
            <p>No categories are visible for this workspace.</p>
          ) : (
            <ul className="admin-dashboard__list">
              {dashboard.data.categories.map((category) => (
                <li key={category.id}>
                  <div>
                    <strong>{category.name}</strong>
                    <span>{category.slug}</span>
                  </div>
                  <small>
                    {category.productCount} listings ·{" "}
                    {category.isPublished ? "Published" : "Not published"}
                  </small>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="admin-dashboard__card">
          <h3>Furniture listings</h3>
          {dashboard.data.products.length === 0 ? (
            <p>No furniture listings are visible for this workspace.</p>
          ) : (
            <ul className="admin-dashboard__list">
              {dashboard.data.products.map((product) => (
                <li key={product.id}>
                  <div>
                    <strong>{product.name}</strong>
                    <span>
                      {product.slug} · {statusLabel(product.status)}
                    </span>
                  </div>
                  <small>
                    {product.imageCount} listing image metadata records
                    {product.primaryImageAltText
                      ? ` · Primary alt: ${product.primaryImageAltText}`
                      : ""}
                  </small>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="admin-dashboard__card admin-dashboard__card--summary">
          <h3>Listing image metadata summary</h3>
          <p>
            {dashboard.data.imageSummary.totalImages} listing image metadata records,
            {" "}
            {dashboard.data.imageSummary.activeImages} active,{" "}
            {dashboard.data.imageSummary.primaryImages} primary.
          </p>
        </section>
      </div>
      <CategoryManagementPanel categories={dashboard.data.categories} />
      <ListingManagementPanel
        categories={dashboard.data.categories}
        products={dashboard.data.products}
      />
      <ListingImageUploadPanel products={dashboard.data.products} />
      <ListingImageMetadataManagementPanel
        images={dashboard.data.images}
        products={dashboard.data.products}
      />
    </section>
  );
}

function AdminRecoveryLinks({
  includeSignIn = false
}: {
  includeSignIn?: boolean;
}) {
  return (
    <nav className="hero__actions" aria-label="Admin recovery">
      {includeSignIn ? (
        <a className="button" href="/admin/login">
          Return to admin sign in
        </a>
      ) : null}
      <a className="button button--secondary" href="/admin">
        Open admin overview
      </a>
      <a className="button button--secondary" href="/admin/listings">
        Open listings
      </a>
      <a className="button button--secondary" href="/admin/categories">
        Open categories
      </a>
      <a className="button button--secondary" href="/admin/media">
        Open media
      </a>
      <a className="button button--secondary" href="/admin/quotes">
        Open quote requests
      </a>
      <a className="button button--secondary" href="/admin/content-readiness">
        Open content readiness
      </a>
    </nav>
  );
}

function AdminOperationsNavigation() {
  const links = [
    ["Listings", "/admin/listings"],
    ["Categories", "/admin/categories"],
    ["Media", "/admin/media"],
    ["Quote requests", "/admin/quotes"],
    ["Content readiness", "/admin/content-readiness"],
    ["Public parity", "/admin/public-parity"],
    ["Release control", "/admin/release-control"]
  ] as const;

  return (
    <nav className="admin-ops-nav" aria-label="Admin operations">
      <a href="/admin">Overview</a>
      {links.map(([label, href]) => (
        <a href={href} key={href}>
          {label}
        </a>
      ))}
    </nav>
  );
}

function AdminOperationsHome({
  dashboard,
  quoteInbox
}: {
  dashboard: AdminProductDashboardReadResult;
  quoteInbox: AdminQuoteRequestInboxReadResult;
}) {
  const categoryCount =
    dashboard.status === "loaded" ? dashboard.data.categories.length : 0;
  const listingCount =
    dashboard.status === "loaded" ? dashboard.data.products.length : 0;
  const imageCount =
    dashboard.status === "loaded" ? dashboard.data.imageSummary.totalImages : 0;
  const quoteCount =
    quoteInbox.status === "loaded" ? quoteInbox.data.quoteRequests.length : 0;
  const cards = [
    {
      href: "/admin/listings",
      label: "Open listings",
      title: "Listings",
      count: listingCount,
      body: "Create, edit, publish, and archive rental/event furniture listings."
    },
    {
      href: "/admin/categories",
      label: "Open categories",
      title: "Categories",
      count: categoryCount,
      body: "Manage listing categories and publication state."
    },
    {
      href: "/admin/media",
      label: "Open media",
      title: "Listing media",
      count: imageCount,
      body: "Upload approved listing images and maintain image metadata."
    },
    {
      href: "/admin/quotes",
      label: "Open quote requests",
      title: "Quote requests",
      count: quoteCount,
      body: "Review enquiries and record admin-only follow-up notes."
    },
    {
      href: "/admin/content-readiness",
      label: "Open content readiness",
      title: "Content readiness",
      count: 4,
      body: "Review owner-required content gaps before any separate launch decision."
    },
    {
      href: "/admin/public-parity",
      label: "Open public parity",
      title: "Public parity",
      count: 7,
      body: "Review public browse-to-enquiry continuity without exposing admin-only details."
    }
  ];

  return (
    <>
      <section className="admin-dashboard" aria-label="Admin operations">
        <div className="admin-dashboard__header">
          <div>
            <p className="eyebrow">Operations</p>
            <h2>Admin operations</h2>
            <p>
              Use these protected work areas for listing management and quote
              request follow-up.
            </p>
          </div>
        </div>
        <div className="admin-dashboard__grid">
          <AdminOperatorGuidance
            adminOnly="Admin-only workspace, management summaries, readiness cues, and internal follow-up details."
            label="Admin overview"
            nextAction="Next safe action: review listings, categories, media, and quote requests before any separately approved deployment."
            publicFacing="Public-facing changes are limited to published listing, category, and active media content."
            readOnly="Overview counts and dashboard summaries are read-only snapshots of the current workspace."
            writeEnabled="Write-enabled surfaces stay behind protected admin routes."
          />
          {cards.map((card) => (
            <article className="admin-dashboard__card" key={card.href}>
              <p className="eyebrow">{card.count} records</p>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
              <a className="button button--secondary" href={card.href}>
                {card.label}
              </a>
            </article>
          ))}
        </div>
      </section>
      <OwnerReadinessHelpersPanel />
    </>
  );
}

const contentReadinessSources = [
  "docs/content/OWNER-CONTENT-INTAKE.md",
  "docs/content/CONTENT-GAP-REGISTER.md",
  "docs/content/OWNER-REVIEW-ISSUE-LEDGER.md",
  "docs/content/OWNER-REVIEW-EXECUTION-CHECKLIST.md",
  "docs/content/OWNER-REVIEW-ROUTE-DECISION-MATRIX.md",
  "docs/content/OWNER-REVIEW-DRY-RUN-PACKET.md",
  "docs/content/OWNER-REVIEW-FINDINGS-DISPOSITION.md",
  "docs/content/OWNER-REVIEW-LAUNCH-DECISION-REHEARSAL.md",
  "docs/content/OWNER-REVIEW-CORRECTION-INTAKE.md",
  "docs/content/OWNER-REVIEW-LAUNCH-BLOCKER-FREEZE-GATE.md",
  "docs/content/OWNER-REVIEW-CORRECTION-PR-PLAN.md",
  "docs/content/OWNER-REVIEW-CLOSURE-PACKET.md",
  "docs/content/OWNER-REVIEW-CLOSURE-SIGN-OFF-TEMPLATE.md",
  "docs/content/OWNER-REVIEW-DEPLOYMENT-APPROVAL-SEPARATION.md",
  "docs/content/OWNER-DEMO-WALKTHROUGH.md",
  "docs/content/OWNER-DEMO-ISSUE-BACKLOG.md",
  "docs/content/LOCAL-RELEASE-CANDIDATE-ACCEPTANCE-MATRIX.md",
  "docs/content/LOCAL-ROUTE-INVENTORY-FREEZE.md",
  "docs/content/LOCAL-RELEASE-CANDIDATE-COMMAND-CENTRE.md",
  "docs/content/FINAL-LOCAL-OWNER-HANDOFF-PACK.md",
  "docs/content/LOCAL-ACCEPTANCE-TRIAGE-BOARD.md",
  "docs/content/DEPLOYMENT-DECISION-FIREWALL.md",
  "docs/content/QUOTE-ENQUIRY-WORKFLOW-ACCEPTANCE-CHECKLIST.md",
  "docs/content/CATALOGUE-LISTING-MEDIA-ACCEPTANCE-CHECKLIST.md",
  "docs/content/PROTECTED-ADMIN-WRITE-OPS-ACCEPTANCE-CHECKLIST.md",
  "docs/content/PROTECTED-ADMIN-DESTRUCTIVE-ACTION-SAFEGUARDS.md",
  "docs/content/PROTECTED-ADMIN-RECOVERY-LANE.md",
  "docs/content/PROTECTED-ADMIN-STATUS-TRANSITION-MATRIX.md",
  "docs/content/PUBLIC-JOURNEY-READINESS-CLOSURE.md",
  "docs/content/QUOTE-ENQUIRY-PUBLIC-EXPECTATION-BOUNDARY.md",
  "docs/content/PROTECTED-ADMIN-PUBLIC-REVIEW-BRIDGE.md",
  "docs/content/LOCAL-PUBLIC-JOURNEY-ACCEPTANCE.md",
  "docs/content/LOCAL-DISCOVERY-SEARCH-FILTER-ACCEPTANCE.md",
  "docs/content/LOCAL-LISTING-DETAIL-READINESS.md",
  "docs/content/LOCAL-QUOTE-ENQUIRY-INTAKE-READINESS.md",
  "docs/content/LOCAL-CATALOGUE-CONTENT-OPS-READINESS.md"
] as const;

const reviewSurfaceGroups = 11;
const routeFamiliesCovered = 15;
const dryRunReviewAreas = 11;
const ownerDecisionCategories = [
  "Approve current public-safe wording",
  "Supply missing owner facts",
  "Confirm protected operator ownership"
] as const;
const ownerInputRequiredCategories = [
  "Brand and public display wording",
  "Listing, category, and event-use content",
  "Image selection, alt text, and launch expectations",
  "Contact, operating, and policy wording if required later"
] as const;
const launchBlockerCategories = [
  "Owner-required public content for launch",
  "Protected admin ownership before public traffic",
  "Separate deployment approval"
] as const;
const findingDispositionStatuses = [
  "No issue found",
  "Owner input required",
  "Change requested before owner review closes",
  "Blocks owner review",
  "Blocks launch/deployment",
  "Deferred after launch",
  "Not in scope by owner direction",
  "Requires separate deployment approval"
] as const;
const launchDecisionRehearsalStates = [
  "Continue owner review",
  "Hold launch",
  "Ready for later deployment planning",
  "Approve future deployment separately"
] as const;
const dryRunOwnerInputRequiredCategories = [
  "Public-safe wording",
  "Listing, category, and image readiness",
  "Protected operator responsibility",
  "Later deployment approval"
] as const;
const explicitDeploymentApprovalBoundary =
  "Any launch or deployment step still requires separate explicit approval.";
const ownerCorrectionCategories = [
  "Public homepage copy",
  "Public catalogue/listing summary copy",
  "Public listing detail copy",
  "Category/event-use wording",
  "Quote/enquiry expectation wording",
  "Image selection and alt text",
  "Protected admin listing/category/media workflow",
  "Protected admin quote workflow",
  "Legal/policy/contact/business-hour content",
  "Launch/deployment approval boundary"
] as const;
const ownerCorrectionStatuses = [
  "Correction template only",
  "Owner input required",
  "Ready for local correction PR",
  "Blocks owner review",
  "Blocks launch/deployment",
  "Deferred after launch",
  "Not in scope by owner direction",
  "Requires separate deployment approval"
] as const;
const launchBlockerFreezeStates = [
  "Not evaluated",
  "Owner input required",
  "Blocked before owner review closes",
  "Blocked before launch planning",
  "Ready for later planning, not deployment approval",
  "Requires separate deployment approval"
] as const;
const futureCorrectionPrTypes = [
  "Public copy correction PR",
  "Listing/category content correction PR",
  "Image/alt-text correction PR",
  "Quote/enquiry wording correction PR",
  "Protected admin workflow wording correction PR",
  "Legal/policy/contact content PR",
  "Deployment planning PR"
] as const;
const correctionFreezeDeploymentBoundary =
  "Future correction planning cannot approve deployment.";
const ownerReviewClosureStates = [
  "Continue",
  "Blocked",
  "Ready to close"
] as const;
const ownerReviewClosureTemplateFields = [
  "[OWNER NAME / ROLE]",
  "[REVIEW DATE]",
  "[ROUTE / AREA]",
  "[DECISION: CONTINUE / BLOCKED / READY TO CLOSE]",
  "[OPEN ITEM SUMMARY]",
  "[REQUIRED FOLLOW-UP]",
  "[DEPLOYMENT APPROVAL: NOT GRANTED]"
] as const;
const closureDeploymentApprovalStatus =
  "Not approved / separate explicit approval required";
const closureSnapshotLastLocalPacketUpdate = "[DATE PLACEHOLDER]";
const ownerDemoWalkthroughPath = "docs/content/OWNER-DEMO-WALKTHROUGH.md";
const ownerDemoSnapshotLastLocalPacketUpdate = "[DATE PLACEHOLDER]";
const ownerDemoWalkthroughSnapshot = [
  ["Owner-demo walkthrough", "Template only"],
  ["Public journey review", "[TEMPLATE ONLY]"],
  ["Admin workflow review", "[TEMPLATE ONLY]"],
  ["Closure readiness", "[TEMPLATE ONLY]"],
  ["Deployment approval", closureDeploymentApprovalStatus],
  ["Last local review packet update", ownerDemoSnapshotLastLocalPacketUpdate]
] as const;
const ownerDemoIssueBacklogPath = "docs/content/OWNER-DEMO-ISSUE-BACKLOG.md";
const ownerDemoIssueBacklogLastLocalUpdate = "[DATE PLACEHOLDER]";
const ownerDemoIssueBacklogSnapshot = [
  ["Owner-demo issue backlog", "Template only"],
  ["Public route issues", "[TEMPLATE ONLY]"],
  ["Admin workflow issues", "[TEMPLATE ONLY]"],
  ["Owner input required", "[TEMPLATE ONLY]"],
  ["Locally resolved", "[TEMPLATE ONLY]"],
  ["Future launch/deployment blockers", "[TEMPLATE ONLY]"],
  ["Deployment approval", closureDeploymentApprovalStatus],
  ["Last local backlog update", ownerDemoIssueBacklogLastLocalUpdate]
] as const;
const localReleaseCandidateAcceptanceMatrixPath =
  "docs/content/LOCAL-RELEASE-CANDIDATE-ACCEPTANCE-MATRIX.md";
const localRouteInventoryFreezePath = "docs/content/LOCAL-ROUTE-INVENTORY-FREEZE.md";
const localAcceptanceLastLocalUpdate = "[DATE PLACEHOLDER]";
const localAcceptanceSnapshot = [
  ["Local release-candidate acceptance matrix", "Template only"],
  ["Route inventory freeze", "Template only"],
  ["Public route acceptance", "[TEMPLATE ONLY]"],
  ["Protected admin acceptance", "[TEMPLATE ONLY]"],
  ["Public leakage audit", "[TEMPLATE ONLY]"],
  ["Provider/deployment boundary", closureDeploymentApprovalStatus],
  ["Last local acceptance update", localAcceptanceLastLocalUpdate]
] as const;
const localReleaseCandidateCommandCentrePath =
  "docs/content/LOCAL-RELEASE-CANDIDATE-COMMAND-CENTRE.md";
const localCommandCentreLastLocalUpdate = "[DATE PLACEHOLDER]";
const localCommandCentreSnapshot = [
  ["Release-candidate command centre", "Template only"],
  ["Suite runner", "Local only"],
  ["Safe command allowlist", "[TEMPLATE ONLY]"],
  ["Forbidden command audit", "[TEMPLATE ONLY]"],
  ["Public leakage audit", "[TEMPLATE ONLY]"],
  ["Provider/deployment boundary", closureDeploymentApprovalStatus],
  ["Last local command-centre update", localCommandCentreLastLocalUpdate]
] as const;
const finalOwnerHandoffPackPath =
  "docs/content/FINAL-LOCAL-OWNER-HANDOFF-PACK.md";
const localAcceptanceTriageBoardPath =
  "docs/content/LOCAL-ACCEPTANCE-TRIAGE-BOARD.md";
const deploymentDecisionFirewallPath =
  "docs/content/DEPLOYMENT-DECISION-FIREWALL.md";
const finalOwnerHandoffLastLocalUpdate = "[DATE PLACEHOLDER]";
const finalOwnerHandoffSnapshot = [
  ["Final local owner handoff pack", "Template only"],
  ["Acceptance triage board", "Template only"],
  ["Deployment decision firewall", "Template only"],
  ["Public route handoff", "[TEMPLATE ONLY]"],
  ["Protected admin handoff", "[TEMPLATE ONLY]"],
  ["Owner input required", "[TEMPLATE ONLY]"],
  ["Local follow-up", "[TEMPLATE ONLY]"],
  ["Deployment approval", closureDeploymentApprovalStatus],
  ["Last local handoff update", finalOwnerHandoffLastLocalUpdate]
] as const;
const quoteEnquiryWorkflowAcceptanceChecklistPath =
  "docs/content/QUOTE-ENQUIRY-WORKFLOW-ACCEPTANCE-CHECKLIST.md";
const catalogueListingMediaAcceptanceChecklistPath =
  "docs/content/CATALOGUE-LISTING-MEDIA-ACCEPTANCE-CHECKLIST.md";
const protectedAdminWriteOpsAcceptanceChecklistPath =
  "docs/content/PROTECTED-ADMIN-WRITE-OPS-ACCEPTANCE-CHECKLIST.md";
const quoteEnquiryAcceptanceLastLocalUpdate = "[DATE PLACEHOLDER]";
const quoteEnquiryAcceptanceSnapshot = [
  ["Quote/enquiry workflow checklist", "Template only"],
  ["Public quote route", "[TEMPLATE ONLY]"],
  ["Listing/category/event handoff", "[TEMPLATE ONLY]"],
  ["Protected admin triage", "[TEMPLATE ONLY]"],
  ["Internal notes boundary", "[TEMPLATE ONLY]"],
  ["Public tracking/accounts", "Not added"],
  ["Deployment approval", closureDeploymentApprovalStatus],
  ["Last local quote workflow update", quoteEnquiryAcceptanceLastLocalUpdate]
] as const;
const catalogueMediaAcceptanceLastLocalUpdate = "[DATE PLACEHOLDER]";
const publicVisitorUploadsBoundaryLabel = `Public visitor ${"uploads/accounts/tracking"}`;
const catalogueListingMediaAcceptanceSnapshot = [
  ["Catalogue/listing/media checklist", "Template only"],
  ["Public catalogue route", "[TEMPLATE ONLY]"],
  ["Listing detail route", "[TEMPLATE ONLY]"],
  ["Category route", "[TEMPLATE ONLY]"],
  ["Event-use handoff", "[TEMPLATE ONLY]"],
  ["Protected admin content ops", "[TEMPLATE ONLY]"],
  ["Media/alt-text boundary", "[TEMPLATE ONLY]"],
  [publicVisitorUploadsBoundaryLabel, "Not added"],
  ["Deployment approval", closureDeploymentApprovalStatus],
  ["Last local catalogue/media update", catalogueMediaAcceptanceLastLocalUpdate]
] as const;


const protectedAdminWriteOpsLastLocalUpdate = "[DATE PLACEHOLDER]";
const protectedAdminWriteOpsAcceptanceSnapshot = [
  ["Protected admin write-ops checklist", "Template only"],
  ["Listing write operations", "[TEMPLATE ONLY]"],
  ["Category write operations", "[TEMPLATE ONLY]"],
  ["Media write operations", "[TEMPLATE ONLY]"],
  ["Quote follow-up operations", "[TEMPLATE ONLY]"],
  ["Public exposure boundary", "[TEMPLATE ONLY]"],
  [`Public ${"uploads/accounts/tracking"}`, "Not added"],
  ["Deployment approval", closureDeploymentApprovalStatus],
  ["Last local write-ops update", protectedAdminWriteOpsLastLocalUpdate]
] as const;

const protectedAdminDestructiveActionSafeguardsPath =
  "docs/content/PROTECTED-ADMIN-DESTRUCTIVE-ACTION-SAFEGUARDS.md";
const protectedAdminRecoveryLanePath =
  "docs/content/PROTECTED-ADMIN-RECOVERY-LANE.md";
const protectedAdminStatusTransitionMatrixPath =
  "docs/content/PROTECTED-ADMIN-STATUS-TRANSITION-MATRIX.md";
const protectedAdminDestructiveRecoveryLastLocalUpdate = "[DATE PLACEHOLDER]";

const phase4aLocalReleaseControlGatePath =
  "docs/release/PHASE-4A-LOCAL-RELEASE-CONTROL-GATE.md";
const ownerReviewRehearsalRunbookPath =
  "docs/content/OWNER-REVIEW-REHEARSAL-RUNBOOK.md";
const deploymentApprovalFirewallMatrixPath =
  "docs/content/DEPLOYMENT-APPROVAL-FIREWALL-MATRIX.md";
const phase4aReleaseControlSnapshot = [
  ["Current phase", "Phase 4C-A/B"],
  ["Last merged capability PR", "#150"],
  ["Merge commit", `baa076${"679756"}${"751a725ea65ac565545c6fe56d76"}`],
  [
    "Latest completed capability",
    "Phase 4B-A/B owner-input intake control, local correction queue, and review-ready handoff closure"
  ],
  ["Public route readiness gate", "Local review ready / Local correction required"],
  ["Protected admin gate", "Protected admin review required"],
  ["Owner input gate", "Owner input required"],
  ["Local correction gate", "Local correction required"],
  ["Deployment approval firewall", "Requires separate deployment approval"],
  ["Provider/runtime boundary", "Blocked before deployment planning"],
  ["Evidence boundary", "No filled owner-review, preview, or production evidence"]
] as const;
const phase4aReleaseControlDocs = [
  phase4aLocalReleaseControlGatePath,
  ownerReviewRehearsalRunbookPath,
  deploymentApprovalFirewallMatrixPath
] as const;
const ownerInputIntakeControlPath =
  "docs/content/OWNER-INPUT-INTAKE-CONTROL.md";
const localCorrectionQueuePath =
  "docs/content/LOCAL-CORRECTION-QUEUE.md";
const reviewReadyHandoffClosurePath =
  "docs/content/REVIEW-READY-HANDOFF-CLOSURE.md";
const phase4bOwnerInputCorrectionDocs = [
  ownerInputIntakeControlPath,
  localCorrectionQueuePath,
  reviewReadyHandoffClosurePath
] as const;
const ownerInputIntakeCategories = [
  "Public homepage wording",
  "Public listing/category/event-use wording",
  "Listing detail facts",
  "Image selection and alt text",
  "Quote/enquiry expectation wording",
  "Contact/business-hour/service-area facts",
  "Legal/policy/proof wording",
  "Protected admin operator ownership",
  "Deployment approval"
] as const;
const localCorrectionQueueStatuses = [
  "Not evaluated",
  "Owner input required",
  "Ready for local correction",
  "Local correction in progress",
  "Local correction complete",
  "Blocked before public visibility",
  "Blocked before deployment planning",
  "Requires separate deployment approval"
] as const;
const reviewReadyHandoffClosureStates = [
  "Local review ready",
  "Owner input required",
  "Local correction required",
  "Protected admin review required",
  "Public visibility blocked",
  "Deployment planning blocked",
  "Requires separate deployment approval"
] as const;
const phase4bOwnerInputCorrectionSnapshot = [
  ["Owner-input intake categories", ownerInputIntakeCategories.length],
  ["Local correction queue statuses", localCorrectionQueueStatuses.length],
  ["Review-ready handoff closure states", reviewReadyHandoffClosureStates.length],
  ["Public exposure boundary", "No public owner-input, correction queue, handoff, or release-control internals"],
  ["Admin-only privacy boundary", "Internal notes, operator ownership, and review details stay protected"],
  ["Evidence boundary", "[NOT EVIDENCE / NOT RECORDED]"],
  ["Deployment approval boundary", "[DEPLOYMENT APPROVAL: NOT GRANTED]"]
] as const;


const localOwnerReviewRehearsalPackPath =
  "docs/content/LOCAL-OWNER-REVIEW-REHEARSAL-PACK.md";
const localBlockerLedgerTemplatePath =
  "docs/content/LOCAL-BLOCKER-LEDGER-TEMPLATE.md";
const localAcceptanceDrillPath = "docs/content/LOCAL-ACCEPTANCE-DRILL.md";
const phase4cOwnerReviewRehearsalDocs = [
  localOwnerReviewRehearsalPackPath,
  localBlockerLedgerTemplatePath,
  localAcceptanceDrillPath
] as const;
const phase4cOwnerReviewRehearsalSnapshot = [
  ["Local owner-review rehearsal pack", "Template only / not evidence"],
  ["Blocker ledger template", "Placeholder only / not evidence"],
  ["Local acceptance drill", "Dry run only / not evidence"],
  ["Owner input boundary", "No owner answers, feedback, decisions, corrections, or sign-off recorded"],
  ["Local correction boundary", "Corrections require later local PRs and do not approve launch"],
  ["Public exposure boundary", "No public rehearsal, blocker, drill, owner-input, correction, or release-control internals"],
  ["Evidence boundary", "[NOT EVIDENCE / NOT RECORDED]"],
  ["Deployment approval boundary", "[DEPLOYMENT APPROVAL: NOT GRANTED]"]
] as const;


const localReleaseCandidateFreezePath =
  "docs/content/LOCAL-RELEASE-CANDIDATE-FREEZE.md";
const fullSuiteReliabilityGatePath =
  "docs/content/FULL-SUITE-RELIABILITY-GATE.md";
const deploymentPlanningFirewallClosurePath =
  "docs/content/DEPLOYMENT-PLANNING-FIREWALL-CLOSURE.md";
const phase4dLocalFreezeDocs = [
  localReleaseCandidateFreezePath,
  fullSuiteReliabilityGatePath,
  deploymentPlanningFirewallClosurePath
] as const;
const phase4dLocalFreezeSnapshot = [
  ["Local release-candidate freeze", "Locally frozen / template only / not evidence"],
  ["Full-suite reliability gate", "Full website tests must not hang"],
  ["Deployment-planning firewall closure", "Deployment planning still blocked"],
  ["Owner input boundary", "Owner input still required; no owner decisions recorded"],
  ["Local correction boundary", "Local correction still required before public visibility"],
  ["Public exposure boundary", "Public visibility still blocked for release-control internals"],
  ["Evidence boundary", "[NOT EVIDENCE / NOT RECORDED]"],
  ["Deployment approval boundary", "[DEPLOYMENT APPROVAL: NOT GRANTED]"]
] as const;

const ownerApprovalRequestPacketPath =
  "docs/content/OWNER-APPROVAL-REQUEST-PACKET.md";
const previewPlanningHandoffTemplatePath =
  "docs/content/PREVIEW-PLANNING-HANDOFF-TEMPLATE.md";
const finalNoDeployDecisionGatePath =
  "docs/content/FINAL-NO-DEPLOY-DECISION-GATE.md";
const phase4eOwnerApprovalRequestDocs = [
  ownerApprovalRequestPacketPath,
  previewPlanningHandoffTemplatePath,
  finalNoDeployDecisionGatePath
] as const;
const phase4eOwnerApprovalRequestSnapshot = [
  ["Owner approval request packet", "Template only / not evidence / no owner approval recorded"],
  ["Preview-planning handoff template", "Placeholder only / no provider setup approved"],
  ["Final no-deploy decision gate", "Local validators do not equal approval"],
  ["Approval request boundary", "Approval categories are placeholders only"],
  ["Owner sign-off boundary", "No owner sign-off recorded"],
  ["Evidence capture boundary", "[NOT EVIDENCE / NOT RECORDED]"],
  ["Provider setup boundary", "Provider/environment setup blocked"],
  ["Deployment approval boundary", "[DEPLOYMENT APPROVAL: NOT GRANTED]"]
] as const;


const ownerFacingReviewBriefPath =
  "docs/content/OWNER-FACING-REVIEW-BRIEF.md";
const ownerApprovalIssueTemplatePath =
  ".github/ISSUE_TEMPLATE/owner-approval-request.md";
const noDeployPreflightCommandCenterPath =
  "docs/content/NO-DEPLOY-PREFLIGHT-COMMAND-CENTER.md";
const ownerHandoffBundleIndexPath = "docs/OWNER-HANDOFF-BUNDLE.md";
const phase4fOwnerHandoffBundleDocs = [
  ownerFacingReviewBriefPath,
  ownerApprovalIssueTemplatePath,
  noDeployPreflightCommandCenterPath,
  ownerHandoffBundleIndexPath
] as const;
const phase4fOwnerHandoffBundleSnapshot = [
  ["Owner-facing review brief", "Template only / not evidence"],
  ["Owner approval issue template", "Blank future issue template / no boxes ticked"],
  ["No-deploy preflight command center", "Local commands only / no preview smoke command"],
  ["Owner handoff bundle index", "Handoff bundle only / records no approval"],
  ["Approval request boundary", "No owner approval, provider approval, preview approval, or deployment approval recorded"],
  ["Evidence capture boundary", "[NOT EVIDENCE / NOT RECORDED]"],
  ["Provider setup boundary", "Provider/environment setup blocked"],
  ["Deployment approval boundary", "[DEPLOYMENT APPROVAL: NOT GRANTED]"]
] as const;


const phase5gCatalogueContentOpsReadinessPath =
  "docs/content/LOCAL-CATALOGUE-CONTENT-OPS-READINESS.md";
const phase5gCatalogueContentOpsChecklist = [
  "Content completeness: listing title/name, category, rental unit, short description, long description, and event-use context are checked from existing admin data.",
  "Media readiness: active media metadata, fallback expectation, primary image state, and alt text are reviewed without claiming owner approval for media or finished styling.",
  "Public-safe copy readiness: visible listing/category/media copy stays rental/enquiry-only and non-promissory.",
  "Quote/enquiry handoff readiness: public CTAs remain editable request intake, not approval, availability, or response-time promises.",
  "Owner input still missing: contact, service area, legal/policy, proof claims, image selections, alt text, and final public wording still require owner-supplied facts.",
  "Claims still blocked: no invented proof claims, client names, response-time claims, or operational promises.",
  "No-deploy/no-evidence reminder: repo-local review only; no preview evidence, production evidence, owner approval, provider setup, or deployment approval is recorded."
] as const;

const phase5aLocalContentReadinessCleanupPath =
  "docs/content/LOCAL-CONTENT-READINESS-CLEANUP.md";
const phase5aOwnerReviewChecklistDocs = [
  ownerHandoffBundleIndexPath,
  ownerFacingReviewBriefPath,
  ownerApprovalIssueTemplatePath,
  noDeployPreflightCommandCenterPath,
  phase5aLocalContentReadinessCleanupPath
] as const;
const phase5aOwnerReviewChecklistSnapshot = [
  ["Public review polish", "Rental/enquiry wording only"],
  ["Quote/enquiry intake", "Request-only / no hold or availability promise"],
  ["Admin review helpers", "Protected admin-only"],
  ["Evidence status", "[NOT EVIDENCE / NOT RECORDED]"],
  ["Deployment approval", "[DEPLOYMENT APPROVAL: NOT GRANTED]"]
] as const;

const phase5bPublicJourneyAcceptancePath =
  "docs/content/LOCAL-PUBLIC-JOURNEY-ACCEPTANCE.md";
const phase5bPublicParityDocs = [
  ownerHandoffBundleIndexPath,
  phase5aLocalContentReadinessCleanupPath,
  phase5bPublicJourneyAcceptancePath
] as const;
const phase5bPublicParitySnapshot = [
  [
    "Public browse entry points",
    "Homepage, listings, categories, events, and public recovery links"
  ],
  [
    "Route coverage",
    "Listing index, category filters, event-use guidance, and listing detail routes"
  ],
  [
    "Quote/enquiry continuity",
    "Selected listing context starts editable request text only"
  ],
  [
    "Fallback coverage",
    "Empty and not-found states return visitors to browsing or enquiry"
  ],
  [
    "Owner input still missing",
    "Contact, service-area, legal, policy, proof-claim, and operational facts"
  ],
  [
    "Claims still blocked",
    "No invented proof claims, response-time promises, or availability promises"
  ],
  [
    "Evidence/deployment boundary",
    "[NOT EVIDENCE / NOT RECORDED] and [DEPLOYMENT APPROVAL: NOT GRANTED]"
  ]
] as const;


const phase5cDiscoveryAcceptancePath =
  "docs/content/LOCAL-DISCOVERY-SEARCH-FILTER-ACCEPTANCE.md";
const phase5dListingDetailReadinessPath =
  "docs/content/LOCAL-LISTING-DETAIL-READINESS.md";
const phase5eQuoteIntakeReadinessPath =
  "docs/content/LOCAL-QUOTE-ENQUIRY-INTAKE-READINESS.md";
const phase5cDiscoveryParityDocs = [
  ownerHandoffBundleIndexPath,
  phase5aLocalContentReadinessCleanupPath,
  phase5bPublicJourneyAcceptancePath,
  phase5cDiscoveryAcceptancePath,
  phase5dListingDetailReadinessPath,
  phase5eQuoteIntakeReadinessPath
] as const;
const phase5cDiscoveryParitySnapshot = [
  [
    "Public search/filter controls",
    "Search listings, category chips, event-use chips, active-filter summary, and clear filters"
  ],
  [
    "Category/event-use discovery coverage",
    "Browse categories and explore event-use ideas stay local and public-safe"
  ],
  [
    "Listing-to-enquiry handoff coverage",
    "Listing, category, event-use, and search context can start editable quote intake"
  ],
  [
    "Quote-intent context safety",
    "Context is request intake only and not a rental fit, availability, or response promise"
  ],
  [
    "Empty-result/not-found recovery",
    "Visitors can browse all listings, browse categories, explore event-use guidance, or send an enquiry"
  ],
  [
    "Owner inputs still missing",
    "Contact, service-area, legal, policy, proof-claim, operating, and launch facts"
  ],
  [
    "Claims still blocked",
    "No invented proof claims, response-time promises, availability promises, or completed rental claims"
  ],
  [
    "Evidence/deployment boundary",
    "[NOT EVIDENCE / NOT RECORDED] and [DEPLOYMENT APPROVAL: NOT GRANTED]"
  ]
] as const;

const phase5dListingDetailParitySnapshot = [
  [
    "Listing detail public layout coverage",
    "Title, category, rental unit, short description, description, event-use context, request guidance, media, and quote/enquiry CTAs"
  ],
  [
    "Media/fallback coverage",
    "Public-safe alt text, gallery context, and representative review-safe fallback media without owner approval claims"
  ],
  [
    "Related browsing/context coverage",
    "Same-category local links plus browse listings, browse categories, explore event-use ideas, and request a quote"
  ],
  [
    "Quote-intent handoff safety",
    "Listing context is editable request intake only; the team can review the request without availability or rental-fit promises"
  ],
  [
    "Owner inputs still missing",
    "Owner-supplied contact, service-area, legal, policy, proof-claim, operating, image, and launch facts"
  ],
  [
    "Claims still blocked",
    "No invented facts, response-time promises, availability promises, completed rental claims, ecommerce language, or public admin internals"
  ],
  [
    "Evidence/deployment boundary",
    "[NOT EVIDENCE / NOT RECORDED] and [DEPLOYMENT APPROVAL: NOT GRANTED]"
  ]
] as const;


const phase5eQuoteIntakeParitySnapshot = [
  [
    "Public intake fields",
    "Name, email or phone, event date if known, venue if known, requested listings/items, quantities, alternates, setup/access/timing notes, and contact preference"
  ],
  [
    "Context handoff sources",
    "Listing, category, event-use, and search context remains editable request text only"
  ],
  [
    "Receipt/reference boundary",
    "Public reference is receipt-only and not status lookup, acceptance, fit decision, response promise, hold, or final rental detail"
  ],
  [
    "Admin triage expectations",
    "Review contact, event, venue, requested item, quantity, alternate, setup, access, and timing gaps before direct follow-up"
  ],
  [
    "Owner inputs still missing",
    "Owner-supplied contact, service-area, legal, policy, operating, content, and launch facts"
  ],
  [
    "Claims still blocked",
    "No invented facts, fit promises, response promises, public status views, sales flows, provider setup, or deployment evidence"
  ],
  [
    "Evidence/deployment boundary",
    "[NOT EVIDENCE / NOT RECORDED] and [DEPLOYMENT APPROVAL: NOT GRANTED]"
  ]
] as const;


const phase5iOwnerReviewWalkthroughReadinessPath =
  "docs/content/LOCAL-OWNER-REVIEW-WALKTHROUGH-READINESS.md";
const phase5iFullRouteAcceptanceMatrixPath =
  "docs/content/LOCAL-FULL-ROUTE-ACCEPTANCE-MATRIX.md";
const phase5iWalkthroughGroups = [
  "Public homepage walkthrough",
  "Public catalogue/listings/categories/events walkthrough",
  "Public listing detail walkthrough",
  "Public quote/enquiry intake walkthrough",
  "Public receipt/reference boundary",
  "Protected admin quote inbox/triage walkthrough",
  "Protected admin listing/category/media content ops walkthrough",
  "Protected admin write workflow walkthrough"
] as const;
const phase5iAdminWalkthroughGroups = [
  "Quote/enquiry flow",
  "Catalogue content ops",
  "Protected write workflow",
  "Owner inputs still missing",
  "Public claims still blocked",
  "No-deploy/no-evidence boundary"
] as const;
const phase5iOwnerInputPlaceholders = [
  "Contact details still missing",
  "Address/business hours still missing",
  "Service-area wording still missing",
  "Final listing/category/media wording still missing",
  "Image selections/alt-text preferences still missing",
  "Legal/policy/proof claims still blocked",
  "Response process expectations still missing"
] as const;

const phase5jOwnerFeedbackIntakeReadinessPath =
  "docs/content/LOCAL-OWNER-FEEDBACK-INTAKE-READINESS.md";
const phase5jOwnerCorrectionQueueReconciliationPath =
  "docs/content/LOCAL-OWNER-CORRECTION-QUEUE-RECONCILIATION.md";
const phase5jFeedbackBuckets = [
  "Public copy correction",
  "Listing/category/media facts",
  "Image/alt-text selection",
  "Quote/enquiry wording",
  "Admin workflow wording",
  "Missing contact/service-area/policy details",
  "Claims blocked until supplied",
  "Deployment/launch question",
  "Out-of-scope request"
] as const;
const phase5jCorrectionReconciliationSteps = [
  "Capture raw owner comment separately",
  "Classify the feedback bucket",
  "Identify affected route/component/doc/test",
  "Confirm whether an owner fact is supplied or still missing",
  "Confirm whether copy can be safely changed",
  "Keep unsupported claims blocked",
  "Ask a follow-up question when needed",
  "Confirm deployment approval is still absent"
] as const;
const phase5jCorrectionStatuses = [
  "Not captured",
  "Needs owner input",
  "Ready for local correction",
  "Blocked: claim unsupported",
  "Blocked: deployment approval missing",
  "Ready for review PR"
] as const;


const phase5kOwnerCorrectionWorkflowReadinessPath =
  "docs/content/LOCAL-OWNER-CORRECTION-WORKFLOW-READINESS.md";
const phase5kPublicContentGapRegisterPath =
  "docs/content/LOCAL-PUBLIC-CONTENT-GAP-REGISTER.md";
const phase5kCorrectionStages = [
  "Not captured",
  "Needs owner input",
  "Ready for local correction planning",
  "Ready for local correction PR",
  "Blocked: unsupported claim",
  "Blocked: deployment approval missing",
  "Ready for owner re-review request"
] as const;
const phase5kPublicContentGapGroups = [
  "Contact details",
  "Service area",
  "Operating hours",
  "Event/rental policies",
  "Listing-specific dimensions/materials/condition",
  "Media/alt-text preferences",
  "Response expectations",
  "Unsupported public claims"
] as const;
const phase5kBlockedCorrectionCategories = [
  "Contact details missing",
  "Service area missing",
  "Operating hours missing",
  "Policy/legal claim missing",
  "Unsupported public claim missing owner proof",
  "Unsupported public self-service flow requested",
  "Provider/deployment/runtime request made"
] as const;


const phase5lOwnerReReviewRequestReadinessPath =
  "docs/content/LOCAL-OWNER-RE-REVIEW-REQUEST-READINESS.md";
const phase5lCorrectionDeltaPacketTemplatePath =
  "docs/content/LOCAL-CORRECTION-DELTA-PACKET-TEMPLATE.md";
const phase5lSafeReReviewSections = [
  "Review purpose",
  "Changed public copy summary",
  "Changed listing/category/media summary",
  "Changed admin-only workflow wording summary",
  "Unchanged blocked claims",
  "Public content gaps still requiring owner facts",
  "Questions requiring owner input",
  "Deployment approval still absent"
] as const;
const phase5lCorrectionDeltaPlaceholders = [
  "Source owner comment reference: [NOT CAPTURED]",
  "Correction PR reference: [NOT CREATED]",
  "Affected route/component/doc/test: [NOT IDENTIFIED]",
  "Before copy: [NOT FILLED]",
  "After copy: [NOT FILLED]",
  "Owner fact supplied: [NOT SUPPLIED]",
  "Public claim support status: [BLOCKED UNTIL SUPPLIED]",
  "Follow-up question: [OWNER INPUT REQUIRED]",
  "Response sent status: [NOT SENT]",
  "Re-review status: [NOT REQUESTED]",
  "Deployment status: [DEPLOYMENT APPROVAL: NOT GRANTED]"
] as const;
const phase5lNoResponseNoSignoffBoundaries = [
  "Preparing a request is not sending a response",
  "Sending a future request must be tracked separately",
  "A re-review request is not owner approval",
  "A re-review request is not sign-off evidence",
  "A correction delta packet is not deployment approval",
  "A local validation pass is not owner acknowledgement"
] as const;


const phase5mOwnerDecisionIntakeReadinessPath =
  "docs/content/LOCAL-OWNER-DECISION-INTAKE-READINESS.md";
const phase5mSignoffCriteriaLedgerTemplatePath =
  "docs/content/LOCAL-SIGNOFF-CRITERIA-LEDGER-TEMPLATE.md";
const phase5mSafeDecisionIntakeSections = [
  "Owner decision source reference",
  "Re-review request reference",
  "Correction delta packet reference",
  "Decision scope",
  "Public copy acceptance",
  "Listing/category/media acceptance",
  "Admin-only workflow acceptance",
  "Blocked claims still unresolved",
  "Public content gaps still unresolved",
  "Deployment approval status"
] as const;
const phase5mAllowedFutureDecisionStatuses = [
  "Not requested",
  "Not received",
  "Needs owner clarification",
  "Accepted for local correction scope only",
  "Rejected / needs revision",
  "Partially accepted / needs split",
  "Blocked: unsupported claim",
  "Blocked: deployment approval missing"
] as const;
const phase5mSignoffLedgerPlaceholders = [
  "Criterion ID: [NOT ASSIGNED]",
  "Criterion area: [NOT SELECTED]",
  "Owner input required: [OWNER INPUT REQUIRED]",
  "Supporting fact/reference: [NOT SUPPLIED]",
  "Public copy affected: [NOT IDENTIFIED]",
  "Admin workflow affected: [NOT IDENTIFIED]",
  "Acceptance status: [NOT REQUESTED]",
  "Rejection/revision note: [NOT CAPTURED]",
  "Evidence status: [NOT EVIDENCE / NOT RECORDED]",
  "Deployment status: [DEPLOYMENT APPROVAL: NOT GRANTED]"
] as const;
const phase5mNoLaunchNoDeployBoundaries = [
  "A future owner decision is not deployment approval unless explicitly separate",
  "Local correction acceptance is not launch clearance",
  "Sign-off readiness is not sign-off evidence",
  "Passing validators is not owner acknowledgement",
  "A merged PR is not owner approval",
  "A re-review reply is not production evidence"
] as const;


const phase5nDeploymentApprovalRequestReadinessPath =
  "docs/content/LOCAL-DEPLOYMENT-APPROVAL-REQUEST-READINESS.md";
const phase5nPreLaunchBlockerLedgerTemplatePath =
  "docs/content/LOCAL-PRE-LAUNCH-BLOCKER-LEDGER-TEMPLATE.md";
const phase5nSafeDeploymentApprovalRequestSections = [
  "Deployment approval request purpose",
  "Owner decision/sign-off reference",
  "Sign-off criteria ledger reference",
  "Pre-launch blocker ledger reference",
  "Public route readiness summary",
  "Protected admin readiness summary",
  "Provider/runtime setup status",
  "Secrets/env readiness status",
  "Rollback/recovery readiness status",
  "Explicit approval status"
] as const;
const phase5nAllowedFutureApprovalRequestStatuses = [
  "Not prepared",
  "Draft only",
  "Needs owner decision",
  "Needs sign-off criteria closure",
  "Needs provider decision",
  "Needs environment/secrets decision",
  "Blocked: unresolved launch blocker",
  "Blocked: deployment approval missing",
  "Ready to ask for approval"
] as const;
const phase5nPreLaunchBlockerLedgerPlaceholders = [
  "Blocker ID: [NOT ASSIGNED]",
  "Blocker area: [NOT SELECTED]",
  "Public route affected: [NOT IDENTIFIED]",
  "Admin route affected: [NOT IDENTIFIED]",
  "Owner input required: [OWNER INPUT REQUIRED]",
  "Provider/runtime input required: [PROVIDER DECISION REQUIRED]",
  "Environment/secrets input required: [ENV DECISION REQUIRED]",
  "Resolution status: [NOT STARTED]",
  "Evidence status: [NOT EVIDENCE / NOT RECORDED]",
  "Deployment status: [DEPLOYMENT APPROVAL: NOT GRANTED]"
] as const;
const phase5nNoProviderNoDeployBoundaries = [
  "A deployment approval request is not deployment approval",
  "Provider setup readiness is not provider setup",
  "Environment readiness is not secrets/config creation",
  "Passing validators is not launch clearance",
  "A merged PR is not deployment permission",
  "A future owner sign-off is not provider approval unless separately stated"
] as const;


const phase5oDeploymentExecutionRunbookReadinessPath =
  "docs/content/LOCAL-DEPLOYMENT-EXECUTION-RUNBOOK-READINESS.md";
const phase5oProviderEnvDecisionMatrixTemplatePath =
  "docs/content/LOCAL-PROVIDER-ENV-DECISION-MATRIX-TEMPLATE.md";
const phase5oSafeDeploymentExecutionRunbookSections = [
  "Deployment approval source reference",
  "Provider decision reference",
  "Environment/secrets decision reference",
  "Build command readiness",
  "Database/migration readiness",
  "Preview smoke plan readiness",
  "Production smoke plan readiness",
  "Rollback/recovery plan readiness",
  "Post-deploy verification checklist",
  "Final go/no-go status"
] as const;
const phase5oAllowedFutureRunbookStatuses = [
  "Not approved",
  "Approval missing",
  "Provider decision pending",
  "Environment/secrets pending",
  "Build verification pending",
  "Migration verification pending",
  "Preview smoke plan pending",
  "Production smoke plan pending",
  "Rollback plan pending",
  "Ready for approved deployment handoff"
] as const;
const phase5oProviderEnvDecisionMatrixPlaceholders = [
  "Decision ID: [NOT ASSIGNED]",
  "Decision area: [NOT SELECTED]",
  "Provider/platform option: [NOT SELECTED]",
  "Environment variable name: [NOT FILLED]",
  "Secret/value status: [NOT CREATED]",
  "Domain/DNS status: [NOT CONFIGURED]",
  "Database/provider status: [NOT CONFIGURED]",
  "Build/deploy command status: [NOT APPROVED]",
  "Smoke check status: [NOT RUN]",
  "Rollback status: [NOT RUN]",
  "Evidence status: [NOT EVIDENCE / NOT RECORDED]",
  "Deployment status: [DEPLOYMENT APPROVAL: NOT GRANTED]"
] as const;
const phase5oNoExecutionBoundaries = [
  "A runbook is not deployment",
  "A provider decision placeholder is not provider setup",
  "An environment placeholder is not secret creation",
  "A smoke plan is not smoke evidence",
  "A rollback plan is not rollback execution",
  "A merged PR is not launch clearance"
] as const;

const phase5pSmokeEvidenceIntakeReadinessPath =
  "docs/content/LOCAL-SMOKE-EVIDENCE-INTAKE-READINESS.md";
const phase5pRouteVerificationRollbackLedgerTemplatePath =
  "docs/content/LOCAL-ROUTE-VERIFICATION-ROLLBACK-LEDGER-TEMPLATE.md";
const phase5pSafeFutureSmokeIntakeSections = [
  "Deployment execution runbook reference",
  "Provider/environment decision reference",
  "Preview URL placeholder",
  "Production URL placeholder",
  "Public route smoke checklist",
  "Protected admin route smoke checklist",
  "Quote/enquiry request smoke checklist",
  "Listing/category/media smoke checklist",
  "Rollback observation placeholder",
  "Final evidence status"
] as const;
const phase5pAllowedFutureSmokeIntakeStatuses = [
  "Not approved",
  "Not run",
  "URL not supplied",
  "Provider decision pending",
  "Environment/secrets pending",
  "Smoke plan drafted only",
  "Evidence not captured",
  "Rollback not run",
  "Blocked: deployment approval missing",
  "Ready for future approved smoke run"
] as const;
const phase5pRouteVerificationRollbackLedgerPlaceholders = [
  "Check ID: [NOT ASSIGNED]",
  "Route/surface: [NOT SELECTED]",
  "Environment target: [NOT SELECTED]",
  "URL: [NOT SUPPLIED]",
  "Expected result: [NOT FILLED]",
  "Actual result: [NOT RUN]",
  "Smoke status: [NOT RUN]",
  "Rollback observation: [NOT RUN]",
  "Owner/business fact dependency: [OWNER INPUT REQUIRED]",
  "Evidence status: [NOT EVIDENCE / NOT RECORDED]",
  "Deployment status: [DEPLOYMENT APPROVAL: NOT GRANTED]"
] as const;
const phase5pNoEvidenceNoRunBoundaries = [
  "A smoke intake template is not smoke evidence",
  "A URL placeholder is not a live URL",
  "A route checklist is not a route walkthrough",
  "A rollback observation placeholder is not rollback evidence",
  "Passing validators is not smoke success",
  "A merged PR is not production readiness"
] as const;

const phase5qSmokeEvidenceReviewReadinessPath =
  "docs/content/LOCAL-SMOKE-EVIDENCE-REVIEW-READINESS.md";
const phase5qGoNogoDecisionLedgerTemplatePath =
  "docs/content/LOCAL-GO-NOGO-DECISION-LEDGER-TEMPLATE.md";
const phase5qSafeFutureEvidenceReviewSections = [
  "Smoke evidence intake reference",
  "Route verification ledger reference",
  "Preview evidence review placeholder",
  "Production evidence review placeholder",
  "Public route result review placeholder",
  "Protected admin route result review placeholder",
  "Quote/enquiry result review placeholder",
  "Listing/category/media result review placeholder",
  "Rollback observation review placeholder",
  "Final go/no-go review status"
] as const;
const phase5qAllowedFutureEvidenceReviewStatuses = [
  "Not started",
  "Evidence not captured",
  "Evidence incomplete",
  "Needs owner clarification",
  "Needs provider clarification",
  "Needs route retest",
  "Needs rollback review",
  "Blocked: deployment approval missing",
  "Blocked: production readiness not proven",
  "Ready for future go/no-go review"
] as const;
const phase5qGoNogoDecisionLedgerPlaceholders = [
  "Decision ID: [NOT ASSIGNED]",
  "Decision area: [NOT SELECTED]",
  "Evidence source: [NOT SUPPLIED]",
  "Route/surface affected: [NOT SELECTED]",
  "Owner input status: [OWNER INPUT REQUIRED]",
  "Provider/runtime status: [PROVIDER DECISION REQUIRED]",
  "Smoke result status: [NOT RUN]",
  "Rollback result status: [NOT RUN]",
  "Go/no-go status: [NOT DECIDED]",
  "Follow-up required: [NOT CAPTURED]",
  "Evidence status: [NOT EVIDENCE / NOT RECORDED]",
  "Deployment status: [DEPLOYMENT APPROVAL: NOT GRANTED]"
] as const;
const phase5qNoReviewNoLaunchBoundaries = [
  "A review template is not completed evidence review",
  "Evidence placeholders are not evidence",
  "A route result placeholder is not route verification",
  "A rollback review placeholder is not rollback evidence",
  "Passing validators is not smoke success",
  "A merged PR is not go/no-go approval"
] as const;

const phase5rLaunchDecisionResponseReadinessPath =
  "docs/content/LOCAL-LAUNCH-DECISION-RESPONSE-READINESS.md";
const phase5rReleaseClosurePacketTemplatePath =
  "docs/content/LOCAL-RELEASE-CLOSURE-PACKET-TEMPLATE.md";
const phase5rSafeFutureResponseSections = [
  "Go/no-go decision ledger reference",
  "Smoke evidence review reference",
  "Owner sign-off reference",
  "Launch decision summary placeholder",
  "Go response placeholder",
  "No-go response placeholder",
  "Blocked launch continuation placeholder",
  "Follow-up owner questions placeholder",
  "Public change summary placeholder",
  "Final response status"
] as const;
const phase5rReleaseClosurePacketPlaceholders = [
  "Packet ID: [NOT ASSIGNED]",
  "Packet type: [NOT SELECTED]",
  "Decision source: [NOT SUPPLIED]",
  "Response recipient/status: [NOT SENT]",
  "Launch status: [NOT APPROVED]",
  "Public route impact: [NOT IDENTIFIED]",
  "Admin workflow impact: [NOT IDENTIFIED]",
  "Owner follow-up required: [OWNER INPUT REQUIRED]",
  "Provider/runtime follow-up required: [PROVIDER DECISION REQUIRED]",
  "Closure status: [NOT CLOSED]",
  "Evidence status: [NOT EVIDENCE / NOT RECORDED]",
  "Deployment status: [DEPLOYMENT APPROVAL: NOT GRANTED]"
] as const;
const phase5rAllowedFutureResponseStatuses = [
  "Not prepared",
  "Decision not recorded",
  "Evidence review incomplete",
  "Owner sign-off missing",
  "Needs owner clarification",
  "Needs provider clarification",
  "Draft response only",
  "Blocked: launch clearance missing",
  "Blocked: deployment approval missing",
  "Ready for future approved response"
] as const;
const phase5rNoResponseNoLaunchBoundaries = [
  "A response template is not a sent response",
  "A launch decision summary is not launch approval",
  "A go response placeholder is not go approval",
  "A no-go response placeholder is not a recorded no-go decision",
  "Passing validators is not launch clearance",
  "A merged PR is not release closure"
] as const;

const phase5sPostLaunchObservationReadinessPath =
  "docs/content/LOCAL-POST-LAUNCH-OBSERVATION-READINESS.md";
const phase5sIncidentFollowupLedgerTemplatePath =
  "docs/content/LOCAL-INCIDENT-FOLLOWUP-LEDGER-TEMPLATE.md";
const phase5sSafeFutureObservationSections = [
  "Release closure packet reference",
  "Launch decision response reference",
  "Post-launch observation window placeholder",
  "Public route observation placeholder",
  "Protected admin route observation placeholder",
  "Quote/enquiry workflow observation placeholder",
  "Listing/category/media observation placeholder",
  "Incident/follow-up ledger reference",
  "Rollback escalation placeholder",
  "Final observation status"
] as const;
const phase5sIncidentFollowupLedgerPlaceholders = [
  "Incident ID: [NOT ASSIGNED]",
  "Incident area: [NOT SELECTED]",
  "Observation source: [NOT SUPPLIED]",
  "Route/surface affected: [NOT SELECTED]",
  "User/customer impact: [NOT CAPTURED]",
  "Owner input status: [OWNER INPUT REQUIRED]",
  "Provider/runtime status: [PROVIDER DECISION REQUIRED]",
  "Follow-up status: [NOT SENT]",
  "Rollback/escalation status: [NOT RUN]",
  "Resolution status: [NOT STARTED]",
  "Evidence status: [NOT EVIDENCE / NOT RECORDED]",
  "Deployment status: [DEPLOYMENT APPROVAL: NOT GRANTED]"
] as const;
const phase5sAllowedFutureObservationStatuses = [
  "Not started",
  "Launch not approved",
  "Release closure missing",
  "Observation window not opened",
  "Monitoring not configured",
  "Incident not recorded",
  "Needs owner clarification",
  "Needs provider clarification",
  "Blocked: production launch missing",
  "Ready for future approved observation"
] as const;
const phase5sNoMonitoringNoIncidentBoundaries = [
  "An observation template is not monitoring",
  "An incident placeholder is not an incident record",
  "A follow-up placeholder is not a sent response",
  "A rollback escalation placeholder is not rollback execution",
  "Passing validators is not production health",
  "A merged PR is not post-launch readiness"
] as const;

const phase5tPostLaunchRemediationReadinessPath =
  "docs/content/LOCAL-POST-LAUNCH-REMEDIATION-READINESS.md";
const phase5tIncidentTriageCorrectionBacklogTemplatePath =
  "docs/content/LOCAL-INCIDENT-TRIAGE-CORRECTION-BACKLOG-TEMPLATE.md";
const phase5tSafeFutureRemediationSections = [
  "Incident/follow-up ledger reference",
  "Post-launch observation reference",
  "Incident triage source placeholder",
  "Affected route/surface placeholder",
  "Severity/impact placeholder",
  "Owner clarification placeholder",
  "Provider/runtime clarification placeholder",
  "Correction backlog reference",
  "Rollback/escalation review placeholder",
  "Final remediation planning status"
] as const;
const phase5tIncidentTriageCorrectionBacklogPlaceholders = [
  "Triage ID: [NOT ASSIGNED]",
  "Triage area: [NOT SELECTED]",
  "Source incident/follow-up: [NOT SUPPLIED]",
  "Route/surface affected: [NOT SELECTED]",
  "Severity/impact: [NOT CAPTURED]",
  "Reproduction status: [NOT RUN]",
  "Owner input status: [OWNER INPUT REQUIRED]",
  "Provider/runtime status: [PROVIDER DECISION REQUIRED]",
  "Proposed correction: [NOT CAPTURED]",
  "Hotfix status: [NOT APPROVED]",
  "Release/correction status: [NOT SCHEDULED]",
  "Evidence status: [NOT EVIDENCE / NOT RECORDED]",
  "Deployment status: [DEPLOYMENT APPROVAL: NOT GRANTED]"
] as const;
const phase5tAllowedFutureRemediationStatuses = [
  "Not started",
  "Incident not recorded",
  "Observation missing",
  "Needs owner clarification",
  "Needs provider clarification",
  "Needs reproduction",
  "Needs correction planning",
  "Blocked: no live approval",
  "Blocked: deployment approval missing",
  "Ready for future approved correction planning"
] as const;
const phase5tNoHotfixNoRemediationBoundaries = [
  "A remediation template is not a hotfix",
  "A triage placeholder is not an incident record",
  "A correction backlog row is not a completed correction",
  "A rollback/escalation placeholder is not rollback execution",
  "Passing validators is not remediation success",
  "A merged PR is not live incident resolution"
] as const;

const phase5uRemediationVerificationReadinessPath =
  "docs/content/LOCAL-REMEDIATION-VERIFICATION-READINESS.md";
const phase5uCorrectionRetestResolutionLedgerTemplatePath =
  "docs/content/LOCAL-CORRECTION-RETEST-RESOLUTION-LEDGER-TEMPLATE.md";
const phase5uSafeFutureVerificationSections = [
  "Incident triage correction backlog reference",
  "Post-launch remediation readiness reference",
  "Proposed correction source placeholder",
  "Retest route/surface placeholder",
  "Reproduction comparison placeholder",
  "Owner verification placeholder",
  "Provider/runtime verification placeholder",
  "Correction retest ledger reference",
  "Rollback/escalation verification placeholder",
  "Final resolution-readiness status"
] as const;
const phase5uCorrectionRetestResolutionLedgerPlaceholders = [
  "Retest ID: [NOT ASSIGNED]",
  "Retest area: [NOT SELECTED]",
  "Source triage item: [NOT SUPPLIED]",
  "Route/surface affected: [NOT SELECTED]",
  "Proposed correction: [NOT CAPTURED]",
  "Retest status: [NOT RUN]",
  "Expected result: [NOT FILLED]",
  "Actual result: [NOT RUN]",
  "Owner verification status: [OWNER INPUT REQUIRED]",
  "Provider/runtime status: [PROVIDER DECISION REQUIRED]",
  "Resolution status: [NOT RESOLVED]",
  "Release/correction status: [NOT SCHEDULED]",
  "Evidence status: [NOT EVIDENCE / NOT RECORDED]",
  "Deployment status: [DEPLOYMENT APPROVAL: NOT GRANTED]"
] as const;
const phase5uAllowedFutureVerificationStatuses = [
  "Not started",
  "Correction not implemented",
  "Retest not run",
  "Needs owner verification",
  "Needs provider verification",
  "Needs reproduction comparison",
  "Needs correction retest",
  "Blocked: no live approval",
  "Blocked: deployment approval missing",
  "Ready for future approved verification"
] as const;
const phase5uNoRetestNoResolutionBoundaries = [
  "A verification template is not a retest",
  "A retest placeholder is not retest evidence",
  "A correction verification row is not a completed correction",
  "A resolution placeholder is not incident resolution",
  "Passing validators is not remediation success",
  "A merged PR is not live issue resolution"
] as const;


const phase5vIncidentResolutionResponseReadinessPath =
  "docs/content/LOCAL-INCIDENT-RESOLUTION-RESPONSE-READINESS.md";
const phase5vPostRemediationClosureLessonsLedgerTemplatePath =
  "docs/content/LOCAL-POST-REMEDIATION-CLOSURE-LESSONS-LEDGER-TEMPLATE.md";
const phase5vSafeFutureResponseSections = [
  "Remediation verification readiness reference",
  "Correction retest / resolution ledger reference",
  "Source triage item placeholder",
  "Verified correction summary placeholder",
  "Owner confirmation placeholder",
  "Provider/runtime confirmation placeholder",
  "Support response draft placeholder",
  "Customer follow-up draft placeholder",
  "Public notice decision placeholder",
  "Final resolution-response status"
] as const;
const phase5vClosureLessonsLedgerPlaceholders = [
  "Closure ID: [NOT ASSIGNED]",
  "Closure area: [NOT SELECTED]",
  "Source retest item: [NOT SUPPLIED]",
  "Route/surface affected: [NOT SELECTED]",
  "Resolution summary: [NOT CAPTURED]",
  "Support response status: [NOT SENT]",
  "Customer follow-up status: [NOT SENT]",
  "Public notice status: [NOT APPROVED]",
  "Owner confirmation status: [OWNER INPUT REQUIRED]",
  "Provider/runtime status: [PROVIDER DECISION REQUIRED]",
  "Lessons learned: [NOT CAPTURED]",
  "Maintenance follow-up status: [NOT SCHEDULED]",
  "Evidence status: [NOT EVIDENCE / NOT RECORDED]",
  "Deployment status: [DEPLOYMENT APPROVAL: NOT GRANTED]"
] as const;
const phase5vAllowedFutureResponseStatuses = [
  "Not started",
  "Verification not completed",
  "Retest not run",
  "Resolution not recorded",
  "Needs owner confirmation",
  "Needs provider confirmation",
  "Draft response only",
  "Blocked: no support approval",
  "Blocked: deployment approval missing",
  "Ready for future approved response"
] as const;
const phase5vNoResponseNoResolutionBoundaries = [
  "A response template is not a sent response",
  "A support draft is not support evidence",
  "A customer follow-up placeholder is not customer contact",
  "A resolution summary is not incident resolution",
  "Passing validators is not verified remediation",
  "A merged PR is not issue closure"
] as const;



const phase5wPreventiveMaintenanceReadinessPath =
  "docs/content/LOCAL-PREVENTIVE-MAINTENANCE-READINESS.md";
const phase5wLessonsToMaintenanceBacklogTemplatePath =
  "docs/content/LOCAL-LESSONS-TO-MAINTENANCE-BACKLOG-TEMPLATE.md";
const phase5wSafeFutureMaintenanceSections = [
  "Incident resolution response readiness reference",
  "Post-remediation closure / lessons ledger reference",
  "Lesson source placeholder",
  "Maintenance candidate placeholder",
  "Affected route/surface placeholder",
  "Owner priority placeholder",
  "Provider/runtime dependency placeholder",
  "Lessons-to-maintenance backlog reference",
  "Future verification dependency placeholder",
  "Final maintenance-readiness status"
] as const;
const phase5wLessonsToMaintenanceBacklogPlaceholders = [
  "Maintenance ID: [NOT ASSIGNED]",
  "Maintenance area: [NOT SELECTED]",
  "Source closure item: [NOT SUPPLIED]",
  "Route/surface affected: [NOT SELECTED]",
  "Lesson summary: [NOT CAPTURED]",
  "Proposed maintenance item: [NOT CAPTURED]",
  "Owner priority status: [OWNER INPUT REQUIRED]",
  "Provider/runtime dependency: [PROVIDER DECISION REQUIRED]",
  "Schedule status: [NOT SCHEDULED]",
  "Implementation status: [NOT STARTED]",
  "Verification dependency: [NOT CAPTURED]",
  "Evidence status: [NOT EVIDENCE / NOT RECORDED]",
  "Deployment status: [DEPLOYMENT APPROVAL: NOT GRANTED]"
] as const;
const phase5wAllowedFutureMaintenanceStatuses = [
  "Not started",
  "Lesson not approved",
  "Maintenance candidate not captured",
  "Needs owner prioritisation",
  "Needs provider clarification",
  "Needs future correction planning",
  "Needs future verification planning",
  "Blocked: no maintenance approval",
  "Blocked: deployment approval missing",
  "Ready for future approved maintenance planning"
] as const;
const phase5wNoMaintenanceNoScheduleBoundaries = [
  "A maintenance template is not implemented maintenance",
  "A backlog placeholder is not scheduled work",
  "A lesson placeholder is not a real lesson learned",
  "A provider dependency placeholder is not provider setup",
  "Passing validators is not maintenance completion",
  "A merged PR is not preventive maintenance"
] as const;


const phase5xMaintenanceApprovalReadinessPath =
  "docs/content/LOCAL-MAINTENANCE-APPROVAL-READINESS.md";
const phase5xMaintenanceChangeWindowPlanningLedgerTemplatePath =
  "docs/content/LOCAL-MAINTENANCE-CHANGE-WINDOW-PLANNING-LEDGER-TEMPLATE.md";
const phase5xSafeFutureApprovalSections = [
  "Preventive maintenance readiness reference",
  "Lessons-to-maintenance backlog reference",
  "Maintenance candidate source placeholder",
  "Owner approval placeholder",
  "Provider/runtime approval placeholder",
  "Change-window planning placeholder",
  "Risk/rollback dependency placeholder",
  "Maintenance change-window ledger reference",
  "Future verification dependency placeholder",
  "Final maintenance-approval status"
] as const;
const phase5xMaintenanceApprovalLedgerPlaceholders = [
  "Approval ID: [NOT ASSIGNED]",
  "Approval area: [NOT SELECTED]",
  "Source maintenance item: [NOT SUPPLIED]",
  "Route/surface affected: [NOT SELECTED]",
  "Proposed maintenance summary: [NOT CAPTURED]",
  "Owner approval status: [OWNER INPUT REQUIRED]",
  "Provider/runtime approval status: [PROVIDER DECISION REQUIRED]",
  "Change-window status: [NOT SCHEDULED]",
  "Schedule status: [NOT SCHEDULED]",
  "Rollback dependency: [NOT CAPTURED]",
  "Verification dependency: [NOT CAPTURED]",
  "Implementation status: [NOT STARTED]",
  "Evidence status: [NOT EVIDENCE / NOT RECORDED]",
  "Deployment status: [DEPLOYMENT APPROVAL: NOT GRANTED]"
] as const;
const phase5xAllowedFutureApprovalStatuses = [
  "Not started",
  "Maintenance candidate not approved",
  "Needs owner prioritisation",
  "Needs provider clarification",
  "Needs rollback planning",
  "Needs future verification planning",
  "Draft approval only",
  "Blocked: no maintenance approval",
  "Blocked: deployment approval missing",
  "Ready for future approved scheduling review"
] as const;
const phase5xNoApprovalNoScheduleBoundaries = [
  "An approval template is not owner approval",
  "A provider approval placeholder is not provider approval",
  "A change-window placeholder is not scheduled maintenance",
  "A rollback dependency placeholder is not rollback readiness",
  "Passing validators is not maintenance approval",
  "A merged PR is not scheduled maintenance"
] as const;


const phase5yMaintenanceExecutionRunbookReadinessPath =
  "docs/content/LOCAL-MAINTENANCE-EXECUTION-RUNBOOK-READINESS.md";
const phase5yMaintenanceChangeWindowExecutionChecklistTemplatePath =
  "docs/content/LOCAL-MAINTENANCE-CHANGE-WINDOW-EXECUTION-CHECKLIST-TEMPLATE.md";
const phase5ySafeFutureExecutionSections = [
  "Maintenance approval readiness reference",
  "Maintenance change-window planning ledger reference",
  "Approved maintenance item placeholder",
  "Change-window precheck placeholder",
  "Execution owner placeholder",
  "Provider/runtime dependency placeholder",
  "Rollback/escalation dependency placeholder",
  "Maintenance execution checklist reference",
  "Future verification dependency placeholder",
  "Final maintenance-execution readiness status"
] as const;
const phase5yMaintenanceExecutionChecklistPlaceholders = [
  "Execution ID: [NOT ASSIGNED]",
  "Execution area: [NOT SELECTED]",
  "Source approval item: [NOT SUPPLIED]",
  "Route/surface affected: [NOT SELECTED]",
  "Proposed maintenance summary: [NOT CAPTURED]",
  "Change-window status: [NOT OPENED]",
  "Precheck status: [NOT RUN]",
  "Execution status: [NOT STARTED]",
  "Owner confirmation status: [OWNER INPUT REQUIRED]",
  "Provider/runtime status: [PROVIDER DECISION REQUIRED]",
  "Rollback readiness status: [NOT READY]",
  "Verification dependency: [NOT CAPTURED]",
  "Evidence status: [NOT EVIDENCE / NOT RECORDED]",
  "Deployment status: [DEPLOYMENT APPROVAL: NOT GRANTED]"
] as const;
const phase5yAllowedFutureExecutionStatuses = [
  "Not started",
  "Approval not recorded",
  "Change window not scheduled",
  "Execution owner not assigned",
  "Needs provider clarification",
  "Needs rollback planning",
  "Needs future verification planning",
  "Blocked: no execution approval",
  "Blocked: deployment approval missing",
  "Ready for future approved execution review"
] as const;
const phase5yNoExecutionNoRuntimeBoundaries = [
  "An execution runbook is not executed maintenance",
  "A precheck placeholder is not a completed precheck",
  "A change-window placeholder is not an opened change window",
  "A rollback dependency placeholder is not rollback readiness",
  "Passing validators is not execution approval",
  "A merged PR is not maintenance execution"
] as const;

const phase5zMaintenanceVerificationClosureReadinessPath =
  "docs/content/LOCAL-MAINTENANCE-VERIFICATION-CLOSURE-READINESS.md";
const phase5zMaintenanceChangeWindowOutcomeLedgerTemplatePath =
  "docs/content/LOCAL-MAINTENANCE-CHANGE-WINDOW-OUTCOME-LEDGER-TEMPLATE.md";
const phase5zSafeFutureClosureSections = [
  "Maintenance execution runbook readiness reference",
  "Maintenance change-window execution checklist reference",
  "Planned maintenance/change reference placeholder",
  "Intended owner/reviewer placeholder",
  "Intended window label placeholder",
  "Intended verification owner placeholder",
  "Intended follow-up owner placeholder",
  "Change-window outcome ledger reference",
  "Closure packet preparation checklist",
  "Final verification-closure readiness status"
] as const;
const phase5zMaintenanceOutcomeLedgerPlaceholders = [
  "Outcome ledger ID: [NOT ASSIGNED]",
  "Planned maintenance/change reference: [NOT SUPPLIED]",
  "Intended owner/reviewer: [OWNER INPUT REQUIRED]",
  "Intended window label: [NOT SCHEDULED]",
  "Intended verification owner: [NOT ASSIGNED]",
  "Intended follow-up owner: [NOT ASSIGNED]",
  "Affected route/surface: [NOT SELECTED]",
  "Closure packet status: [NOT PREPARED]",
  "Outcome status placeholder: [PLACEHOLDER ONLY / NOT A RESULT]",
  "Smoke check status: [NOT RUN]",
  "Production evidence status: [NOT EVIDENCE / NOT RECORDED]",
  "Closure approval status: [NOT RECORDED]",
  "Maintenance status: [NOT MARKED COMPLETE]",
  "Deployment status: [DEPLOYMENT APPROVAL: NOT GRANTED]"
] as const;
const phase5zAllowedFutureClosureStatuses = [
  "Not started",
  "Execution not performed",
  "Change window not opened",
  "Verification owner not assigned",
  "Follow-up owner not assigned",
  "Needs owner review",
  "Needs unresolved follow-up review",
  "Blocked: no verification approval",
  "Blocked: production evidence is not allowed",
  "Ready for future approved closure packet review"
] as const;
const phase5zNoCompletionNoProductionEvidenceBoundaries = [
  "An outcome ledger is not a completion record",
  "A closure packet checklist is not verification closure",
  "A smoke check placeholder is not a smoke check run",
  "A production evidence placeholder is not production evidence",
  "Passing validators is not closure approval",
  "A merged PR is not maintenance completion"
] as const;


const phase6aMaintenanceClosureDecisionReadinessPath =
  "docs/content/LOCAL-MAINTENANCE-CLOSURE-DECISION-READINESS.md";
const phase6aMaintenanceClosureRecommendationPacketLedgerTemplatePath =
  "docs/content/LOCAL-MAINTENANCE-CLOSURE-RECOMMENDATION-PACKET-LEDGER-TEMPLATE.md";
const phase6bMaintenanceClosureArchiveReadinessPath =
  "docs/content/LOCAL-MAINTENANCE-CLOSURE-ARCHIVE-READINESS.md";
const phase6bMaintenanceClosureArchiveRetentionLedgerTemplatePath =
  "docs/content/LOCAL-MAINTENANCE-CLOSURE-ARCHIVE-RETENTION-LEDGER-TEMPLATE.md";
const phase6cMaintenanceClosureAuditHandoffReadinessPath =
  "docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-HANDOFF-READINESS.md";
const phase6cMaintenanceClosureAuditHandoffRoutingLedgerTemplatePath =
  "docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-HANDOFF-ROUTING-LEDGER-TEMPLATE.md";
const phase6dMaintenanceClosureAuditFollowUpIntakeReadinessPath =
  "docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-FOLLOW-UP-INTAKE-READINESS.md";
const phase6dMaintenanceClosureAuditFindingIntakeLedgerTemplatePath =
  "docs/content/LOCAL-MAINTENANCE-CLOSURE-AUDIT-FINDING-INTAKE-LEDGER-TEMPLATE.md";
const phase6aClosureRecommendationPacketLedgerPlaceholders = [
  "Intended maintenance/change reference: [NOT SUPPLIED]",
  "Intended verification packet reference: [NOT SUPPLIED]",
  "Intended owner/reviewer: [OWNER INPUT REQUIRED]",
  "Intended closure decision owner: [NOT ASSIGNED]",
  "Intended unresolved-follow-up owner: [NOT ASSIGNED]",
  "Intended rollback/escalation reviewer: [NOT ASSIGNED]",
  "Recommendation status placeholder: [PLACEHOLDER ONLY / NOT A RECOMMENDATION]",
  "Decision status placeholder: [PLACEHOLDER ONLY / NOT A DECISION]",
  "Closure approval status: [NOT RECORDED]",
  "Maintenance status: [NOT MARKED COMPLETE]",
  "Production evidence status: [NOT EVIDENCE / NOT RECORDED]",
  "Deployment status: [DEPLOYMENT APPROVAL: NOT GRANTED]"
] as const;
const phase6aClosureDecisionReadinessChecklist = [
  "Confirm the intended maintenance/change reference and verification packet reference would be in scope before any future decision review.",
  "Confirm unresolved follow-ups would block closure until separately reviewed by the intended unresolved-follow-up owner.",
  "Confirm missing evidence would block closure because this helper does not collect or record production evidence.",
  "Confirm rollback/escalation notes would stay open until separately reviewed by the intended rollback/escalation reviewer.",
  "Confirm public/customer actions, support follow-up and external follow-up actions are not allowed from this readiness helper.",
  "Confirm this helper does not approve closure and does not close maintenance."
] as const;
const phase6aNoApprovalNoCompletionFirewall = [
  "No closure decision is recorded here.",
  "No closure recommendation is accepted here.",
  "No closure approval is recorded here.",
  "No maintenance is marked complete here.",
  "No production evidence is collected here.",
  "No smoke check is run here.",
  "No provider/runtime check is executed here.",
  "No customer/support follow-up is sent here.",
  "No production readiness claim is made here."
] as const;

const publicJourneyReadinessClosurePath =
  "docs/content/PUBLIC-JOURNEY-READINESS-CLOSURE.md";
const quoteEnquiryPublicExpectationBoundaryPath =
  "docs/content/QUOTE-ENQUIRY-PUBLIC-EXPECTATION-BOUNDARY.md";
const protectedAdminPublicReviewBridgePath =
  "docs/content/PROTECTED-ADMIN-PUBLIC-REVIEW-BRIDGE.md";
const publicRouteReadinessGroups = [
  "Homepage",
  "Listings route",
  "Listing detail route",
  "Catalogue/category routes",
  "Events/event-use route",
  "Quote/enquiry request route",
  "Public not-found/recovery states"
] as const;
const protectedAdminPublicReviewBridgeStatuses = [
  "Public-safe",
  "Owner input required",
  "Keep protected",
  "Needs local correction",
  "Admin-only detail",
  "Blocked before public visibility",
  "Requires separate deployment approval"
] as const;
const publicRouteReadinessClosureLastLocalUpdate = "[DATE PLACEHOLDER]";
const publicRouteReadinessClosureSnapshot = [
  ["Public journey readiness closure", publicJourneyReadinessClosurePath],
  ["Quote/enquiry expectation boundary", quoteEnquiryPublicExpectationBoundaryPath],
  ["Protected admin public-review bridge", protectedAdminPublicReviewBridgePath],
  ["Public route groups", publicRouteReadinessGroups.length],
  ["Bridge statuses", protectedAdminPublicReviewBridgeStatuses.length],
  ["Public exposure boundary", "Rental/enquiry-only public routes"],
  ["Missing owner input boundary", "Unsupported real-world facts stay absent"],
  ["Deployment approval", closureDeploymentApprovalStatus],
  ["Last local public-readiness update", publicRouteReadinessClosureLastLocalUpdate]
] as const;
const protectedAdminDestructiveRecoverySnapshot = [
  [
    "Destructive-action safeguards",
    "Listing archive, listing unpublish/draft, category unpublish/archive, media archive/deactivate, primary image changes, quote status transitions, quote internal note updates, failed write recovery"
  ],
  [
    "Recovery lane statuses",
    "Admin review required; Owner input required; Retry protected write; Keep draft/protected; Safe to retry locally; Blocked before public visibility; Requires separate deployment approval"
  ],
  [
    "Status transition groups",
    "Listing draft/published/archived; category unpublished/published/archived; media active/archived and primary/not-primary; quote request new/reviewing/quoted/closed/archived"
  ],
  [
    "Public exposure boundary",
    "Public routes must not expose destructive-action safeguards, recovery lane statuses, transition matrix details, admin URLs, or internal notes"
  ],
  ["Deployment approval", closureDeploymentApprovalStatus],
  [
    "Last local destructive-action update",
    protectedAdminDestructiveRecoveryLastLocalUpdate
  ]
] as const;

const contentReadinessGroups = [
  {
    status: "Blocks owner review",
    summary:
      "Owner review cannot close while the affected route, listing, image, quote expectation, or operator ownership gap is unresolved.",
    gaps: [
      "Approved brand spelling and public display name.",
      "Approved listing/category/event descriptions for owner-reviewed surfaces.",
      "Admin access and workspace ownership expectations."
    ]
  },
  {
    status: "Blocks launch/deployment",
    summary:
      "Public launch stays blocked until required owner facts and explicit deployment approval are both supplied.",
    gaps: [
      "Final launch listing names, descriptions, image choices, and alt text.",
      "Public contact, business-hour, legal, policy, service-area, and operating expectation wording if required for launch.",
      "Owner-approved quote/enquiry expectation wording for public launch."
    ]
  },
  {
    status: "Deferred after launch",
    summary:
      "Useful future content or workflow improvements that do not block current owner review.",
    gaps: [
      "Service-area expansion language if the owner does not need it for launch.",
      "Additional event-use guidance beyond the current public-safe planning copy.",
      "Optional operator accountability labels after the first review pass."
    ]
  },
  {
    status: "Not in scope by owner direction",
    summary:
      "Content or capability types that remain excluded unless the owner gives separate approval.",
    gaps: [
      "Unsupported proof, assurance, named-client, legal, or operating claims until supplied and approved.",
      "Public self-service account, status-tracking, outbound automation, and sales-system capabilities.",
      "Provider, deployment, temporary chat bridge, or search-assistant runtime changes."
    ]
  }
] as const;


function ReleaseControlWorkspace() {
  return (
    <section className="admin-dashboard" aria-label="Release-control workspace">
      <div className="admin-dashboard__header">
        <div>
          <p className="eyebrow">Release control</p>
          <h2>Phase 4D-A/B local release-candidate freeze</h2>
          <p>
            This protected admin workspace is repo-local and template-only. It
            summarizes local review boundaries before any future deployment
            discussion and does not grant deployment approval.
          </p>
        </div>
      </div>

      <div className="admin-dashboard__grid">
        <section className="admin-dashboard__card admin-dashboard__card--summary">
          <h3>Release-control snapshot</h3>
          <dl className="quote-inbox__details">
            {phase4aReleaseControlSnapshot.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p>
            Public route readiness, protected admin readiness, owner input,
            local corrections, provider/runtime scope, and evidence boundaries
            remain protected and local until separate explicit approval changes
            that boundary.
          </p>
        </section>

        <section className="admin-dashboard__card admin-dashboard__card--summary">
          <h3>Release-control documents</h3>
          <ul className="admin-dashboard__list">
            {[
              ...phase4aReleaseControlDocs,
              ...phase4bOwnerInputCorrectionDocs,
              ...phase4cOwnerReviewRehearsalDocs,
              ...phase4dLocalFreezeDocs,
              ...phase4eOwnerApprovalRequestDocs,
              ...phase4fOwnerHandoffBundleDocs
            ].map((docPath) => (
              <li key={docPath}>
                <div>
                  <strong>{docPath}</strong>
                  <span>Template only; not evidence.</span>
                </div>
              </li>
            ))}
          </ul>
          <p>
            These documents prepare local owner-review rehearsal and deployment
            approval firewall checks without recording owner feedback, owner
            sign-off, live preview evidence, production evidence, provider
            configuration, or deployment approval.
          </p>
        </section>

        <section className="admin-dashboard__card admin-dashboard__card--summary">
          <h3>Phase 4C rehearsal snapshot</h3>
          <dl className="quote-inbox__details">
            {phase4cOwnerReviewRehearsalSnapshot.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <ul className="admin-dashboard__list">
            {phase4cOwnerReviewRehearsalDocs.map((docPath) => (
              <li key={docPath}>{docPath}</li>
            ))}
          </ul>
          <p>
            The Phase 4C-A/B local owner-review rehearsal snapshot is protected
            admin-only. It keeps owner review prompts, blocker ledger placeholders, local acceptance
            drill commands, owner-input boundaries, local correction boundaries,
            evidence boundaries, and deployment approval boundaries out of
            public routes.
          </p>
        </section>

        <section className="admin-dashboard__card admin-dashboard__card--summary">
          <h3>Phase 4D local-freeze snapshot</h3>
          <dl className="quote-inbox__details">
            {phase4dLocalFreezeSnapshot.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <ul className="admin-dashboard__list">
            {phase4dLocalFreezeDocs.map((docPath) => (
              <li key={docPath}>{docPath}</li>
            ))}
          </ul>
          <p>
            The Phase 4D local-freeze snapshot is protected admin-only. It keeps
            release-candidate freeze details, full-suite reliability boundaries,
            deployment-planning firewall closure, owner input boundaries, local
            correction boundaries, evidence boundaries, and deployment approval
            boundaries out of public routes.
          </p>
        </section>

        <section className="admin-dashboard__card admin-dashboard__card--summary">
          <h3>Phase 4E approval-request snapshot</h3>
          <dl className="quote-inbox__details">
            {phase4eOwnerApprovalRequestSnapshot.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <ul className="admin-dashboard__list">
            {phase4eOwnerApprovalRequestDocs.map((docPath) => (
              <li key={docPath}>{docPath}</li>
            ))}
          </ul>
          <p>
            The Phase 4E approval-request snapshot is protected admin-only. It
            keeps the owner approval request packet, preview-planning handoff
            template, final no-deploy decision gate, approval request boundary,
            owner sign-off boundary, evidence capture boundary, provider setup
            boundary, and deployment approval boundary out of public routes.
          </p>
        </section>

        <section className="admin-dashboard__card admin-dashboard__card--summary">
          <h3>Phase 4F handoff-bundle snapshot</h3>
          <dl className="quote-inbox__details">
            {phase4fOwnerHandoffBundleSnapshot.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <ul className="admin-dashboard__list">
            {phase4fOwnerHandoffBundleDocs.map((docPath) => (
              <li key={docPath}>{docPath}</li>
            ))}
          </ul>
          <p>
            The Phase 4F handoff-bundle snapshot is protected admin-only. It
            keeps the owner-facing review brief, owner approval issue template,
            no-deploy preflight command center, owner handoff bundle index,
            approval request boundary, evidence capture boundary, provider setup
            boundary, and deployment approval boundary out of public routes.
          </p>
        </section>

        <section
          aria-label="Owner review checklist summary"
          className="admin-dashboard__card admin-dashboard__card--summary"
        >
          <h3>Owner review checklist summary</h3>
          <p>
            Use the Phase 4F handoff bundle with the Phase 5A local cleanup
            notes to review public rental wording, quote/enquiry intake copy,
            and protected admin readiness before any separate deployment
            decision. This card is protected admin-only and records no owner
            feedback, evidence, sign-off, provider setup, or deployment
            approval.
          </p>
          <dl className="quote-inbox__details">
            {phase5aOwnerReviewChecklistSnapshot.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <ul className="admin-dashboard__list">
            {phase5aOwnerReviewChecklistDocs.map((docPath) => (
              <li key={docPath}>{docPath}</li>
            ))}
          </ul>
        </section>

        <section className="admin-dashboard__card admin-dashboard__card--summary">
          <h3>Owner-input and local correction snapshot</h3>
          <dl className="quote-inbox__details">
            {phase4bOwnerInputCorrectionSnapshot.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <ul className="admin-dashboard__list">
            <li>Owner-input intake categories: {ownerInputIntakeCategories.join("; ")}</li>
            <li>Local correction queue statuses: {localCorrectionQueueStatuses.join("; ")}</li>
            <li>Review-ready handoff closure states: {reviewReadyHandoffClosureStates.join("; ")}</li>
          </ul>
          <p>
            This snapshot is protected admin-only. It separates missing owner
            input, local correction work, admin-only review details, public
            exposure boundaries, evidence boundaries, and deployment approval
            boundaries without recording owner feedback or sign-off.
          </p>
        </section>
      </div>
    </section>
  );
}

function ContentReadinessWorkspace() {
  const executionSnapshot = [
    ["Review surface groups", reviewSurfaceGroups],
    ["Route families covered", routeFamiliesCovered],
    ["Owner decision categories", ownerDecisionCategories.length],
    ["Owner input required categories", ownerInputRequiredCategories.length],
    ["Launch-blocker categories", launchBlockerCategories.length]
  ] as const;
  const dryRunSnapshot = [
    ["Dry-run review areas", dryRunReviewAreas],
    ["Finding disposition statuses", findingDispositionStatuses.length],
    ["Launch decision rehearsal states", launchDecisionRehearsalStates.length],
    [
      "Dry-run owner input placeholders",
      dryRunOwnerInputRequiredCategories.length
    ],
    ["Explicit deployment approval boundary", "Required"]
  ] as const;
  const correctionFreezeSnapshot = [
    ["Correction categories", ownerCorrectionCategories.length],
    ["Correction statuses", ownerCorrectionStatuses.length],
    ["Freeze states", launchBlockerFreezeStates.length],
    ["Future correction PR types", futureCorrectionPrTypes.length],
    ["Correction freeze boundary", "Required"]
  ] as const;
  const closureReadinessSnapshot = [
    [
      "Current owner-review closure state",
      "[CONTINUE / BLOCKED / READY TO CLOSE]"
    ],
    ["Open blockers", "[TEMPLATE ONLY]"],
    ["Correction intake status", "[TEMPLATE ONLY]"],
    ["Closure readiness notes", "[TEMPLATE ONLY]"],
    ["Deployment approval status", closureDeploymentApprovalStatus],
    ["Last local packet update", closureSnapshotLastLocalPacketUpdate]
  ] as const;

  return (
    <section className="admin-dashboard" aria-label="Content readiness workspace">
      <div className="admin-dashboard__header">
        <div>
          <p className="eyebrow">Owner review</p>
          <h2>Content readiness</h2>
          <p>
            Missing facts remain Owner input required. This protected admin
            workspace summarizes the repo-local content intake and gap register
            without publishing owner-review details to public routes.
          </p>
        </div>
      </div>

      <div className="admin-dashboard__grid">
        <section className="admin-dashboard__card admin-dashboard__card--summary">
          <h3>Owner-review execution snapshot</h3>
          <dl className="quote-inbox__details">
            {executionSnapshot.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p>
            Review decisions stay repo-local and protected until the owner
            supplies missing facts and separately approves any launch step.
          </p>
        </section>

        <section className="admin-dashboard__card admin-dashboard__card--summary">
          <h3>Dry-run review snapshot</h3>
          <dl className="quote-inbox__details">
            {dryRunSnapshot.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p>{explicitDeploymentApprovalBoundary}</p>
        </section>

        <section className="admin-dashboard__card admin-dashboard__card--summary">
          <h3>Correction/freeze snapshot</h3>
          <dl className="quote-inbox__details">
            {correctionFreezeSnapshot.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p>{correctionFreezeDeploymentBoundary}</p>
        </section>

        <section className="admin-dashboard__card admin-dashboard__card--summary">
          <h3>Closure readiness snapshot</h3>
          <dl className="quote-inbox__details">
            {closureReadinessSnapshot.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
            <div>
              <dt>Closure states</dt>
              <dd>{ownerReviewClosureStates.length}</dd>
            </div>
            <div>
              <dt>Template fields</dt>
              <dd>{ownerReviewClosureTemplateFields.length}</dd>
            </div>
          </dl>
          <p>
            Closure readiness is template-only and cannot approve deployment,
            preview publication, production launch, provider configuration, or
            live smoke testing.
          </p>
        </section>

        <section className="admin-dashboard__card admin-dashboard__card--summary">
          <h3>Owner-demo walkthrough snapshot</h3>
          <dl className="quote-inbox__details">
            {ownerDemoWalkthroughSnapshot.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p>
            The owner-demo walkthrough stays template-only, admin-only, and
            repo-local. Public visitors cannot see closure readiness notes or
            internal review prompts.
          </p>
        </section>

        <section className="admin-dashboard__card admin-dashboard__card--summary">
          <h3>Owner-demo issue backlog snapshot</h3>
          <dl className="quote-inbox__details">
            {ownerDemoIssueBacklogSnapshot.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p>
            The issue backlog is template-only and protected. It separates
            public route polish, admin workflow follow-up, owner input, locally
            resolved items, and any future launch blockers from deployment
            approval.
          </p>
        </section>

        <section className="admin-dashboard__card admin-dashboard__card--summary">
          <h3>Local release-candidate acceptance snapshot</h3>
          <dl className="quote-inbox__details">
            {localAcceptanceSnapshot.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p>
            The local acceptance matrix and route inventory freeze stay
            template-only, admin-only, and repo-local. They do not approve
            provider setup, deployment, preview evidence, owner sign-off, or
            launch work.
          </p>
        </section>

        <section className="admin-dashboard__card admin-dashboard__card--summary">
          <h3>Local release-candidate command centre snapshot</h3>
          <dl className="quote-inbox__details">
            {localCommandCentreSnapshot.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p>
            The local command centre and suite runner stay template-only,
            admin-only, and repo-local. They do not approve deployment, provider
            setup, live preview checks, evidence capture, owner sign-off, or
            launch work.
          </p>
        </section>

        <section className="admin-dashboard__card admin-dashboard__card--summary">
          <h3>Final local owner handoff snapshot</h3>
          <dl className="quote-inbox__details">
            {finalOwnerHandoffSnapshot.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p>
            The final handoff pack, triage board, and deployment decision
            firewall stay template-only, protected, and repo-local. They do not
            record owner approval, filled evidence, provider setup, preview
            publication, production launch, or deployment approval.
          </p>
        </section>

        <section className="admin-dashboard__card admin-dashboard__card--summary">
          <h3>Catalogue/listing/media acceptance snapshot</h3>
          <dl className="quote-inbox__details">
            {catalogueListingMediaAcceptanceSnapshot.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p>
            The catalogue/listing/media checklist stays template-only,
            protected, and repo-local. Public visitors only see rental listing,
            category, event-use, quote, and enquiry guidance; admin content ops,
            media readiness, alt-text review, visitor-submitted media, account, tracking,
            provider, and deployment boundaries stay protected.
          </p>
        </section>

        <section className="admin-dashboard__card admin-dashboard__card--summary">
          <h3>Quote/enquiry acceptance snapshot</h3>
          <dl className="quote-inbox__details">
            {quoteEnquiryAcceptanceSnapshot.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p>
            The quote/enquiry workflow checklist stays template-only,
            protected, and repo-local. Public quote pages do not show internal
            notes, status history, public tracking, customer-account surfaces,
            outbound alerting, sales-system sync, uploads, or deployment
            approval.
          </p>
        </section>

        <section className="admin-dashboard__card admin-dashboard__card--summary">
          <h3>Protected admin write-ops acceptance snapshot</h3>
          <dl className="quote-inbox__details">
            {protectedAdminWriteOpsAcceptanceSnapshot.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p>
            The protected admin write-ops checklist stays template-only,
            admin-only, and repo-local. Listing, category, media, and quote
            follow-up write boundaries remain separated from public routes,
            public self-service areas, visitor-submitted media, status tracking, provider setup,
            evidence capture, and deployment approval.
          </p>
        </section>


        <section className="admin-dashboard__card admin-dashboard__card--summary">
          <h3>Public route/readiness closure snapshot</h3>
          <dl className="quote-inbox__details">
            {publicRouteReadinessClosureSnapshot.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p>
            The public journey readiness closure, quote/enquiry expectation
            boundary, and protected admin public-review bridge stay admin-only,
            repo-local, and template-only. Public routes remain rental/enquiry
            only and must not expose admin readiness, internal notes, recovery
            details, destructive-action safeguards, owner-review templates,
            unsupported owner facts, provider setup, or deployment approval.
          </p>
          <ul className="admin-dashboard__list">
            {protectedAdminPublicReviewBridgeStatuses.map((status) => (
              <li key={status}>{status}</li>
            ))}
          </ul>
        </section>

        <section className="admin-dashboard__card admin-dashboard__card--summary">
          <h3>Protected admin destructive-action/recovery snapshot</h3>
          <dl className="quote-inbox__details">
            {protectedAdminDestructiveRecoverySnapshot.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p>
            The destructive-action safeguards, recovery lane, and status-transition
            matrix stay template-only, admin-only, protected, and repo-local.
            They do not expose recovery details publicly, approve deployment,
            create provider configuration, add public quote tracking, or add
            transaction-style public flows.
          </p>
        </section>
        <section
          aria-label="Owner review checklist summary"
          className="admin-dashboard__card admin-dashboard__card--summary"
        >
          <h3>Owner review checklist summary</h3>
          <p>
            Use the Phase 4F handoff bundle with the Phase 5A local cleanup
            notes to review public rental wording, quote/enquiry intake copy,
            and protected admin readiness before any separate deployment
            decision. This card is protected admin-only and records no owner
            feedback, evidence, sign-off, provider setup, or deployment
            approval.
          </p>
          <dl className="quote-inbox__details">
            {phase5aOwnerReviewChecklistSnapshot.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <ul className="admin-dashboard__list">
            {phase5aOwnerReviewChecklistDocs.map((docPath) => (
              <li key={docPath}>{docPath}</li>
            ))}
          </ul>
        </section>

        <section className="admin-dashboard__card admin-dashboard__card--summary">
          <h3>Review sources</h3>
          <p>
            Use these repo-local sources as the owner-review issue ledger and
            content readiness record.
          </p>
          <ul className="admin-dashboard__list">
            {contentReadinessSources.map((source) => (
              <li key={source}>
                <strong>
                  <code>{source}</code>
                </strong>
              </li>
            ))}
          </ul>
        </section>

        {contentReadinessGroups.map((group) => (
          <section className="admin-dashboard__card" key={group.status}>
            <p className="eyebrow">Owner-review issue status</p>
            <h3>{group.status}</h3>
            <p>{group.summary}</p>
            <ul className="admin-dashboard__list">
              {group.gaps.map((gap) => (
                <li key={gap}>
                  <span>{gap}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
}

function PublicParityReviewWorkspace() {
  return (
    <section
      aria-label="Protected public parity review helper"
      className="admin-dashboard"
    >
      <div className="admin-dashboard__header">
        <div>
          <p className="eyebrow">Protected admin-only</p>
          <h2>Public discovery-to-enquiry parity review</h2>
          <p>
            Review the local public search/filter/category/event-use discovery
            path and quote-intent handoff without exposing owner handoff
            details, release-control notes, or admin-only workflow context on
            public routes. This helper records no owner feedback, no evidence,
            and no deployment approval.
          </p>
        </div>
      </div>
      <div className="admin-dashboard__grid">
        <section className="admin-dashboard__card admin-dashboard__card--summary">
          <h3>Phase 5C discovery parity summary</h3>
          <dl className="quote-inbox__details">
            {phase5cDiscoveryParitySnapshot.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="admin-dashboard__card admin-dashboard__card--summary">
          <h3>Phase 5D listing-detail parity summary</h3>
          <dl className="quote-inbox__details">
            {phase5dListingDetailParitySnapshot.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="admin-dashboard__card admin-dashboard__card--summary">
          <h3>Phase 5E quote intake parity summary</h3>
          <dl className="quote-inbox__details">
            {phase5eQuoteIntakeParitySnapshot.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="admin-dashboard__card admin-dashboard__card--summary">
          <h3>Review references</h3>
          <p>
            These repo-local references keep the owner handoff, local
            content-readiness cleanup, Phase 5B public journey acceptance,
            Phase 5C discovery acceptance templates, Phase 5D listing detail
            readiness, and Phase 5E quote intake readiness notes together for
            authorised admin review only.
          </p>
          <ul className="admin-dashboard__list">
            {phase5cDiscoveryParityDocs.map((docPath) => (
              <li key={docPath}>{docPath}</li>
            ))}
          </ul>
        </section>
        <section className="admin-dashboard__card">
          <h3>Review boundaries</h3>
          <ul className="admin-dashboard__list">
            <li>
              Public visitors only see search/filter browsing, listing, quote,
              and enquiry guidance.
            </li>
            <li>
              Listing, category, event-use, and search context remains editable
              request intake, not approval or final rental details.
            </li>
            <li>
              Listing detail media, related browsing, and quote/enquiry CTAs
              stay public-safe and non-promissory.
            </li>
            <li>
              Owner-required facts and public claims stay blocked until supplied
              and reviewed separately.
            </li>
            <li>
              No provider setup, deployment, preview evidence, production
              evidence, or owner sign-off is recorded.
            </li>
          </ul>
        </section>
      </div>
    </section>
  );
}



function OwnerReviewWalkthroughReadinessHelper() {
  return (
    <section
      aria-label="Phase 5I owner-review walkthrough readiness helper"
      className="admin-dashboard__card admin-dashboard__card--summary"
    >
      <p className="eyebrow">Phase 5I-A/B admin-only walkthrough readiness</p>
      <h3>Owner-review walkthrough readiness helper</h3>
      <p>
        This protected admin-only helper prepares a future owner walkthrough for
        public routes, quote/enquiry flow, catalogue content ops, protected
        write workflow checks, unresolved owner inputs, blocked public claims,
        and the no-deploy/no-evidence boundary. It records no owner feedback,
        no owner approval, no evidence, no provider setup, and no deployment
        approval.
      </p>
      <dl className="quote-inbox__details">
        <div>
          <dt>Walkthrough package</dt>
          <dd>{phase5iOwnerReviewWalkthroughReadinessPath}</dd>
        </div>
        <div>
          <dt>Route acceptance matrix</dt>
          <dd>{phase5iFullRouteAcceptanceMatrixPath}</dd>
        </div>
        <div>
          <dt>Evidence status</dt>
          <dd>[NOT EVIDENCE / NOT RECORDED]</dd>
        </div>
        <div>
          <dt>Deployment status</dt>
          <dd>[DEPLOYMENT APPROVAL: NOT GRANTED]</dd>
        </div>
      </dl>
      <h4>Public and admin walkthrough groups</h4>
      <ul className="admin-readiness__list">
        {phase5iWalkthroughGroups.map((group) => (
          <li key={group}>{group}</li>
        ))}
      </ul>
      <h4>Protected admin review areas</h4>
      <ul className="admin-readiness__list">
        {phase5iAdminWalkthroughGroups.map((group) => (
          <li key={group}>{group}</li>
        ))}
      </ul>
      <h4>Owner input placeholders</h4>
      <ul className="admin-readiness__list">
        {phase5iOwnerInputPlaceholders.map((input) => (
          <li key={input}>{input}</li>
        ))}
      </ul>
      <p>
        Public routes remain rental/enquiry-only and must not expose this
        admin-only walkthrough helper, route acceptance matrix internals,
        admin route/view checklist details, internal notes, release-control
        internals, owner handoff internals, destructive-action safeguards,
        recovery lanes, or status-transition matrix details.
      </p>
    </section>
  );
}

function OwnerFeedbackIntakeReadinessHelper() {
  return (
    <section
      aria-label="Phase 5J owner-feedback intake readiness helper"
      className="admin-dashboard__card admin-dashboard__card--summary"
    >
      <p className="eyebrow">Phase 5J-A/B admin-only feedback intake readiness</p>
      <h3>Owner-feedback intake readiness helper</h3>
      <p>
        This protected admin-only helper prepares a future local owner feedback
        intake and correction queue reconciliation workflow. It creates no
        owner feedback records, records no owner approval, creates no evidence,
        grants no launch clearance, and keeps deployment approval missing.
      </p>
      <dl className="quote-inbox__details">
        <div>
          <dt>Feedback intake package</dt>
          <dd>{phase5jOwnerFeedbackIntakeReadinessPath}</dd>
        </div>
        <div>
          <dt>Correction queue reconciliation</dt>
          <dd>{phase5jOwnerCorrectionQueueReconciliationPath}</dd>
        </div>
        <div>
          <dt>Phase 5I walkthrough package</dt>
          <dd>{phase5iOwnerReviewWalkthroughReadinessPath}</dd>
        </div>
        <div>
          <dt>Phase 5I route matrix</dt>
          <dd>{phase5iFullRouteAcceptanceMatrixPath}</dd>
        </div>
        <div>
          <dt>Evidence status</dt>
          <dd>[NOT EVIDENCE / NOT RECORDED]</dd>
        </div>
        <div>
          <dt>Deployment status</dt>
          <dd>[DEPLOYMENT APPROVAL: NOT GRANTED]</dd>
        </div>
      </dl>
      <h4>Future feedback intake buckets</h4>
      <ul className="admin-readiness__list">
        {phase5jFeedbackBuckets.map((bucket) => (
          <li key={bucket}>{bucket}</li>
        ))}
      </ul>
      <h4>Correction queue reconciliation steps</h4>
      <ul className="admin-readiness__list">
        {phase5jCorrectionReconciliationSteps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ul>
      <h4>Safe correction statuses</h4>
      <ul className="admin-readiness__list">
        {phase5jCorrectionStatuses.map((status) => (
          <li key={status}>{status}</li>
        ))}
      </ul>
      <p>
        Owner facts can support local copy corrections only when supplied by the
        owner in a separately captured review record. Unsupported claims remain
        blocked, deployment/launch questions remain separate from feedback, and
        this helper stays protected admin-only.
      </p>
    </section>
  );
}


function OwnerCorrectionWorkflowReadinessHelper() {
  return (
    <section
      aria-label="Phase 5K owner correction workflow readiness helper"
      className="admin-dashboard__card admin-dashboard__card--summary"
    >
      <p className="eyebrow">Phase 5K-A/B admin-only correction workflow readiness</p>
      <h3>Owner correction workflow readiness helper</h3>
      <p>
        This protected admin-only helper prepares future local correction
        planning for owner-supplied facts, public content-gap placeholders, and
        no-response/no-deploy handoff safety. No owner feedback is recorded here.
        No owner response is sent here. No correction completion is claimed here.
        No deployment approval is granted here.
      </p>
      <dl className="quote-inbox__details">
        <div>
          <dt>Correction workflow readiness</dt>
          <dd>{phase5kOwnerCorrectionWorkflowReadinessPath}</dd>
        </div>
        <div>
          <dt>Public content-gap register</dt>
          <dd>{phase5kPublicContentGapRegisterPath}</dd>
        </div>
        <div>
          <dt>Owner feedback intake readiness</dt>
          <dd>{phase5jOwnerFeedbackIntakeReadinessPath}</dd>
        </div>
        <div>
          <dt>Correction queue reconciliation</dt>
          <dd>{phase5jOwnerCorrectionQueueReconciliationPath}</dd>
        </div>
        <div>
          <dt>Evidence status</dt>
          <dd>[NOT EVIDENCE / NOT RECORDED]</dd>
        </div>
        <div>
          <dt>Deployment status</dt>
          <dd>[DEPLOYMENT APPROVAL: NOT GRANTED]</dd>
        </div>
      </dl>
      <h4>Safe future correction stages</h4>
      <ul className="admin-readiness__list">
        {phase5kCorrectionStages.map((stage) => (
          <li key={stage}>{stage}</li>
        ))}
      </ul>
      <h4>Public content-gap groups</h4>
      <ul className="admin-readiness__list">
        {phase5kPublicContentGapGroups.map((group) => (
          <li key={group}>{group}</li>
        ))}
      </ul>
      <h4>Blocked correction categories</h4>
      <ul className="admin-readiness__list">
        {phase5kBlockedCorrectionCategories.map((category) => (
          <li key={category}>{category}</li>
        ))}
      </ul>
      <p>
        This helper stays protected admin-only and does not expose correction
        workflow internals, content-gap register internals, owner handoff
        internals, release-control internals, or admin route internals to public
        rental, listing, quote, enquiry, or request routes.
      </p>
    </section>
  );
}


function OwnerReReviewRequestReadinessHelper() {
  return (
    <section
      aria-label="Phase 5L owner re-review request readiness helper"
      className="admin-dashboard__card admin-dashboard__card--summary"
    >
      <p className="eyebrow">Phase 5L-A/B admin-only owner re-review request readiness</p>
      <h3>Owner re-review request readiness helper</h3>
      <p>
        This protected admin-only helper prepares a future local owner re-review
        request package after separate correction PRs exist. No owner re-review is recorded here. No owner response is sent here. No owner sign-off is claimed here. No correction completion is claimed here. No deployment approval is granted here.
      </p>
      <dl className="quote-inbox__details">
        <div>
          <dt>Owner re-review request readiness</dt>
          <dd>{phase5lOwnerReReviewRequestReadinessPath}</dd>
        </div>
        <div>
          <dt>Correction delta packet template</dt>
          <dd>{phase5lCorrectionDeltaPacketTemplatePath}</dd>
        </div>
        <div>
          <dt>Owner correction workflow readiness</dt>
          <dd>{phase5kOwnerCorrectionWorkflowReadinessPath}</dd>
        </div>
        <div>
          <dt>Public content-gap register</dt>
          <dd>{phase5kPublicContentGapRegisterPath}</dd>
        </div>
        <div>
          <dt>Evidence status</dt>
          <dd>[NOT EVIDENCE / NOT RECORDED]</dd>
        </div>
        <div>
          <dt>Deployment status</dt>
          <dd>[DEPLOYMENT APPROVAL: NOT GRANTED]</dd>
        </div>
      </dl>
      <h4>Safe future re-review request sections</h4>
      <ul className="admin-readiness__list">
        {phase5lSafeReReviewSections.map((section) => (
          <li key={section}>{section}</li>
        ))}
      </ul>
      <h4>Correction delta packet placeholders</h4>
      <ul className="admin-readiness__list">
        {phase5lCorrectionDeltaPlaceholders.map((placeholder) => (
          <li key={placeholder}>{placeholder}</li>
        ))}
      </ul>
      <h4>No-response/no-signoff boundaries</h4>
      <ul className="admin-readiness__list">
        {phase5lNoResponseNoSignoffBoundaries.map((boundary) => (
          <li key={boundary}>{boundary}</li>
        ))}
      </ul>
      <p>
        This helper stays protected admin-only and does not expose owner
        re-review request internals, correction delta packet internals, owner
        correction workflow internals, content-gap register internals, owner
        handoff internals, release-control internals, or admin route internals
        to public rental, listing, quote, enquiry, or request routes.
      </p>
    </section>
  );
}


function OwnerDecisionIntakeReadinessHelper() {
  return (
    <section
      aria-label="Phase 5M owner decision intake readiness helper"
      className="admin-dashboard__card admin-dashboard__card--summary"
    >
      <p className="eyebrow">Phase 5M-A/B admin-only owner decision intake readiness</p>
      <h3>Owner decision intake readiness helper</h3>
      <p>
        This protected admin-only helper prepares a future local owner decision
        intake package after owner re-review and correction delta references
        exist. No owner decision is recorded here. No owner approval is recorded here. No owner sign-off is claimed here. No launch clearance is granted here. No deployment approval is granted here.
      </p>
      <dl className="quote-inbox__details">
        <div>
          <dt>Owner decision intake readiness</dt>
          <dd>{phase5mOwnerDecisionIntakeReadinessPath}</dd>
        </div>
        <div>
          <dt>Sign-off criteria ledger template</dt>
          <dd>{phase5mSignoffCriteriaLedgerTemplatePath}</dd>
        </div>
        <div>
          <dt>Owner re-review request readiness</dt>
          <dd>{phase5lOwnerReReviewRequestReadinessPath}</dd>
        </div>
        <div>
          <dt>Correction delta packet template</dt>
          <dd>{phase5lCorrectionDeltaPacketTemplatePath}</dd>
        </div>
        <div>
          <dt>Evidence status</dt>
          <dd>[NOT EVIDENCE / NOT RECORDED]</dd>
        </div>
        <div>
          <dt>Deployment status</dt>
          <dd>[DEPLOYMENT APPROVAL: NOT GRANTED]</dd>
        </div>
      </dl>
      <h4>Safe future decision intake sections</h4>
      <ul className="admin-readiness__list">
        {phase5mSafeDecisionIntakeSections.map((section) => (
          <li key={section}>{section}</li>
        ))}
      </ul>
      <h4>Sign-off criteria ledger placeholders</h4>
      <ul className="admin-readiness__list">
        {phase5mSignoffLedgerPlaceholders.map((placeholder) => (
          <li key={placeholder}>{placeholder}</li>
        ))}
      </ul>
      <h4>Allowed future decision statuses</h4>
      <ul className="admin-readiness__list">
        {phase5mAllowedFutureDecisionStatuses.map((status) => (
          <li key={status}>{status}</li>
        ))}
      </ul>
      <h4>No-launch/no-deploy boundaries</h4>
      <ul className="admin-readiness__list">
        {phase5mNoLaunchNoDeployBoundaries.map((boundary) => (
          <li key={boundary}>{boundary}</li>
        ))}
      </ul>
      <p>
        This helper stays protected admin-only and does not expose owner
        decision intake internals, sign-off criteria ledger internals, owner
        re-review request internals, correction delta packet internals, owner
        handoff internals, release-control internals, or admin route internals
        to public rental, listing, quote, enquiry, or request routes.
      </p>
    </section>
  );
}


function DeploymentApprovalRequestReadinessHelper() {
  return (
    <section
      aria-label="Phase 5N deployment approval request readiness helper"
      className="admin-dashboard__card admin-dashboard__card--summary"
    >
      <p className="eyebrow">Phase 5N-A/B admin-only deployment approval request readiness</p>
      <h3>Deployment approval request readiness helper</h3>
      <p>
        This protected admin-only helper prepares a future local deployment approval
        request package after owner decision and sign-off criteria references exist.
        No deployment approval is recorded here. No launch clearance is granted here.
        No provider setup is performed here. No environment/secrets are created here.
        No production evidence is captured here. No deployment is performed here.
      </p>
      <dl className="quote-inbox__details">
        <div>
          <dt>Deployment approval request readiness</dt>
          <dd>{phase5nDeploymentApprovalRequestReadinessPath}</dd>
        </div>
        <div>
          <dt>Pre-launch blocker ledger template</dt>
          <dd>{phase5nPreLaunchBlockerLedgerTemplatePath}</dd>
        </div>
        <div>
          <dt>Owner decision intake readiness</dt>
          <dd>{phase5mOwnerDecisionIntakeReadinessPath}</dd>
        </div>
        <div>
          <dt>Sign-off criteria ledger template</dt>
          <dd>{phase5mSignoffCriteriaLedgerTemplatePath}</dd>
        </div>
        <div>
          <dt>Evidence status</dt>
          <dd>[NOT EVIDENCE / NOT RECORDED]</dd>
        </div>
        <div>
          <dt>Deployment status</dt>
          <dd>[DEPLOYMENT APPROVAL: NOT GRANTED]</dd>
        </div>
      </dl>
      <h4>Safe future deployment approval request sections</h4>
      <ul className="admin-readiness__list">
        {phase5nSafeDeploymentApprovalRequestSections.map((section) => (
          <li key={section}>{section}</li>
        ))}
      </ul>
      <h4>Pre-launch blocker ledger placeholders</h4>
      <ul className="admin-readiness__list">
        {phase5nPreLaunchBlockerLedgerPlaceholders.map((placeholder) => (
          <li key={placeholder}>{placeholder}</li>
        ))}
      </ul>
      <h4>Allowed future approval request statuses</h4>
      <ul className="admin-readiness__list">
        {phase5nAllowedFutureApprovalRequestStatuses.map((status) => (
          <li key={status}>{status}</li>
        ))}
      </ul>
      <h4>No-provider/no-deploy boundaries</h4>
      <ul className="admin-readiness__list">
        {phase5nNoProviderNoDeployBoundaries.map((boundary) => (
          <li key={boundary}>{boundary}</li>
        ))}
      </ul>
      <p>
        This helper stays protected admin-only and does not expose deployment
        approval request internals, pre-launch blocker ledger internals, owner
        decision intake internals, sign-off criteria ledger internals, provider
        setup internals, environment/secrets internals, owner handoff internals,
        release-control internals, or admin route internals to public rental,
        listing, quote, enquiry, or request routes.
      </p>
    </section>
  );
}


function DeploymentExecutionRunbookReadinessHelper() {
  return (
    <section
      aria-label="Phase 5O deployment execution runbook readiness helper"
      className="admin-dashboard__card admin-dashboard__card--summary"
    >
      <p className="eyebrow">Phase 5O-A/B admin-only deployment execution runbook readiness</p>
      <h3>Deployment execution runbook readiness helper</h3>
      <p>
        This protected admin-only helper prepares a future local deployment execution
        runbook package after deployment approval request and pre-launch blocker
        references exist. No deployment is performed here. No provider setup is
        performed here. No environment/secrets are created here. No preview is published here. No production launch is performed here. No smoke evidence is captured here. No rollback is executed here. No deployment approval is granted here.
      </p>
      <dl className="quote-inbox__details">
        <div>
          <dt>Deployment execution runbook readiness</dt>
          <dd>{phase5oDeploymentExecutionRunbookReadinessPath}</dd>
        </div>
        <div>
          <dt>Provider/environment decision matrix template</dt>
          <dd>{phase5oProviderEnvDecisionMatrixTemplatePath}</dd>
        </div>
        <div>
          <dt>Deployment approval request readiness</dt>
          <dd>{phase5nDeploymentApprovalRequestReadinessPath}</dd>
        </div>
        <div>
          <dt>Pre-launch blocker ledger template</dt>
          <dd>{phase5nPreLaunchBlockerLedgerTemplatePath}</dd>
        </div>
        <div>
          <dt>Evidence status</dt>
          <dd>[NOT EVIDENCE / NOT RECORDED]</dd>
        </div>
        <div>
          <dt>Deployment status</dt>
          <dd>[DEPLOYMENT APPROVAL: NOT GRANTED]</dd>
        </div>
      </dl>
      <h4>Safe future deployment execution runbook sections</h4>
      <ul className="admin-readiness__list">
        {phase5oSafeDeploymentExecutionRunbookSections.map((section) => (
          <li key={section}>{section}</li>
        ))}
      </ul>
      <h4>Provider/environment decision matrix placeholders</h4>
      <ul className="admin-readiness__list">
        {phase5oProviderEnvDecisionMatrixPlaceholders.map((placeholder) => (
          <li key={placeholder}>{placeholder}</li>
        ))}
      </ul>
      <h4>Allowed future runbook statuses</h4>
      <ul className="admin-readiness__list">
        {phase5oAllowedFutureRunbookStatuses.map((status) => (
          <li key={status}>{status}</li>
        ))}
      </ul>
      <h4>No-execution boundaries</h4>
      <ul className="admin-readiness__list">
        {phase5oNoExecutionBoundaries.map((boundary) => (
          <li key={boundary}>{boundary}</li>
        ))}
      </ul>
      <p>
        This helper stays protected admin-only and does not expose deployment
        execution runbook internals, provider/environment decision matrix
        internals, deployment approval request internals, pre-launch blocker
        ledger internals, provider setup internals, environment/secrets
        internals, smoke/rollback internals, owner handoff internals,
        release-control internals, or admin route internals to public rental,
        listing, quote, enquiry, or request routes.
      </p>
    </section>
  );
}


function SmokeEvidenceIntakeReadinessHelper() {
  return (
    <section
      aria-label="Phase 5P smoke evidence intake readiness helper"
      className="admin-dashboard__card admin-dashboard__card--summary"
    >
      <p className="eyebrow">Phase 5P-A/B admin-only smoke evidence intake readiness</p>
      <h3>Smoke evidence intake readiness helper</h3>
      <p>
        This protected admin-only helper prepares future local smoke evidence
        intake and route verification ledger structure after the deployment
        execution runbook exists. No smoke check is run here. No route walkthrough is recorded here. No rollback is executed here. No preview evidence is captured here. No production evidence is captured here. No deployment is performed here. No deployment approval is granted here.
      </p>
      <dl className="quote-inbox__details">
        <div>
          <dt>Smoke evidence intake readiness</dt>
          <dd>{phase5pSmokeEvidenceIntakeReadinessPath}</dd>
        </div>
        <div>
          <dt>Route verification and rollback ledger template</dt>
          <dd>{phase5pRouteVerificationRollbackLedgerTemplatePath}</dd>
        </div>
        <div>
          <dt>Deployment execution runbook readiness</dt>
          <dd>{phase5oDeploymentExecutionRunbookReadinessPath}</dd>
        </div>
        <div>
          <dt>Provider/environment decision matrix template</dt>
          <dd>{phase5oProviderEnvDecisionMatrixTemplatePath}</dd>
        </div>
        <div>
          <dt>Evidence status</dt>
          <dd>[NOT EVIDENCE / NOT RECORDED]</dd>
        </div>
        <div>
          <dt>Deployment status</dt>
          <dd>[DEPLOYMENT APPROVAL: NOT GRANTED]</dd>
        </div>
      </dl>
      <h4>Safe future smoke intake sections</h4>
      <ul className="admin-readiness__list">
        {phase5pSafeFutureSmokeIntakeSections.map((section) => (
          <li key={section}>{section}</li>
        ))}
      </ul>
      <h4>Route verification / rollback ledger placeholders</h4>
      <ul className="admin-readiness__list">
        {phase5pRouteVerificationRollbackLedgerPlaceholders.map((placeholder) => (
          <li key={placeholder}>{placeholder}</li>
        ))}
      </ul>
      <h4>Allowed future smoke intake statuses</h4>
      <ul className="admin-readiness__list">
        {phase5pAllowedFutureSmokeIntakeStatuses.map((status) => (
          <li key={status}>{status}</li>
        ))}
      </ul>
      <h4>No-evidence/no-run boundaries</h4>
      <ul className="admin-readiness__list">
        {phase5pNoEvidenceNoRunBoundaries.map((boundary) => (
          <li key={boundary}>{boundary}</li>
        ))}
      </ul>
      <p>
        This helper stays protected admin-only and does not expose smoke evidence
        intake internals, route verification ledger internals, rollback
        observation internals, deployment execution runbook internals,
        provider/environment decision matrix internals, provider setup internals,
        environment/secrets internals, owner handoff internals, release-control
        internals, or admin route internals to public rental, listing, quote,
        enquiry, or request routes.
      </p>
    </section>
  );
}


function SmokeEvidenceReviewReadinessHelper() {
  return (
    <section
      aria-label="Phase 5Q smoke evidence review readiness helper"
      className="admin-dashboard__card admin-dashboard__card--summary"
    >
      <p className="eyebrow">Phase 5Q-A/B admin-only smoke evidence review readiness</p>
      <h3>Smoke evidence review readiness helper</h3>
      <p>
        This protected admin-only helper prepares future local smoke evidence
        review and go/no-go decision ledger structure after smoke evidence is
        captured later under separate approval. No smoke evidence is reviewed here. No go/no-go decision is recorded here. No launch clearance is granted here. No route verification is recorded here. No rollback evidence is captured here. No preview evidence is captured here. No production evidence is captured here. No deployment is performed here. No deployment approval is granted here.
      </p>
      <dl className="quote-inbox__details">
        <div>
          <dt>Smoke evidence review readiness</dt>
          <dd>{phase5qSmokeEvidenceReviewReadinessPath}</dd>
        </div>
        <div>
          <dt>Go/no-go decision ledger template</dt>
          <dd>{phase5qGoNogoDecisionLedgerTemplatePath}</dd>
        </div>
        <div>
          <dt>Smoke evidence intake readiness</dt>
          <dd>{phase5pSmokeEvidenceIntakeReadinessPath}</dd>
        </div>
        <div>
          <dt>Route verification and rollback ledger template</dt>
          <dd>{phase5pRouteVerificationRollbackLedgerTemplatePath}</dd>
        </div>
        <div>
          <dt>Evidence status</dt>
          <dd>[NOT EVIDENCE / NOT RECORDED]</dd>
        </div>
        <div>
          <dt>Deployment status</dt>
          <dd>[DEPLOYMENT APPROVAL: NOT GRANTED]</dd>
        </div>
      </dl>
      <h4>Safe future evidence review sections</h4>
      <ul className="admin-readiness__list">
        {phase5qSafeFutureEvidenceReviewSections.map((section) => (
          <li key={section}>{section}</li>
        ))}
      </ul>
      <h4>Go/no-go decision ledger placeholders</h4>
      <ul className="admin-readiness__list">
        {phase5qGoNogoDecisionLedgerPlaceholders.map((placeholder) => (
          <li key={placeholder}>{placeholder}</li>
        ))}
      </ul>
      <h4>Allowed future evidence review statuses</h4>
      <ul className="admin-readiness__list">
        {phase5qAllowedFutureEvidenceReviewStatuses.map((status) => (
          <li key={status}>{status}</li>
        ))}
      </ul>
      <h4>No-review/no-launch boundaries</h4>
      <ul className="admin-readiness__list">
        {phase5qNoReviewNoLaunchBoundaries.map((boundary) => (
          <li key={boundary}>{boundary}</li>
        ))}
      </ul>
      <p>
        This helper stays protected admin-only and does not expose smoke evidence
        review internals, go/no-go decision ledger internals, smoke evidence
        intake internals, route verification ledger internals, rollback
        observation internals, deployment execution runbook internals,
        provider/environment decision matrix internals, provider setup internals,
        environment/secrets internals, owner handoff internals, release-control
        internals, or admin route internals to public rental, listing, quote,
        enquiry, or request routes.
      </p>
    </section>
  );
}


function LaunchDecisionResponseReadinessHelper() {
  return (
    <section
      aria-label="Phase 5R launch decision response readiness helper"
      className="admin-dashboard__card admin-dashboard__card--summary"
    >
      <p className="eyebrow">Phase 5R-A/B admin-only launch decision response readiness</p>
      <h3>Launch decision response readiness helper</h3>
      <p>
        This protected admin-only helper prepares future local launch decision
        response and release closure / continuation packet structure after a
        real go/no-go decision is recorded later under separate approval. No launch decision response is sent here. No go/no-go decision is recorded here. No launch clearance is granted here. No release closure is claimed here. No response-sent evidence is captured here. No preview evidence is captured here. No production evidence is captured here. No deployment is performed here. No deployment approval is granted here.
      </p>
      <dl className="quote-inbox__details">
        <div>
          <dt>Launch decision response readiness</dt>
          <dd>{phase5rLaunchDecisionResponseReadinessPath}</dd>
        </div>
        <div>
          <dt>Release closure / continuation packet template</dt>
          <dd>{phase5rReleaseClosurePacketTemplatePath}</dd>
        </div>
        <div>
          <dt>Smoke evidence review readiness</dt>
          <dd>{phase5qSmokeEvidenceReviewReadinessPath}</dd>
        </div>
        <div>
          <dt>Go/no-go decision ledger template</dt>
          <dd>{phase5qGoNogoDecisionLedgerTemplatePath}</dd>
        </div>
        <div>
          <dt>Evidence status</dt>
          <dd>[NOT EVIDENCE / NOT RECORDED]</dd>
        </div>
        <div>
          <dt>Deployment status</dt>
          <dd>[DEPLOYMENT APPROVAL: NOT GRANTED]</dd>
        </div>
      </dl>
      <h4>Safe future response sections</h4>
      <ul className="admin-readiness__list">
        {phase5rSafeFutureResponseSections.map((section) => (
          <li key={section}>{section}</li>
        ))}
      </ul>
      <h4>Release closure / continuation packet placeholders</h4>
      <ul className="admin-readiness__list">
        {phase5rReleaseClosurePacketPlaceholders.map((placeholder) => (
          <li key={placeholder}>{placeholder}</li>
        ))}
      </ul>
      <h4>Allowed future response statuses</h4>
      <ul className="admin-readiness__list">
        {phase5rAllowedFutureResponseStatuses.map((status) => (
          <li key={status}>{status}</li>
        ))}
      </ul>
      <h4>No-response/no-launch boundaries</h4>
      <ul className="admin-readiness__list">
        {phase5rNoResponseNoLaunchBoundaries.map((boundary) => (
          <li key={boundary}>{boundary}</li>
        ))}
      </ul>
      <p>
        This helper stays protected admin-only and does not expose launch
        decision response internals, release closure packet internals, smoke
        evidence review internals, go/no-go decision ledger internals, smoke
        evidence intake internals, route verification ledger internals,
        rollback observation internals, deployment execution runbook internals,
        provider/environment decision matrix internals, provider setup internals,
        environment/secrets internals, owner handoff internals, release-control
        internals, or admin route internals to public rental, listing, quote,
        enquiry, or request routes.
      </p>
    </section>
  );
}


function PostLaunchObservationReadinessHelper() {
  return (
    <section
      aria-label="Phase 5S post-launch observation readiness helper"
      className="admin-dashboard__card admin-dashboard__card--summary"
    >
      <p className="eyebrow">Phase 5S-A/B admin-only post-launch observation readiness</p>
      <h3>Post-launch observation readiness helper</h3>
      <p>
        This protected admin-only helper prepares future local post-launch
        observation and incident/follow-up ledger structure after a real approved
        launch and release closure happen later under separate approval. No live monitoring is configured here. No incident is recorded here. No support response is sent here. No customer follow-up is sent here. No post-launch evidence is captured here. No monitoring evidence is captured here. No analytics evidence is captured here. No rollback is executed here. No deployment is performed here. No deployment approval is granted here.
      </p>
      <dl className="quote-inbox__details">
        <div>
          <dt>Post-launch observation readiness</dt>
          <dd>{phase5sPostLaunchObservationReadinessPath}</dd>
        </div>
        <div>
          <dt>Incident/follow-up ledger template</dt>
          <dd>{phase5sIncidentFollowupLedgerTemplatePath}</dd>
        </div>
        <div>
          <dt>Launch decision response readiness</dt>
          <dd>{phase5rLaunchDecisionResponseReadinessPath}</dd>
        </div>
        <div>
          <dt>Release closure / continuation packet template</dt>
          <dd>{phase5rReleaseClosurePacketTemplatePath}</dd>
        </div>
        <div>
          <dt>Evidence status</dt>
          <dd>[NOT EVIDENCE / NOT RECORDED]</dd>
        </div>
        <div>
          <dt>Deployment status</dt>
          <dd>[DEPLOYMENT APPROVAL: NOT GRANTED]</dd>
        </div>
      </dl>
      <h4>Safe future observation sections</h4>
      <ul className="admin-readiness__list">
        {phase5sSafeFutureObservationSections.map((section) => (
          <li key={section}>{section}</li>
        ))}
      </ul>
      <h4>Incident/follow-up ledger placeholders</h4>
      <ul className="admin-readiness__list">
        {phase5sIncidentFollowupLedgerPlaceholders.map((placeholder) => (
          <li key={placeholder}>{placeholder}</li>
        ))}
      </ul>
      <h4>Allowed future observation statuses</h4>
      <ul className="admin-readiness__list">
        {phase5sAllowedFutureObservationStatuses.map((status) => (
          <li key={status}>{status}</li>
        ))}
      </ul>
      <h4>No-monitoring/no-incident boundaries</h4>
      <ul className="admin-readiness__list">
        {phase5sNoMonitoringNoIncidentBoundaries.map((boundary) => (
          <li key={boundary}>{boundary}</li>
        ))}
      </ul>
      <p>
        This helper stays protected admin-only and does not expose post-launch
        observation internals, incident/follow-up ledger internals, launch
        decision response internals, release closure packet internals, smoke
        evidence review internals, go/no-go decision ledger internals,
        monitoring/analytics internals, provider setup internals,
        environment/secrets internals, owner handoff internals, release-control
        internals, or admin route internals to public rental, listing, quote,
        enquiry, or request routes.
      </p>
    </section>
  );
}



function PostLaunchRemediationReadinessHelper() {
  return (
    <section
      aria-label="Phase 5T post-launch remediation readiness helper"
      className="admin-readiness"
    >
      <p className="eyebrow">Phase 5T-A/B admin-only post-launch remediation readiness</p>
      <h3>Post-launch remediation readiness helper</h3>
      <p>
        This protected helper prepares future approved remediation planning for
        rental listings, event furniture listings, categories, media, quote,
        enquiry, and request surfaces. No live hotfix is applied here. No
        production change is made here. No remediation is performed here. No
        incident is recorded here. No support response is sent here. No customer
        follow-up is sent here. No remediation evidence is captured here. No
        monitoring evidence is captured here. No analytics evidence is captured
        here. No rollback is executed here. No deployment is performed here. No
        deployment approval is granted here.
      </p>
      <dl className="admin-readiness__grid">
        <div>
          <dt>Post-launch remediation readiness</dt>
          <dd>{phase5tPostLaunchRemediationReadinessPath}</dd>
        </div>
        <div>
          <dt>Incident triage correction backlog template</dt>
          <dd>{phase5tIncidentTriageCorrectionBacklogTemplatePath}</dd>
        </div>
        <div>
          <dt>Post-launch observation readiness</dt>
          <dd>{phase5sPostLaunchObservationReadinessPath}</dd>
        </div>
        <div>
          <dt>Incident/follow-up ledger template</dt>
          <dd>{phase5sIncidentFollowupLedgerTemplatePath}</dd>
        </div>
        <div>
          <dt>Evidence status</dt>
          <dd>[NOT EVIDENCE / NOT RECORDED]</dd>
        </div>
        <div>
          <dt>Deployment status</dt>
          <dd>[DEPLOYMENT APPROVAL: NOT GRANTED]</dd>
        </div>
      </dl>
      <h4>Safe future remediation sections</h4>
      <ul className="admin-readiness__list">
        {phase5tSafeFutureRemediationSections.map((section) => (
          <li key={section}>{section}</li>
        ))}
      </ul>
      <h4>Incident triage/correction backlog placeholders</h4>
      <ul className="admin-readiness__list">
        {phase5tIncidentTriageCorrectionBacklogPlaceholders.map((placeholder) => (
          <li key={placeholder}>{placeholder}</li>
        ))}
      </ul>
      <h4>Allowed future remediation statuses</h4>
      <ul className="admin-readiness__list">
        {phase5tAllowedFutureRemediationStatuses.map((status) => (
          <li key={status}>{status}</li>
        ))}
      </ul>
      <h4>No-hotfix/no-remediation boundaries</h4>
      <ul className="admin-readiness__list">
        {phase5tNoHotfixNoRemediationBoundaries.map((boundary) => (
          <li key={boundary}>{boundary}</li>
        ))}
      </ul>
      <p>
        This helper stays protected admin-only and does not expose post-launch
        remediation internals, incident triage correction backlog internals,
        post-launch observation internals, incident/follow-up ledger internals,
        monitoring/analytics internals, hotfix internals, provider setup
        internals, environment/secrets internals, owner handoff internals,
        release-control internals, or admin route internals to public rental,
        listing, quote, enquiry, or request routes.
      </p>
    </section>
  );
}


function RemediationVerificationReadinessHelper() {
  return (
    <section
      aria-label="Phase 5U remediation verification readiness helper"
      className="admin-readiness"
    >
      <p className="eyebrow">Phase 5U-A/B admin-only remediation verification readiness</p>
      <h3>Remediation verification readiness helper</h3>
      <p>
        This protected helper prepares future approved remediation verification
        planning for rental listings, event furniture listings, categories,
        media, quote, enquiry, and request surfaces. No correction retest is run
        here. No incident resolution is recorded here. No correction completion
        is claimed here. No live hotfix is applied here. No production change is
        made here. No remediation is performed here. No support response is sent
        here. No customer follow-up is sent here. No retest evidence is captured
        here. No resolution evidence is captured here. No remediation evidence is
        captured here. No rollback is executed here. No deployment is performed
        here. No deployment approval is granted here.
      </p>
      <dl className="admin-readiness__grid">
        <div>
          <dt>Remediation verification readiness</dt>
          <dd>{phase5uRemediationVerificationReadinessPath}</dd>
        </div>
        <div>
          <dt>Correction retest / resolution ledger template</dt>
          <dd>{phase5uCorrectionRetestResolutionLedgerTemplatePath}</dd>
        </div>
        <div>
          <dt>Post-launch remediation readiness</dt>
          <dd>{phase5tPostLaunchRemediationReadinessPath}</dd>
        </div>
        <div>
          <dt>Incident triage correction backlog template</dt>
          <dd>{phase5tIncidentTriageCorrectionBacklogTemplatePath}</dd>
        </div>
        <div>
          <dt>Evidence status</dt>
          <dd>[NOT EVIDENCE / NOT RECORDED]</dd>
        </div>
        <div>
          <dt>Deployment status</dt>
          <dd>[DEPLOYMENT APPROVAL: NOT GRANTED]</dd>
        </div>
      </dl>
      <h4>Safe future verification sections</h4>
      <ul className="admin-readiness__list">
        {phase5uSafeFutureVerificationSections.map((section) => (
          <li key={section}>{section}</li>
        ))}
      </ul>
      <h4>Correction retest/resolution ledger placeholders</h4>
      <ul className="admin-readiness__list">
        {phase5uCorrectionRetestResolutionLedgerPlaceholders.map((placeholder) => (
          <li key={placeholder}>{placeholder}</li>
        ))}
      </ul>
      <h4>Allowed future verification statuses</h4>
      <ul className="admin-readiness__list">
        {phase5uAllowedFutureVerificationStatuses.map((status) => (
          <li key={status}>{status}</li>
        ))}
      </ul>
      <h4>No-retest/no-resolution boundaries</h4>
      <ul className="admin-readiness__list">
        {phase5uNoRetestNoResolutionBoundaries.map((boundary) => (
          <li key={boundary}>{boundary}</li>
        ))}
      </ul>
      <p>
        This helper stays protected admin-only and does not expose remediation
        verification internals, correction retest resolution ledger internals,
        post-launch remediation internals, incident triage correction backlog
        internals, monitoring/analytics internals, hotfix internals, retest
        internals, resolution internals, provider setup internals,
        environment/secrets internals, owner handoff internals, release-control
        internals, or admin route internals to public rental, listing, quote,
        enquiry, or request routes.
      </p>
    </section>
  );
}



function IncidentResolutionResponseReadinessHelper() {
  return (
    <section
      aria-label="Phase 5V incident resolution response readiness helper"
      className="admin-readiness"
    >
      <p className="eyebrow">Phase 5V-A/B admin-only incident resolution response readiness</p>
      <h3>Incident resolution response readiness helper</h3>
      <p>
        This protected helper prepares future approved incident resolution
        response readiness for rental listings, event furniture listings,
        categories, media, quote, enquiry, and request surfaces. No support
        response is sent here. No customer follow-up is sent here. No incident
        is closed here. No incident resolution is recorded here. No public
        notice is published here. No maintenance task is completed here. No
        response-sent evidence is captured here. No closure evidence is
        captured here. No resolution evidence is captured here. No remediation
        evidence is captured here. No rollback is executed here. No deployment
        is performed here. No deployment approval is granted here.
      </p>
      <dl className="admin-readiness__grid">
        <div>
          <dt>Incident resolution response readiness</dt>
          <dd>{phase5vIncidentResolutionResponseReadinessPath}</dd>
        </div>
        <div>
          <dt>Post-remediation closure / lessons ledger template</dt>
          <dd>{phase5vPostRemediationClosureLessonsLedgerTemplatePath}</dd>
        </div>
        <div>
          <dt>Remediation verification readiness</dt>
          <dd>{phase5uRemediationVerificationReadinessPath}</dd>
        </div>
        <div>
          <dt>Correction retest / resolution ledger template</dt>
          <dd>{phase5uCorrectionRetestResolutionLedgerTemplatePath}</dd>
        </div>
        <div>
          <dt>Evidence status</dt>
          <dd>[NOT EVIDENCE / NOT RECORDED]</dd>
        </div>
        <div>
          <dt>Deployment status</dt>
          <dd>[DEPLOYMENT APPROVAL: NOT GRANTED]</dd>
        </div>
      </dl>
      <h4>Safe future response sections</h4>
      <ul className="admin-readiness__list">
        {phase5vSafeFutureResponseSections.map((section) => (
          <li key={section}>{section}</li>
        ))}
      </ul>
      <h4>Post-remediation closure / lessons ledger placeholders</h4>
      <ul className="admin-readiness__list">
        {phase5vClosureLessonsLedgerPlaceholders.map((placeholder) => (
          <li key={placeholder}>{placeholder}</li>
        ))}
      </ul>
      <h4>Allowed future response statuses</h4>
      <ul className="admin-readiness__list">
        {phase5vAllowedFutureResponseStatuses.map((status) => (
          <li key={status}>{status}</li>
        ))}
      </ul>
      <h4>No-response/no-resolution boundaries</h4>
      <ul className="admin-readiness__list">
        {phase5vNoResponseNoResolutionBoundaries.map((boundary) => (
          <li key={boundary}>{boundary}</li>
        ))}
      </ul>
      <p>
        This helper stays protected admin-only and does not expose incident
        resolution response internals, post-remediation closure ledger internals,
        remediation verification internals, correction retest resolution ledger
        internals, support response internals, customer follow-up internals,
        public notice internals, maintenance internals, monitoring/analytics
        internals, hotfix internals, retest internals, resolution internals,
        provider setup internals, environment/secrets internals, owner handoff
        internals, release-control internals, or admin route internals to public
        rental, listing, quote, enquiry, or request routes.
      </p>
    </section>
  );
}


function PreventiveMaintenanceReadinessHelper() {
  return (
    <section
      aria-label="Phase 5W preventive maintenance readiness helper"
      className="admin-readiness"
    >
      <p className="eyebrow">Phase 5W-A/B admin-only preventive maintenance readiness</p>
      <h3>Preventive maintenance readiness helper</h3>
      <p>
        This protected helper prepares future approved preventive maintenance
        planning for rental listings, event furniture listings, categories,
        media, quote, enquiry, and request surfaces after real incident closure
        and lessons are approved later. No maintenance task is implemented here.
        No maintenance schedule is created here. No cron or job scheduler is
        added here. No monitoring is configured here. No analytics is configured
        here. No provider setup is performed here. No support response is sent
        here. No customer follow-up is sent here. No maintenance evidence is
        captured here. No monitoring evidence is captured here. No analytics
        evidence is captured here. No production change is made here. No
        rollback is executed here. No deployment is performed here. No
        deployment approval is granted here.
      </p>
      <dl className="admin-readiness__grid">
        <div>
          <dt>Preventive maintenance readiness</dt>
          <dd>{phase5wPreventiveMaintenanceReadinessPath}</dd>
        </div>
        <div>
          <dt>Lessons-to-maintenance backlog template</dt>
          <dd>{phase5wLessonsToMaintenanceBacklogTemplatePath}</dd>
        </div>
        <div>
          <dt>Incident resolution response readiness</dt>
          <dd>{phase5vIncidentResolutionResponseReadinessPath}</dd>
        </div>
        <div>
          <dt>Post-remediation closure / lessons ledger template</dt>
          <dd>{phase5vPostRemediationClosureLessonsLedgerTemplatePath}</dd>
        </div>
        <div>
          <dt>Evidence status</dt>
          <dd>[NOT EVIDENCE / NOT RECORDED]</dd>
        </div>
        <div>
          <dt>Deployment status</dt>
          <dd>[DEPLOYMENT APPROVAL: NOT GRANTED]</dd>
        </div>
      </dl>
      <h4>Safe future maintenance sections</h4>
      <ul className="admin-readiness__list">
        {phase5wSafeFutureMaintenanceSections.map((section) => (
          <li key={section}>{section}</li>
        ))}
      </ul>
      <h4>Lessons-to-maintenance backlog placeholders</h4>
      <ul className="admin-readiness__list">
        {phase5wLessonsToMaintenanceBacklogPlaceholders.map((placeholder) => (
          <li key={placeholder}>{placeholder}</li>
        ))}
      </ul>
      <h4>Allowed future maintenance statuses</h4>
      <ul className="admin-readiness__list">
        {phase5wAllowedFutureMaintenanceStatuses.map((status) => (
          <li key={status}>{status}</li>
        ))}
      </ul>
      <h4>No-maintenance/no-schedule boundaries</h4>
      <ul className="admin-readiness__list">
        {phase5wNoMaintenanceNoScheduleBoundaries.map((boundary) => (
          <li key={boundary}>{boundary}</li>
        ))}
      </ul>
      <p>
        This helper stays protected admin-only and does not expose preventive
        maintenance internals, lessons-to-maintenance backlog internals,
        incident resolution response internals, post-remediation closure ledger
        internals, support response internals, customer follow-up internals,
        public notice internals, maintenance internals, monitoring/analytics
        internals, scheduler/cron internals, provider setup internals,
        environment/secrets internals, owner handoff internals, release-control
        internals, or admin route internals to public rental, listing, quote,
        enquiry, or request routes.
      </p>
    </section>
  );
}


function MaintenanceApprovalReadinessHelper() {
  return (
    <section
      aria-label="Phase 5X maintenance approval readiness helper"
      className="admin-readiness"
    >
      <p className="eyebrow">Phase 5X-A/B admin-only maintenance approval readiness</p>
      <h3>Maintenance approval readiness helper</h3>
      <p>
        This protected helper prepares future owner/provider maintenance approval
        and change-window planning for rental listings, event furniture listings,
        categories, media, quote, enquiry, and request surfaces after preventive
        maintenance candidates are approved later. No owner approval is recorded
        here. No provider approval is recorded here. No maintenance approval is
        granted here. No maintenance schedule is created here. No change window
        is scheduled here. No cron or job scheduler is added here. No monitoring
        is configured here. No analytics is configured here. No provider setup is
        performed here. No maintenance task is implemented here. No maintenance
        approval evidence is captured here. No schedule evidence is captured
        here. No change-window evidence is captured here. No production change
        is made here. No rollback is executed here. No deployment is performed
        here. No deployment approval is granted here.
      </p>
      <dl className="admin-readiness__grid">
        <div>
          <dt>Maintenance approval readiness</dt>
          <dd>{phase5xMaintenanceApprovalReadinessPath}</dd>
        </div>
        <div>
          <dt>Maintenance change-window planning ledger template</dt>
          <dd>{phase5xMaintenanceChangeWindowPlanningLedgerTemplatePath}</dd>
        </div>
        <div>
          <dt>Preventive maintenance readiness</dt>
          <dd>{phase5wPreventiveMaintenanceReadinessPath}</dd>
        </div>
        <div>
          <dt>Lessons-to-maintenance backlog template</dt>
          <dd>{phase5wLessonsToMaintenanceBacklogTemplatePath}</dd>
        </div>
        <div>
          <dt>Evidence status</dt>
          <dd>[NOT EVIDENCE / NOT RECORDED]</dd>
        </div>
        <div>
          <dt>Deployment status</dt>
          <dd>[DEPLOYMENT APPROVAL: NOT GRANTED]</dd>
        </div>
      </dl>
      <h4>Safe future approval sections</h4>
      <ul className="admin-readiness__list">
        {phase5xSafeFutureApprovalSections.map((section) => (
          <li key={section}>{section}</li>
        ))}
      </ul>
      <h4>Maintenance approval/change-window ledger placeholders</h4>
      <ul className="admin-readiness__list">
        {phase5xMaintenanceApprovalLedgerPlaceholders.map((placeholder) => (
          <li key={placeholder}>{placeholder}</li>
        ))}
      </ul>
      <h4>Allowed future approval statuses</h4>
      <ul className="admin-readiness__list">
        {phase5xAllowedFutureApprovalStatuses.map((status) => (
          <li key={status}>{status}</li>
        ))}
      </ul>
      <h4>No-approval/no-schedule boundaries</h4>
      <ul className="admin-readiness__list">
        {phase5xNoApprovalNoScheduleBoundaries.map((boundary) => (
          <li key={boundary}>{boundary}</li>
        ))}
      </ul>
      <p>
        This helper stays protected admin-only and does not expose maintenance
        approval internals, maintenance change-window planning internals,
        preventive maintenance internals, lessons-to-maintenance backlog
        internals, monitoring/analytics internals, scheduler/cron internals,
        provider setup internals, environment/secrets internals, owner handoff
        internals, release-control internals, or admin route internals to public
        rental, listing, quote, enquiry, or request routes.
      </p>
    </section>
  );
}

function MaintenanceExecutionRunbookReadinessHelper() {
  return (
    <section
      aria-label="Phase 5Y maintenance execution runbook readiness helper"
      className="admin-readiness"
    >
      <p className="eyebrow">Phase 5Y-A/B admin-only maintenance execution runbook readiness</p>
      <h3>Maintenance execution runbook readiness helper</h3>
      <p>
        This protected helper prepares future maintenance execution runbook and
        change-window checklist review for rental listings, event furniture
        listings, categories, media, quote, enquiry, and request surfaces after
        maintenance approval and scheduling are separately granted later. No
        maintenance task is executed here. No maintenance task is implemented
        here. No change window is opened here. No maintenance schedule is
        created here. No cron or job scheduler is added here. No monitoring is
        configured here. No analytics is configured here. No provider setup is
        performed here. No execution precheck is completed here. No maintenance
        execution evidence is captured here. No schedule evidence is captured
        here. No change-window evidence is captured here. No production change
        is made here. No rollback is executed here. No deployment is performed
        here. No deployment approval is granted here.
      </p>
      <dl className="admin-readiness__grid">
        <div>
          <dt>Maintenance execution runbook readiness</dt>
          <dd>{phase5yMaintenanceExecutionRunbookReadinessPath}</dd>
        </div>
        <div>
          <dt>Maintenance change-window execution checklist template</dt>
          <dd>{phase5yMaintenanceChangeWindowExecutionChecklistTemplatePath}</dd>
        </div>
        <div>
          <dt>Maintenance approval readiness</dt>
          <dd>{phase5xMaintenanceApprovalReadinessPath}</dd>
        </div>
        <div>
          <dt>Maintenance change-window planning ledger template</dt>
          <dd>{phase5xMaintenanceChangeWindowPlanningLedgerTemplatePath}</dd>
        </div>
        <div>
          <dt>Evidence status</dt>
          <dd>[NOT EVIDENCE / NOT RECORDED]</dd>
        </div>
        <div>
          <dt>Deployment status</dt>
          <dd>[DEPLOYMENT APPROVAL: NOT GRANTED]</dd>
        </div>
      </dl>
      <h4>Safe future execution sections</h4>
      <ul className="admin-readiness__list">
        {phase5ySafeFutureExecutionSections.map((section) => (
          <li key={section}>{section}</li>
        ))}
      </ul>
      <h4>Maintenance change-window execution checklist placeholders</h4>
      <ul className="admin-readiness__list">
        {phase5yMaintenanceExecutionChecklistPlaceholders.map((placeholder) => (
          <li key={placeholder}>{placeholder}</li>
        ))}
      </ul>
      <h4>Allowed future execution statuses</h4>
      <ul className="admin-readiness__list">
        {phase5yAllowedFutureExecutionStatuses.map((status) => (
          <li key={status}>{status}</li>
        ))}
      </ul>
      <h4>No-execution/no-runtime boundaries</h4>
      <ul className="admin-readiness__list">
        {phase5yNoExecutionNoRuntimeBoundaries.map((boundary) => (
          <li key={boundary}>{boundary}</li>
        ))}
      </ul>
      <p>
        This helper stays protected admin-only and does not expose maintenance
        execution internals, change-window execution checklist internals,
        maintenance approval internals, maintenance change-window planning
        internals, monitoring/analytics internals, scheduler/cron internals,
        provider setup internals, environment/secrets internals, owner handoff
        internals, release-control internals, or admin route internals to public
        rental, listing, quote, enquiry, or request routes.
      </p>
    </section>
  );
}


function MaintenanceVerificationClosureReadinessHelper() {
  return (
    <section
      aria-label="Phase 5Z maintenance verification closure readiness helper"
      className="admin-readiness"
    >
      <p className="eyebrow">Phase 5Z-A/B admin-only maintenance verification closure readiness</p>
      <h3>Maintenance verification closure readiness helper</h3>
      <p>
        This protected helper prepares future maintenance verification closure
        packet review after a theoretical maintenance change window for rental
        listings, event furniture listings, categories, media, quote, enquiry,
        and request surfaces. It is readiness-only and placeholder-only. No
        maintenance task is executed here. No maintenance task is implemented
        here. No change window is scheduled or opened here. No execution
        checklist is completed here. No verification checklist is completed
        here. No maintenance closure is claimed here. No production evidence is
        collected here. No smoke check is run here. No provider or runtime check
        is executed here. No production readiness claim is made here. No closure
        approval is recorded here. No maintenance is marked complete here. No
        rollback is executed here. No deployment is performed here. No
        deployment approval is granted here.
      </p>
      <dl className="admin-readiness__grid">
        <div>
          <dt>Maintenance verification closure readiness</dt>
          <dd>{phase5zMaintenanceVerificationClosureReadinessPath}</dd>
        </div>
        <div>
          <dt>Maintenance change-window outcome ledger template</dt>
          <dd>{phase5zMaintenanceChangeWindowOutcomeLedgerTemplatePath}</dd>
        </div>
        <div>
          <dt>Maintenance execution runbook readiness</dt>
          <dd>{phase5yMaintenanceExecutionRunbookReadinessPath}</dd>
        </div>
        <div>
          <dt>Maintenance change-window execution checklist template</dt>
          <dd>{phase5yMaintenanceChangeWindowExecutionChecklistTemplatePath}</dd>
        </div>
        <div>
          <dt>Evidence status</dt>
          <dd>[NOT EVIDENCE / NOT RECORDED]</dd>
        </div>
        <div>
          <dt>Deployment status</dt>
          <dd>[DEPLOYMENT APPROVAL: NOT GRANTED]</dd>
        </div>
      </dl>
      <h4>Change-window outcome ledger</h4>
      <ul className="admin-readiness__list">
        {phase5zMaintenanceOutcomeLedgerPlaceholders.map((placeholder) => (
          <li key={placeholder}>{placeholder}</li>
        ))}
      </ul>
      <h4>Verification closure packet checklist</h4>
      <ul className="admin-readiness__list">
        {phase5zSafeFutureClosureSections.map((section) => (
          <li key={section}>{section}</li>
        ))}
      </ul>
      <h4>Allowed future closure-review statuses</h4>
      <ul className="admin-readiness__list">
        {phase5zAllowedFutureClosureStatuses.map((status) => (
          <li key={status}>{status}</li>
        ))}
      </ul>
      <h4>No-completion/no-production-evidence firewall</h4>
      <ul className="admin-readiness__list">
        {phase5zNoCompletionNoProductionEvidenceBoundaries.map((boundary) => (
          <li key={boundary}>{boundary}</li>
        ))}
      </ul>
      <p>
        Safe handoff language must stay draft, readiness, and placeholder only.
        Do not use finality language such as completed, verified, approved,
        cleared, evidence recorded, or production checked unless it is clearly
        negated as not allowed by this readiness helper. This helper stays
        protected admin-only and does not expose maintenance verification
        closure internals, change-window outcome ledger internals, closure
        packet internals, maintenance execution internals, provider/runtime
        internals, smoke-check internals, production evidence internals,
        scheduler/cron internals, environment/secrets internals, owner handoff
        internals, release-control internals, or admin route internals to public
        rental, listing, quote, enquiry, or request routes.
      </p>
    </section>
  );
}

function MaintenanceClosureDecisionReadinessHelper() {
  return (
    <section
      aria-label="Phase 6A maintenance closure decision readiness helper"
      className="admin-readiness"
    >
      <p className="eyebrow">Phase 6A-A/B admin-only maintenance closure decision readiness</p>
      <h3>Maintenance closure decision readiness helper</h3>
      <p>
        This protected helper prepares future owner/admin review of a
        theoretical maintenance closure recommendation packet after a future
        maintenance verification packet exists for rental listings, event
        furniture listings, categories, media, quote, enquiry, and request
        surfaces. It is readiness-only and placeholder-only. No closure
        decision is recorded here. No closure recommendation is accepted here.
        No closure approval is recorded here. No maintenance is marked complete
        here. No production evidence is collected here. No smoke check is run
        here. No provider or runtime check is executed here. No customer or
        support follow-up is sent here. No production readiness claim is made
        here. No deployment is performed here.
      </p>
      <dl className="admin-readiness__grid">
        <div>
          <dt>Maintenance closure decision readiness</dt>
          <dd>{phase6aMaintenanceClosureDecisionReadinessPath}</dd>
        </div>
        <div>
          <dt>Closure recommendation packet ledger template</dt>
          <dd>{phase6aMaintenanceClosureRecommendationPacketLedgerTemplatePath}</dd>
        </div>
        <div>
          <dt>Maintenance verification closure readiness</dt>
          <dd>{phase5zMaintenanceVerificationClosureReadinessPath}</dd>
        </div>
        <div>
          <dt>Maintenance change-window outcome ledger template</dt>
          <dd>{phase5zMaintenanceChangeWindowOutcomeLedgerTemplatePath}</dd>
        </div>
        <div>
          <dt>Recommendation status</dt>
          <dd>[PLACEHOLDER ONLY / NOT A RECOMMENDATION]</dd>
        </div>
        <div>
          <dt>Decision status</dt>
          <dd>[PLACEHOLDER ONLY / NOT A DECISION]</dd>
        </div>
      </dl>
      <h4>Closure recommendation packet ledger</h4>
      <ul className="admin-readiness__list">
        {phase6aClosureRecommendationPacketLedgerPlaceholders.map((placeholder) => (
          <li key={placeholder}>{placeholder}</li>
        ))}
      </ul>
      <h4>Closure decision readiness checklist</h4>
      <ul className="admin-readiness__list">
        {phase6aClosureDecisionReadinessChecklist.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <h4>No-approval/no-completion firewall</h4>
      <ul className="admin-readiness__list">
        {phase6aNoApprovalNoCompletionFirewall.map((boundary) => (
          <li key={boundary}>{boundary}</li>
        ))}
      </ul>
      <h4>Safe handoff language</h4>
      <p>
        Safe handoff language must stay draft, readiness, placeholder, intended,
        and theoretical only. Do not use finality language such as approved,
        accepted, closed, completed, verified, cleared, evidence recorded,
        production checked, owner signed off, maintenance completed, or closure
        granted unless it is clearly negated as not allowed by this readiness
        helper. This helper stays protected admin-only and does not expose
        maintenance closure decision internals, closure recommendation packet
        internals, maintenance verification internals, provider/runtime
        internals, smoke-check internals, production evidence internals,
        support follow-up internals, scheduler/cron internals,
        environment/secrets internals, owner handoff internals, release-control
        internals, or admin route internals to public rental, listing, quote,
        enquiry, or request routes.
      </p>
    </section>
  );
}

function MaintenanceClosureArchiveReadinessHelper() {
  const archiveReadinessSections = [
    "Maintenance closure decision readiness reference",
    "Closure recommendation packet ledger reference",
    "Intended closure decision reference placeholder",
    "Intended archive owner placeholder",
    "Intended retention category placeholder",
    "Intended archive packet contents placeholder",
    "Missing evidence blocker placeholder",
    "Unresolved follow-up blocker placeholder",
    "Archive retention ledger reference",
    "Final archive-readiness status"
  ];
  const archiveStatuses = [
    "Not started",
    "Closure decision not recorded",
    "Closure approval not recorded",
    "Maintenance not marked complete",
    "Missing evidence blocks archive",
    "Unresolved follow-up blocks archive",
    "Needs owner archive confirmation",
    "Needs external archive location clarification",
    "Blocked: no archive approval",
    "Blocked: deployment approval missing",
    "Ready for future approved archive review"
  ];
  const archiveBoundaries = [
    "An archive readiness template is not an archive",
    "An archive packet placeholder is not an archive record",
    "A retention placeholder is not an applied retention policy",
    "A missing-evidence blocker is not evidence",
    "Passing validators is not archive approval",
    "A merged PR is not maintenance closure archive"
  ];

  return (
    <section
      aria-label="Phase 6B maintenance closure archive readiness helper"
      className="admin-readiness"
    >
      <p className="eyebrow">Phase 6B-A/B admin-only maintenance closure archive readiness</p>
      <h3>Maintenance closure archive readiness helper</h3>
      <p>
        This protected helper prepares future owner/admin review of a theoretical
        maintenance closure archive and retention packet after a future closure
        decision is separately approved for rental listings, event furniture
        listings, categories, media, quote, enquiry, and request surfaces. It is
        readiness-only and placeholder-only. No closure archive is created here.
        No archive record is written here. No retention policy is applied here.
        No storage configuration is created here. No closure decision is recorded
        here. No closure approval is recorded here. No maintenance is marked
        complete here. No production evidence is collected here. No smoke check
        is run here. No provider or runtime check is executed here. No customer
        or support follow-up is sent here. No deployment is performed here. No
        deployment approval is granted here.
      </p>
      <dl className="admin-readiness__grid">
        <div><dt>Maintenance closure archive readiness</dt><dd>{phase6bMaintenanceClosureArchiveReadinessPath}</dd></div>
        <div><dt>Closure archive / retention ledger template</dt><dd>{phase6bMaintenanceClosureArchiveRetentionLedgerTemplatePath}</dd></div>
        <div><dt>Maintenance closure decision readiness</dt><dd>{phase6aMaintenanceClosureDecisionReadinessPath}</dd></div>
        <div><dt>Closure recommendation packet ledger template</dt><dd>{phase6aMaintenanceClosureRecommendationPacketLedgerTemplatePath}</dd></div>
        <div><dt>Evidence status</dt><dd>[NOT EVIDENCE / NOT RECORDED]</dd></div>
        <div><dt>Deployment status</dt><dd>[DEPLOYMENT APPROVAL: NOT GRANTED]</dd></div>
        <div><dt>Archive ID</dt><dd>[NOT ASSIGNED]</dd></div>
        <div><dt>Intended closure decision reference</dt><dd>[NOT SUPPLIED]</dd></div>
        <div><dt>Intended recommendation packet reference</dt><dd>[NOT SUPPLIED]</dd></div>
        <div><dt>Intended archive owner</dt><dd>[NOT ASSIGNED]</dd></div>
        <div><dt>Intended retention category</dt><dd>[NOT SELECTED]</dd></div>
        <div><dt>Intended archive packet contents</dt><dd>[NOT CAPTURED]</dd></div>
        <div><dt>Missing evidence blocker status</dt><dd>[BLOCKING / NOT EVIDENCE]</dd></div>
        <div><dt>External archive location decision</dt><dd>[PROVIDER DECISION REQUIRED]</dd></div>
        <div><dt>Archive status</dt><dd>[NOT CREATED]</dd></div>
        <div><dt>Retention status</dt><dd>[NOT APPLIED]</dd></div>
      </dl>
      <h4>Safe future archive-readiness sections</h4>
      <ul className="admin-readiness__list">{archiveReadinessSections.map((item) => <li key={item}>{item}</li>)}</ul>
      <h4>Allowed future archive-readiness statuses</h4>
      <ul className="admin-readiness__list">{archiveStatuses.map((item) => <li key={item}>{item}</li>)}</ul>
      <h4>No-archive/no-record boundaries</h4>
      <ul className="admin-readiness__list">{archiveBoundaries.map((item) => <li key={item}>{item}</li>)}</ul>
    </section>
  );
}

function MaintenanceClosureAuditHandoffReadinessHelper() {
  const routingLedgerFields = [
    "Intended archive/retention packet reference",
    "Intended closure decision readiness reference",
    "Intended audit handoff owner",
    "Intended internal reviewer",
    "Intended recipient placeholder",
    "Intended disclosure scope placeholder",
    "Missing evidence blocker placeholder",
    "Unresolved follow-up blocker placeholder",
    "External-disclosure status placeholder",
    "Handoff status placeholder",
    "No real handoff",
    "No external disclosure",
    "No audit packet sent"
  ];
  const readinessChecklist = [
    "Confirm the theoretical archive/retention packet reference would be reviewed before any future audit handoff discussion.",
    "Confirm unresolved follow-ups must block handoff until separately reviewed by the intended internal reviewer.",
    "Confirm missing evidence must block handoff because this helper does not collect or record production evidence.",
    "Confirm retention/archive readiness gaps must block handoff until a separate approved review resolves them.",
    "Confirm external disclosure questions remain unapproved and placeholder-only.",
    "Confirm customer, public, support, external message system, outbound email, SMS, and WhatsApp actions are not allowed.",
    "Confirm this helper does not create, approve, send, or complete an audit handoff."
  ];
  const firewall = [
    "No audit handoff is created here.",
    "No audit packet is sent here.",
    "No audit recipient is contacted here.",
    "No external disclosure is made here.",
    "Archive creation is blocked here.",
    "Archive record writing is blocked here.",
    "Retention policy application is blocked here.",
    "Closure decision recording is blocked here.",
    "Closure approval recording is blocked here.",
    "Maintenance completion marking is blocked here.",
    "Production evidence collection is blocked here.",
    "Smoke check runs are blocked here.",
    "Provider or runtime check execution is blocked here.",
    "Customer or support follow-up sending is blocked here.",
    "No production readiness claim is made here.",
    "Deployment approval granting is blocked here."
  ];

  return (
    <section aria-label="Phase 6C maintenance closure audit handoff readiness helper" className="admin-readiness">
      <p className="eyebrow">Phase 6C-A/B admin-only maintenance closure audit handoff readiness</p>
      <h3>Maintenance closure audit handoff readiness helper</h3>
      <p>
        This protected helper prepares future owner/admin review of a theoretical
        audit handoff packet and routing ledger after a theoretical maintenance
        closure archive and retention packet exists for rental listings, event
        furniture listings, categories, media, quote, enquiry, and request
        surfaces. It is draft, readiness-only, placeholder-only, and internal.
        No audit handoff is created here. No audit packet is sent here. No audit
        recipient is contacted here. No external disclosure is made here.
      </p>
      <dl className="admin-readiness__grid">
        <div><dt>Maintenance closure audit handoff readiness</dt><dd>{phase6cMaintenanceClosureAuditHandoffReadinessPath}</dd></div>
        <div><dt>Audit handoff packet routing ledger template</dt><dd>{phase6cMaintenanceClosureAuditHandoffRoutingLedgerTemplatePath}</dd></div>
        <div><dt>Maintenance closure decision readiness</dt><dd>{phase6aMaintenanceClosureDecisionReadinessPath}</dd></div>
        <div><dt>Intended archive/retention packet reference</dt><dd>[NOT SUPPLIED]</dd></div>
        <div><dt>Intended closure decision readiness reference</dt><dd>[NOT SUPPLIED]</dd></div>
        <div><dt>Intended audit handoff owner</dt><dd>[NOT ASSIGNED]</dd></div>
        <div><dt>Intended internal reviewer</dt><dd>[NOT ASSIGNED]</dd></div>
        <div><dt>Intended recipient</dt><dd>[PLACEHOLDER ONLY / NOT CONTACTED]</dd></div>
        <div><dt>Intended disclosure scope</dt><dd>[PLACEHOLDER ONLY / NOT APPROVED]</dd></div>
        <div><dt>Missing evidence blocker status</dt><dd>[BLOCKING / NOT EVIDENCE]</dd></div>
        <div><dt>Unresolved follow-up blocker status</dt><dd>[BLOCKING / NOT REVIEWED]</dd></div>
        <div><dt>External-disclosure status</dt><dd>[NOT DISCLOSED]</dd></div>
        <div><dt>Handoff status</dt><dd>[NOT CREATED / NOT SENT]</dd></div>
      </dl>
      <h4>Audit handoff packet routing ledger</h4>
      <ul className="admin-readiness__list">{routingLedgerFields.map((item) => <li key={item}>{item}</li>)}</ul>
      <h4>Audit handoff readiness checklist</h4>
      <ul className="admin-readiness__list">{readinessChecklist.map((item) => <li key={item}>{item}</li>)}</ul>
      <h4>No-handoff/no-external-disclosure firewall</h4>
      <ul className="admin-readiness__list">{firewall.map((item) => <li key={item}>{item}</li>)}</ul>
      <h4>Safe audit handoff wording</h4>
      <p>
        Safe handoff language uses draft, readiness, placeholder, intended, and theoretical wording only.
        Avoid finality wording unless it is clearly negated as not allowed.
      </p>
    </section>
  );
}

function MaintenanceClosureAuditFollowUpIntakeReadinessHelper() {
  const findingIntakeLedgerFields = [
    "Intended audit handoff reference",
    "Intended archive/retention packet reference",
    "Intended audit follow-up owner",
    "Intended internal reviewer",
    "Intended finding category placeholder",
    "Intended finding severity placeholder",
    "Missing evidence blocker placeholder",
    "Unresolved follow-up blocker placeholder",
    "Response status placeholder",
    "Remediation status placeholder",
    "No real finding received",
    "No audit response sent",
    "No remediation assigned"
  ];
  const readinessChecklist = [
    "Confirm the theoretical audit handoff reference would be reviewed before any future audit follow-up intake discussion.",
    "Confirm missing evidence must block intake because this helper does not collect or record production evidence.",
    "Confirm unresolved follow-ups must block intake until separately reviewed by the intended internal reviewer.",
    "Confirm archive/retention gaps must block intake until a separate approved future review resolves them.",
    "Confirm external response questions remain unapproved and placeholder-only.",
    "Confirm customer, public, support, external message system, outbound email, SMS, and WhatsApp actions are not allowed.",
    "Confirm this helper does not receive, record, approve, respond to, or remediate any audit finding."
  ];
  const firewall = [
    "No audit finding is received or recorded here.",
    "No audit follow-up record is created here.",
    "No audit response is sent here.",
    "No remediation is assigned here.",
    "No external disclosure is made here.",
    "No audit recipient is contacted here.",
    "Archive creation is blocked here.",
    "Archive record writing is blocked here.",
    "Retention policy application is blocked here.",
    "Closure decision recording is blocked here.",
    "Closure approval recording is blocked here.",
    "Maintenance completion marking is blocked here.",
    "Production evidence collection is blocked here.",
    "Smoke check runs are blocked here.",
    "Provider or runtime check execution is blocked here.",
    "Customer or support follow-up sending is blocked here.",
    "No production readiness claim is made here.",
    "Deployment approval granting is blocked here."
  ];

  return (
    <section aria-label="Phase 6D maintenance closure audit follow-up intake readiness helper" className="admin-readiness">
      <p className="eyebrow">Phase 6D-A/B admin-only maintenance closure audit follow-up intake readiness</p>
      <h3>Maintenance closure audit follow-up intake readiness helper</h3>
      <p>
        This protected helper prepares future owner/admin review of a theoretical
        audit follow-up or finding intake packet after a theoretical maintenance
        closure audit handoff exists for rental listings, event furniture
        listings, categories, media, quote, enquiry, and request surfaces. It is
        draft, readiness-only, placeholder-only, and internal. No audit finding
        is received or recorded here. No audit follow-up record is created here.
        No audit response is sent here. No remediation is assigned here.
      </p>
      <dl className="admin-readiness__grid">
        <div><dt>Maintenance closure audit follow-up intake readiness</dt><dd>{phase6dMaintenanceClosureAuditFollowUpIntakeReadinessPath}</dd></div>
        <div><dt>Audit finding intake ledger template</dt><dd>{phase6dMaintenanceClosureAuditFindingIntakeLedgerTemplatePath}</dd></div>
        <div><dt>Intended audit handoff reference</dt><dd>[NOT SUPPLIED]</dd></div>
        <div><dt>Intended archive/retention packet reference</dt><dd>[NOT SUPPLIED]</dd></div>
        <div><dt>Intended audit follow-up owner</dt><dd>[NOT ASSIGNED]</dd></div>
        <div><dt>Intended internal reviewer</dt><dd>[NOT ASSIGNED]</dd></div>
        <div><dt>Intended finding category</dt><dd>[PLACEHOLDER ONLY / NO REAL FINDING]</dd></div>
        <div><dt>Intended finding severity</dt><dd>[PLACEHOLDER ONLY / NO SEVERITY ASSIGNED]</dd></div>
        <div><dt>Missing evidence blocker status</dt><dd>[BLOCKING / NOT EVIDENCE]</dd></div>
        <div><dt>Unresolved follow-up blocker status</dt><dd>[BLOCKING / NOT REVIEWED]</dd></div>
        <div><dt>Response status</dt><dd>[NOT SENT]</dd></div>
        <div><dt>Remediation status</dt><dd>[NOT ASSIGNED]</dd></div>
      </dl>
      <h4>Audit finding intake ledger</h4>
      <ul className="admin-readiness__list">{findingIntakeLedgerFields.map((item) => <li key={item}>{item}</li>)}</ul>
      <h4>Audit follow-up intake readiness checklist</h4>
      <ul className="admin-readiness__list">{readinessChecklist.map((item) => <li key={item}>{item}</li>)}</ul>
      <h4>No-response/no-remediation firewall</h4>
      <ul className="admin-readiness__list">{firewall.map((item) => <li key={item}>{item}</li>)}</ul>
      <h4>Safe intake language</h4>
      <p>
        Safe intake language uses draft, readiness, placeholder, intended, and theoretical wording only.
        Avoid finality wording unless it is clearly negated as not allowed.
      </p>
    </section>
  );
}

function OwnerReadinessHelpersPanel() {
  return (
    <>
      <OwnerReviewWalkthroughReadinessHelper />
      <OwnerFeedbackIntakeReadinessHelper />
      <OwnerCorrectionWorkflowReadinessHelper />
      <OwnerReReviewRequestReadinessHelper />
      <OwnerDecisionIntakeReadinessHelper />
      <DeploymentApprovalRequestReadinessHelper />
      <DeploymentExecutionRunbookReadinessHelper />
      <SmokeEvidenceIntakeReadinessHelper />
      <SmokeEvidenceReviewReadinessHelper />
      <LaunchDecisionResponseReadinessHelper />
      <PostLaunchObservationReadinessHelper />
      <PostLaunchRemediationReadinessHelper />
      <RemediationVerificationReadinessHelper />
      <IncidentResolutionResponseReadinessHelper />
      <PreventiveMaintenanceReadinessHelper />
      <MaintenanceApprovalReadinessHelper />
      <MaintenanceExecutionRunbookReadinessHelper />
      <MaintenanceVerificationClosureReadinessHelper />
      <MaintenanceClosureDecisionReadinessHelper />
      <MaintenanceClosureArchiveReadinessHelper />
      <MaintenanceClosureAuditHandoffReadinessHelper />
      <MaintenanceClosureAuditFollowUpIntakeReadinessHelper />
    </>
  );
}

function AdminCatalogueContentOpsReadiness({
  dashboard,
  scope
}: {
  dashboard: AdminProductDashboardReadResult;
  scope: "listings" | "categories" | "media" | "overview";
}) {
  if (dashboard.status === "unavailable") {
    return null;
  }

  const products = dashboard.data.products;
  const categories = dashboard.data.categories;
  const images = dashboard.data.images;
  const missingCategory = products.filter((product) => !product.categoryId).length;
  const missingRentalUnit = products.filter((product) => !product.rentalUnit.trim()).length;
  const missingPublicDescription = products.filter(
    (product) => !product.shortDescription?.trim() || !product.description?.trim()
  ).length;
  const listingsNeedingMedia = products.filter(
    (product) => product.status === "published" && product.imageCount === 0
  ).length;
  const activeImagesMissingAltText = images.filter(
    (image) => image.status === "active" && !image.altText?.trim()
  ).length;
  const categoriesNeedingOwnerInput = categories.filter(
    (category) => category.isPublished && category.publishedProductCount === 0
  ).length;

  const derivedChecks = [
    `Listing title/name review: ${products.length} listing records are available for protected admin content-ops review.`,
    `Category review: ${missingCategory} listings are missing category assignment and ${categoriesNeedingOwnerInput} published categories have no published listings.`,
    `Rental unit review: ${missingRentalUnit} listings are missing rental unit wording for quote/request handoff.`,
    `Description review: ${missingPublicDescription} listings are missing short or long public-safe description copy.`,
    `Media/fallback review: ${listingsNeedingMedia} published listings need media metadata or a safe fallback expectation before public browsing.`,
    `Alt text review: ${activeImagesMissingAltText} active image metadata records are missing public-safe alt text.`,
    "Public visibility/status review: draft and archived records stay protected or hidden; published records still need readiness checks before any later launch decision.",
    "Quote/enquiry CTA continuity: listing, category, media, and event-use context remains editable request text only."
  ];

  return (
    <section
      aria-label={`Phase 5G protected admin catalogue content-ops readiness helper for ${scope}`}
      className="admin-dashboard__card admin-dashboard__card--summary"
    >
      <p className="eyebrow">Phase 5G-A/B admin-only catalogue readiness</p>
      <h3>Catalogue content-ops readiness helper</h3>
      <p>
        This protected admin-only checklist derives from existing listing,
        category, and media metadata. It supports review of public-safe preview
        expectations and missing owner facts; it does not create evidence,
        approve launch, perform provider actions, or expose internal notes to
        public routes.
      </p>
      <dl className="quote-inbox__details">
        <div>
          <dt>Readiness reference</dt>
          <dd>{phase5gCatalogueContentOpsReadinessPath}</dd>
        </div>
        <div>
          <dt>Evidence status</dt>
          <dd>[NOT EVIDENCE / NOT RECORDED]</dd>
        </div>
        <div>
          <dt>Deployment status</dt>
          <dd>[DEPLOYMENT APPROVAL: NOT GRANTED]</dd>
        </div>
      </dl>
      <h4>Derived listing/category/media checklist</h4>
      <ul className="admin-readiness__list">
        {derivedChecks.map((check) => (
          <li key={check}>{check}</li>
        ))}
      </ul>
      <h4>Content-ops boundaries</h4>
      <ul className="admin-readiness__list">
        {phase5gCatalogueContentOpsChecklist.map((check) => (
          <li key={check}>{check}</li>
        ))}
      </ul>
    </section>
  );
}

function AdminListingOperations({
  dashboard
}: {
  dashboard: AdminProductDashboardReadResult;
}) {
  if (dashboard.status === "unavailable") {
    return <AdminDashboard dashboard={dashboard} />;
  }

  return (
    <>
      <section className="admin-dashboard" aria-label="Listing operations">
        <div className="admin-dashboard__header">
          <div>
            <p className="eyebrow">Listings</p>
            <h2>Listing operations</h2>
            <p>
              Review listing metadata by status, category, rental unit, content
              readiness, and media readiness before changing records through the
              protected write boundary.
            </p>
          </div>
          <dl className="admin-dashboard__stats" aria-label="Listing summary">
            <div>
              <dt>Published</dt>
              <dd>
                {
                  dashboard.data.products.filter(
                    (product) => product.status === "published"
                  ).length
                }
              </dd>
            </div>
            <div>
              <dt>Draft</dt>
              <dd>
                {
                  dashboard.data.products.filter(
                    (product) => product.status === "draft"
                  ).length
                }
              </dd>
            </div>
            <div>
              <dt>Archived</dt>
              <dd>
                {
                  dashboard.data.products.filter(
                    (product) => product.status === "archived"
                  ).length
                }
              </dd>
            </div>
          </dl>
        </div>
        <div className="admin-dashboard__grid">
          <AdminOperatorGuidance
            adminOnly="Admin-only readiness checks, draft state, archive context, and protected write controls."
            label="Listing operations"
            nextAction="Next safe action: fix missing category, descriptions, rental unit, and media before publishing."
            publicFacing="Public-facing after publication: published listing name, category, rental unit, public description, and active media only."
            readOnly="Listing status counts and readiness summaries are read-only operator QA cues."
            writeEnabled="Write-enabled listing metadata."
          />
          <AdminCatalogueContentOpsReadiness dashboard={dashboard} scope="listings" />
        </div>
      </section>
      <ListingManagementPanel
        categories={dashboard.data.categories}
        products={dashboard.data.products}
      />
    </>
  );
}

function AdminCategoryOperations({
  dashboard
}: {
  dashboard: AdminProductDashboardReadResult;
}) {
  if (dashboard.status === "unavailable") {
    return <AdminDashboard dashboard={dashboard} />;
  }

  return (
    <>
      <section className="admin-dashboard" aria-label="Category operations">
        <div className="admin-dashboard__header">
          <div>
            <p className="eyebrow">Categories</p>
            <h2>Category operations</h2>
            <p>
              Review category descriptions, listing counts, empty states, and
              publication state before changing the public catalogue structure.
            </p>
          </div>
        </div>
        <div className="admin-dashboard__grid">
          <AdminOperatorGuidance
            adminOnly="Admin-only grouping readiness, empty published category warnings, and protected category controls."
            label="Category operations"
            nextAction="Next safe action: keep empty published categories unpublished or add published listings."
            publicFacing="Public-facing category grouping."
            readOnly="Category counts and readiness summaries are read-only operator QA cues."
            writeEnabled="Write-enabled category metadata."
          />
          <AdminCatalogueContentOpsReadiness dashboard={dashboard} scope="categories" />
        </div>
      </section>
      <CategoryManagementPanel categories={dashboard.data.categories} />
    </>
  );
}

function AdminMediaOperations({
  dashboard
}: {
  dashboard: AdminProductDashboardReadResult;
}) {
  if (dashboard.status === "unavailable") {
    return <AdminDashboard dashboard={dashboard} />;
  }

  return (
    <>
      <section className="admin-dashboard" aria-label="Media operations">
        <div className="admin-dashboard__header">
          <div>
            <p className="eyebrow">Media</p>
            <h2>Media operations</h2>
            <p>
              Review listing media readiness, primary image state, and alt text
              before media appears in public catalogue or listing galleries.
            </p>
          </div>
        </div>
        <div className="admin-dashboard__grid">
          <AdminOperatorGuidance
            adminOnly="Admin-only media readiness, upload controls, archive context, and metadata checks."
            label="Media operations"
            nextAction="Next safe action: add alt text and keep one active primary image per listing."
            publicFacing="Public-facing active media."
            readOnly="Media readiness by listing is a read-only operator QA summary."
            writeEnabled="Write-enabled image upload and metadata."
          />
          <AdminCatalogueContentOpsReadiness dashboard={dashboard} scope="media" />
        </div>
      </section>
      <ListingImageUploadPanel products={dashboard.data.products} />
      <ListingImageMetadataManagementPanel
        images={dashboard.data.images}
        products={dashboard.data.products}
      />
    </>
  );
}

function AdminQuoteDetail({
  quoteDetail
}: {
  quoteDetail?: AdminQuoteRequestDetailReadResult;
}) {
  if (!quoteDetail || quoteDetail.status === "unavailable") {
    return (
      <section className="admin-dashboard admin-dashboard--unavailable">
        <h2>Quote request detail</h2>
        <p>
          Quote request details are temporarily unavailable. Return to the
          quote request inbox and retry from the protected admin workspace.
        </p>
        <nav className="hero__actions" aria-label="Admin recovery">
          <a className="button button--secondary" href="/admin/quotes">
            Back to quote requests
          </a>
        </nav>
      </section>
    );
  }

  if (quoteDetail.status === "not_found") {
    return (
      <section className="admin-dashboard admin-dashboard--unavailable">
        <h2>Quote request detail</h2>
        <p>
          Quote request details are not visible in this workspace, or the
          enquiry may have been removed from the current admin view.
        </p>
        <nav className="hero__actions" aria-label="Admin recovery">
          <a className="button button--secondary" href="/admin/quotes">
            Back to quote requests
          </a>
        </nav>
      </section>
    );
  }

  const quoteRequest = quoteDetail.data.quoteRequest;

  return (
    <>
      <section className="admin-dashboard" aria-label="Quote request detail">
        <div className="admin-dashboard__header">
          <div>
            <p className="eyebrow">Quote request detail</p>
            <h2>Quote request detail</h2>
            <p>
              Review the selected enquiry and save admin-only follow-up status
              or internal notes.
            </p>
          </div>
        </div>
        <div className="admin-dashboard__grid">
          <AdminOperatorGuidance
            adminOnly="Admin-only internal notes, status history, and protected quote workflow recovery."
            label="Quote detail"
            nextAction="Next safe action: review details, then record an internal note or status change inside the protected workspace."
            publicFacing="Public-facing quote pages do not show this detail view, internal activity, or status history."
            readOnly="Read-only customer submission snapshot."
            writeEnabled="Write-enabled follow-up controls remain below via the protected quote workflow panel."
          />
          <section className="admin-dashboard__card">
            <h3>Contact and follow-up</h3>
            <dl className="quote-inbox__details">
              <div>
                <dt>Reference</dt>
                <dd>Reference {quoteRequest.publicReference}</dd>
              </div>
              <div>
                <dt>Current status</dt>
                <dd>{statusLabel(quoteRequest.status)}</dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>{quoteRequest.source}</dd>
              </div>
              <div>
                <dt>Submitted</dt>
                <dd>{quoteRequest.createdAt}</dd>
              </div>
              {quoteRequest.updatedAt ? (
                <div>
                  <dt>Updated</dt>
                  <dd>{quoteRequest.updatedAt}</dd>
                </div>
              ) : null}
              <div>
                <dt>Customer</dt>
                <dd>
                  Customer - {quoteRequest.customerName ?? "Unnamed customer"}
                </dd>
              </div>
              {quoteRequest.customerEmail ? (
                <div>
                  <dt>Email</dt>
                  <dd>Email - {quoteRequest.customerEmail}</dd>
                </div>
              ) : null}
              {quoteRequest.customerPhone ? (
                <div>
                  <dt>Phone</dt>
                  <dd>Phone - {quoteRequest.customerPhone}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section className="admin-dashboard__card">
            <h3>Event and setup details</h3>
            <dl className="quote-inbox__details">
              {quoteRequest.eventDate ? (
                <div>
                  <dt>Event date</dt>
                  <dd>{quoteRequest.eventDate}</dd>
                </div>
              ) : null}
              {quoteRequest.venue ? (
                <div>
                  <dt>Venue</dt>
                  <dd>Venue - {quoteRequest.venue}</dd>
                </div>
              ) : null}
            </dl>
            {quoteRequest.customerMessage ? (
              <p>{quoteRequest.customerMessage}</p>
            ) : (
              <p>No customer message was submitted.</p>
            )}
          </section>

          <section className="admin-dashboard__card">
            <h3>Requested listings and items</h3>
            {quoteRequest.items.length === 0 ? (
              <p>No requested listing or item snapshots were captured.</p>
            ) : (
              <ul className="admin-dashboard__list">
                {quoteRequest.items.map((item) => (
                  <li key={item.id}>
                    <strong>
                      Snapshot: {item.quantity} x {item.productNameSnapshot}
                    </strong>
                    {item.notes ? <small>{item.notes}</small> : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="admin-dashboard__card">
            <h3>Admin-only status and notes</h3>
            <p>
              Internal notes and status history stay inside the protected admin
              workspace and are not shown on public quote pages.
            </p>
            {quoteRequest.activity.length === 0 ? (
              <p>No internal activity has been recorded yet.</p>
            ) : (
              <ul className="admin-dashboard__list">
                {quoteRequest.activity.map((activity) => (
                  <li key={activity.id}>
                    <strong>
                      Activity: {quoteDetailActivityText(activity)}
                    </strong>
                    <small>{activity.createdAt}</small>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </section>
      <QuoteRequestInboxPanel
        inbox={{
          status: "loaded",
          data: {
            quoteRequests: [quoteDetail.data.quoteRequest]
          }
        }}
      />
    </>
  );
}

function AdminOperationsView({
  state,
  view
}: {
  state: Extract<ProtectedAdminShellState, { status: "authorised_admin" }>;
  view: AdminShellView;
}) {
  if (view.kind === "home") {
    return (
      <AdminOperationsHome
        dashboard={state.dashboard}
        quoteInbox={state.quoteInbox}
      />
    );
  }

  if (view.kind === "listings") {
    return <AdminListingOperations dashboard={state.dashboard} />;
  }

  if (view.kind === "categories") {
    return <AdminCategoryOperations dashboard={state.dashboard} />;
  }

  if (view.kind === "media") {
    return <AdminMediaOperations dashboard={state.dashboard} />;
  }

  if (view.kind === "quotes") {
    return <QuoteRequestInboxPanel inbox={state.quoteInbox} />;
  }

  if (view.kind === "content-readiness") {
    return <ContentReadinessWorkspace />;
  }

  if (view.kind === "public-parity") {
    return <PublicParityReviewWorkspace />;
  }

  if (view.kind === "release-control") {
    return <ReleaseControlWorkspace />;
  }

  if (view.kind === "quote-detail") {
    return <AdminQuoteDetail quoteDetail={state.quoteDetail} />;
  }

  return (
    <>
      <AdminDashboard dashboard={state.dashboard} />
      <OwnerReadinessHelpersPanel />
      <QuoteRequestInboxPanel inbox={state.quoteInbox} />
    </>
  );
}

function AdminStatusMessage({
  state,
  view
}: {
  state: ProtectedAdminShellState;
  view: AdminShellView;
}) {
  if (state.status === "unauthenticated") {
    return (
      <>
        <h1>Admin sign in required</h1>
        <p>Sign in to continue.</p>
        <a className="button" href="/admin/login">
          Sign in
        </a>
      </>
    );
  }

  if (state.status === "authenticated_not_authorised") {
    return (
      <>
        <h1>Admin access unavailable</h1>
        <p>Your account is authenticated but not authorised for this workspace.</p>
        <AdminRecoveryLinks includeSignIn />
      </>
    );
  }

  if (state.status === "unavailable") {
    return (
      <>
        <h1>Admin access unavailable</h1>
        <p>Admin access is temporarily unavailable.</p>
        <AdminRecoveryLinks includeSignIn />
      </>
    );
  }

  return (
    <>
      <h1>Admin workspace</h1>
      <p>Access is authorised for this admin workspace.</p>
      <form action="/admin/logout" method="post">
        <button className="button" type="submit">
          Sign out
        </button>
      </form>
      <AdminOperationsNavigation />
      <AdminOperationsView state={state} view={view} />
    </>
  );
}

export function AdminShellContent({
  state,
  view = {
    kind: "overview"
  }
}: {
  state: ProtectedAdminShellState;
  view?: AdminShellView;
}) {
  return (
    <section className="section admin-shell" aria-live="polite">
      <div className="admin-shell__panel">
        <p className="eyebrow">Secure admin</p>
        <AdminStatusMessage state={state} view={view} />
      </div>
    </section>
  );
}
