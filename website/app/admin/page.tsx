import { AdminShellContent, resolveProtectedAdminShellState } from "./protected-admin-shell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPage() {
  const state = await resolveProtectedAdminShellState();

  return <AdminShellContent state={state} />;
}
