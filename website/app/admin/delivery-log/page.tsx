import { redirect } from "next/navigation";

import {
  AdminShellContent,
  resolveProtectedAdminShellState
} from "../protected-admin-shell";
import { resolveAdminQuoteEmailDeliveryLogRead } from "../../../lib/quote/admin-read/admin-quote-email-delivery-log";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminDeliveryLogPage() {
  const state = await resolveProtectedAdminShellState();

  if (state.status === "unauthenticated") {
    redirect("/admin/login?state=unauthenticated");
  }

  const deliveryLog =
    state.status === "authorised_admin"
      ? await resolveAdminQuoteEmailDeliveryLogRead()
      : undefined;

  return (
    <AdminShellContent
      state={state}
      view={{ kind: "delivery-log", deliveryLog }}
    />
  );
}
