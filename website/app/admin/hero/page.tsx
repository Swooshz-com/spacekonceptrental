import { resolveAdminHomepageHeroRead } from "../../../lib/hero/admin-homepage-hero-read";
import {
  AdminShellContent,
  resolveProtectedAdminShellState
} from "../protected-admin-shell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminHeroPage() {
  const state = await resolveProtectedAdminShellState();
  const hero =
    state.status === "authorised_admin"
      ? await resolveAdminHomepageHeroRead()
      : undefined;

  return (
    <AdminShellContent
      state={state}
      view={{ kind: "hero", hero }}
    />
  );
}
