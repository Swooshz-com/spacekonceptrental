import {
  AdminShellContent,
  resolveProtectedAdminShellState
} from "../protected-admin-shell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminDeliveryLogPage() {
  const state = await resolveProtectedAdminShellState();

  return <AdminShellContent state={state} view={{ kind: "delivery-log" }} />;
}
