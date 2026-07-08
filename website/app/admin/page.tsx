import { redirect } from "next/navigation";

import { AdminShellContent, resolveProtectedAdminShellState } from "./protected-admin-shell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPage() {
  const state = await resolveProtectedAdminShellState();

  if (state.status === "unauthenticated") {
    redirect("/admin/login?state=unauthenticated");
  }

  return <AdminShellContent state={state} view={{ kind: "home" }} />;
}
