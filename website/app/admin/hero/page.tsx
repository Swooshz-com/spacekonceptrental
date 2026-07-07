import { resolveAdminHomepageHeroRead } from "../../../lib/hero/admin-homepage-hero-read";
import { resolveAdminPublicPageMediaRead } from "../../../lib/page-media/admin-public-page-media-read";
import {
  AdminShellContent,
  resolveProtectedAdminShellState
} from "../protected-admin-shell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminHeroPage() {
  const state = await resolveProtectedAdminShellState();
  const [hero, pageMedia] =
    state.status === "authorised_admin"
      ? await Promise.all([
          resolveAdminHomepageHeroRead(),
          resolveAdminPublicPageMediaRead()
        ])
      : [undefined, undefined];

  return (
    <AdminShellContent
      state={state}
      view={{ kind: "hero", hero, pageMedia }}
    />
  );
}
