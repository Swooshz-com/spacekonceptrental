import { redirect } from "next/navigation";

import { AdminShellContent, resolveProtectedAdminShellState } from "../protected-admin-shell";
import { resolveAdminAppOperationEventOperationsRead } from "../../../lib/application-events/app-operation-event-operations-read";
import { getAppOperationEventSinkStatus } from "../../../lib/application-events/app-operation-event-sink";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminOperationsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const state = await resolveProtectedAdminShellState();

  if (state.status === "unauthenticated") {
    redirect("/admin/login?state=unauthenticated");
  }

  const params = searchParams ? await searchParams : {};

  const read =
    state.status === "authorised_admin"
      ? await resolveAdminAppOperationEventOperationsRead({
          searchParams: params
        })
      : undefined;
  const sinkState =
    state.status === "authorised_admin"
      ? getAppOperationEventSinkStatus().state
      : undefined;

  return (
    <AdminShellContent
      state={state}
      view={{ kind: "operations", read, sinkState }}
    />
  );
}
