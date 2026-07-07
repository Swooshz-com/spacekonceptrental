import "server-only";

import { getCatalogueWorkspaceId } from "../server-runtime-config";
import { createServerSupabaseClient } from "../supabase/server";
import type { SupabaseServerEnvName } from "../supabase/env";
import {
  defaultPublicPageMediaForSlot,
  mapPublicPageMediaRow,
  type PublicPageMediaContent,
  type PublicPageMediaRow,
  type PublicPageMediaSlot
} from "./public-page-media-content";

type QueryResult = {
  data: unknown;
  error: unknown;
};

type PublicPageMediaSupabaseClient = {
  rpc(
    functionName: "get_public_page_media",
    args: {
      expected_workspace_id: string;
      media_slot: string;
    }
  ): PromiseLike<QueryResult>;
};

type PublicPageMediaSupabaseResult =
  | {
      configured: true;
      client: PublicPageMediaSupabaseClient;
      missingEnv: [];
    }
  | {
      configured: false;
      client: null;
      missingEnv: readonly SupabaseServerEnvName[];
    };

type PublicPageMediaOptions = {
  supabase?: PublicPageMediaSupabaseResult;
  env?: {
    CATALOGUE_WORKSPACE_ID?: string | null;
  };
};

function getSupabase(options: PublicPageMediaOptions) {
  return (
    options.supabase ??
    (createServerSupabaseClient() as PublicPageMediaSupabaseResult)
  );
}

function isRecord(value: unknown): value is PublicPageMediaRow {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function firstMediaRow(data: unknown) {
  const row = Array.isArray(data) ? data[0] : data;

  return isRecord(row) ? row : null;
}

export async function getPublicPageMedia(
  slot: PublicPageMediaSlot,
  options: PublicPageMediaOptions = {}
): Promise<PublicPageMediaContent> {
  const fallback = defaultPublicPageMediaForSlot(slot);
  const supabase = getSupabase(options);

  if (!supabase.configured) {
    return fallback;
  }

  const workspaceId = getCatalogueWorkspaceId(options.env ?? process.env);

  if (!workspaceId) {
    return fallback;
  }

  try {
    const result = await supabase.client.rpc("get_public_page_media", {
      expected_workspace_id: workspaceId,
      media_slot: slot
    });

    if (result.error) {
      return fallback;
    }

    return mapPublicPageMediaRow(firstMediaRow(result.data)) ?? fallback;
  } catch {
    return fallback;
  }
}
