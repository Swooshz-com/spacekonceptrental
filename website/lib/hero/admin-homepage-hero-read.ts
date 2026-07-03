import "server-only";

import { createSessionBoundSupabaseAdminReadClient } from "../admin/authorization/supabase-admin-auth-identity-adapter";
import { getAdminTrustedWorkspaceId } from "../server-runtime-config";
import {
  mapAdminHomepageHeroRow,
  type AdminHomepageHeroContent,
  type HomepageHeroRow
} from "./homepage-hero-content";

type QueryResult = {
  data: unknown;
  error: unknown;
};

type AdminHomepageHeroReadClient = {
  from(table: "homepage_hero_content"): {
    select(columns: string): {
      eq(column: string, value: string): {
        maybeSingle(): Promise<QueryResult>;
      };
    };
  };
};

export type AdminHomepageHeroReadResult =
  | {
      status: "loaded";
      hero: AdminHomepageHeroContent | null;
    }
  | {
      status: "unavailable";
    };

type AdminHomepageHeroReadClientResult =
  | {
      configured: true;
      client: AdminHomepageHeroReadClient;
      missingEnv: [];
    }
  | {
      configured: false;
      client: null;
      reason: "authenticated_admin_read_client_required";
    };

type AdminHomepageHeroReadOptions = {
  supabase?: AdminHomepageHeroReadClientResult;
  env?: {
    ADMIN_TRUSTED_WORKSPACE_ID?: string | null;
  };
};

async function getSupabase(
  options: AdminHomepageHeroReadOptions
): Promise<AdminHomepageHeroReadClientResult> {
  if (options.supabase) {
    return options.supabase;
  }

  const supabase = await createSessionBoundSupabaseAdminReadClient();

  return supabase.configured
    ? {
        configured: true,
        client: supabase.client as unknown as AdminHomepageHeroReadClient,
        missingEnv: []
      }
    : {
        configured: false,
        client: null,
        reason: "authenticated_admin_read_client_required"
      };
}

function isRecord(value: unknown): value is HomepageHeroRow {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export async function resolveAdminHomepageHeroRead(
  options: AdminHomepageHeroReadOptions = {}
): Promise<AdminHomepageHeroReadResult> {
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
      .from("homepage_hero_content")
      .select(
        "eyebrow, headline, body, primary_cta_label, primary_cta_href, secondary_cta_label, secondary_cta_href, image_url, image_alt, is_enabled, updated_at, updated_by"
      )
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (result.error) {
      return { status: "unavailable" };
    }

    if (result.data === null) {
      return {
        status: "loaded",
        hero: null
      };
    }

    if (!isRecord(result.data)) {
      return { status: "unavailable" };
    }

    return {
      status: "loaded",
      hero: mapAdminHomepageHeroRow({
        ...result.data,
        is_enabled: result.data.is_enabled === true
      })
    };
  } catch {
    return { status: "unavailable" };
  }
}
