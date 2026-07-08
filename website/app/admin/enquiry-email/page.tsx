import { redirect } from "next/navigation";

import {
  AdminShellContent,
  resolveProtectedAdminShellState
} from "../protected-admin-shell";
import { resolveAdminQuoteEmailDeliveryLogRead } from "../../../lib/quote/admin-read/admin-quote-email-delivery-log";
import { resolveQuoteEnquiryEmailConfigStatus } from "../../../lib/quote/email-handoff";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminEnquiryEmailPage() {
  const state = await resolveProtectedAdminShellState();

  if (state.status === "unauthenticated") {
    redirect("/admin/login?state=unauthenticated");
  }

  const config = resolveQuoteEnquiryEmailConfigStatus();
  const deliveryLog =
    state.status === "authorised_admin"
      ? await resolveAdminQuoteEmailDeliveryLogRead()
      : undefined;

  return (
    <AdminShellContent
      state={state}
      view={{ kind: "enquiry-email", config, deliveryLog }}
    />
  );
}
