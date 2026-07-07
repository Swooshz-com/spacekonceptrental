import "server-only";

import { createSessionBoundSupabaseAdminReadClient } from "../admin/authorization/supabase-admin-auth-identity-adapter";
import { getAdminTrustedWorkspaceId } from "../server-runtime-config";
import {
  ABOUT_STORY_MEDIA_SLOT,
  isPublicPageMediaSlot,
  mapAdminPublicPageMediaRow,
  type AdminPublicPageMediaContent,
  type PublicPageMediaRow,
  type PublicPageMediaSlot
} from "./public-page-media-content";

type QueryResult = {
  data: unknown;
  error: unknown;
};

type AdminPublicPageMediaReadClient = {
  from(table: "public_page_media"): {
    select(columns: string): {
      eq(column: "workspace_id", value: string): {
        eq(column: "slot", value: string): {
          maybeSingle(): Promise<QueryResult>;
        };
      };
    };
  };
};

export type AdminPublicPageMediaReadResult =
  | {
      status: "loaded";
      media: AdminPublicPageMediaContent | null;
    }
  | {
      status: "unavailable";
    };

type AdminPublicPageMediaReadClientResult =
  | {
      configured: true;
      client: AdminPublicPageMediaReadClient;
      missingEnv: [];
    }
  | {
      configured: false;
      client: null;
      reason: "authenticated_admin_read_client_required";
    };

type AdminPublicPageMediaReadOptions = {
  slot?: PublicPageMediaSlot;
  supabase?: AdminPublicPageMediaReadClientResult;
  env?: {
    ADMIN_TRUSTED_WORKSPACE_ID?: string | null;
  };
};

async function getSupabase(
  options: AdminPublicPageMediaReadOptions
): Promise<AdminPublicPageMediaReadClientResult> {
  if (options.supabase) {
    return options.supabase;
  }

  const supabase = await createSessionBoundSupabaseAdminReadClient();

  return supabase.configured
    ? {
        configured: true,
        client: supabase.client as unknown as AdminPublicPageMediaReadClient,
        missingEnv: []
      }
    : {
        configured: false,
        client: null,
        reason: "authenticated_admin_read_client_required"
      };
}

function isRecord(value: unknown): value is PublicPageMediaRow {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export async function resolveAdminPublicPageMediaRead(
  options: AdminPublicPageMediaReadOptions = {}
): Promise<AdminPublicPageMediaReadResult> {
  const slot = options.slot ?? ABOUT_STORY_MEDIA_SLOT;

  if (!isPublicPageMediaSlot(slot)) {
    return { status: "unavailable" };
  }

  const workspaceId = getAdminTrustedWorkspaceId(options.env ?? process.env);

  if (!workspaceId) {
    return { status: "unavailable" };
  }

  const supabase = await getSupabase(options);

  if (!supabase.configured) {
    return { status: "unavailable" };
  }

  try {
    const result = await supabase.client
      .from("public_page_media")
      .select("slot, image_url, image_alt, is_enabled, updated_at, updated_by")
      .eq("workspace_id", workspaceId)
      .eq("slot", slot)
      .maybeSingle();

    if (result.error) {
      return { status: "unavailable" };
    }

    if (result.data === null) {
      return {
        status: "loaded",
        media: null
      };
    }

    if (!isRecord(result.data)) {
      return { status: "unavailable" };
    }

    return {
      status: "loaded",
      media: mapAdminPublicPageMediaRow(result.data)
    };
  } catch {
    return { status: "unavailable" };
  }
}
