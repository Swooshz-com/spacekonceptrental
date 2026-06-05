import {
  AdminShellContent,
  resolveProtectedAdminShellState
} from "../../protected-admin-shell";

type AdminQuoteRequestDetailPageProps = {
  params: Promise<{
    quoteRequestId: string;
  }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminQuoteRequestDetailPage({
  params
}: AdminQuoteRequestDetailPageProps) {
  const [{ quoteRequestId }, state] = await Promise.all([
    params,
    resolveProtectedAdminShellState()
  ]);

  return (
    <AdminShellContent
      state={state}
      view={{ kind: "quote-detail", quoteRequestId }}
    />
  );
}
