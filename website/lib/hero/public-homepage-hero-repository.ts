import "server-only";

import { getCatalogueWorkspaceId } from "../server-runtime-config";
import { createServerSupabaseClient } from "../supabase/server";
import type { SupabaseServerEnvName } from "../supabase/env";
import {
  DEFAULT_HOMEPAGE_HERO_CONTENT,
  mapHomepageHeroRow,
  type HomepageHeroContent,
  type HomepageHeroRow
} from "./homepage-hero-content";

type QueryResult = {
  data: unknown;
  error: unknown;
};

type PublicHomepageHeroSupabaseClient = {
  rpc(
    functionName: "get_public_homepage_hero",
    args: {
      expected_workspace_id: string;
    }
  ): PromiseLike<QueryResult>;
};

type PublicHomepageHeroSupabaseResult =
  | {
      configured: true;
      client: PublicHomepageHeroSupabaseClient;
      missingEnv: [];
    }
  | {
      configured: false;
      client: null;
      missingEnv: readonly SupabaseServerEnvName[];
    };

type PublicHomepageHeroOptions = {
  supabase?: PublicHomepageHeroSupabaseResult;
  env?: {
    CATALOGUE_WORKSPACE_ID?: string | null;
  };
};

function getSupabase(options: PublicHomepageHeroOptions) {
  return (
    options.supabase ??
    (createServerSupabaseClient() as PublicHomepageHeroSupabaseResult)
  );
}

function isRecord(value: unknown): value is HomepageHeroRow {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function firstHeroRow(data: unknown) {
  const row = Array.isArray(data) ? data[0] : data;

  return isRecord(row) ? row : null;
}

export { DEFAULT_HOMEPAGE_HERO_CONTENT };

export async function getPublicHomepageHeroContent(
  options: PublicHomepageHeroOptions = {}
): Promise<HomepageHeroContent> {
  const supabase = getSupabase(options);

  if (!supabase.configured) {
    return DEFAULT_HOMEPAGE_HERO_CONTENT;
  }

  const workspaceId = getCatalogueWorkspaceId(options.env ?? process.env);

  if (!workspaceId) {
    return DEFAULT_HOMEPAGE_HERO_CONTENT;
  }

  try {
    const result = await supabase.client.rpc("get_public_homepage_hero", {
      expected_workspace_id: workspaceId
    });

    if (result.error) {
      return DEFAULT_HOMEPAGE_HERO_CONTENT;
    }

    return (
      mapHomepageHeroRow(firstHeroRow(result.data)) ??
      DEFAULT_HOMEPAGE_HERO_CONTENT
    );
  } catch {
    return DEFAULT_HOMEPAGE_HERO_CONTENT;
  }
}
