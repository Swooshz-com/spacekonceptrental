import "server-only";

import { createSessionBoundSupabaseAdminReadClient } from "../admin/authorization/supabase-admin-auth-identity-adapter";
import type { TrustedProductAdminContext } from "../products/persistence";
import type { HomepageHeroImageInput } from "./homepage-hero-content";

type MutationResult = {
  data: unknown;
  error: unknown;
};

export type AdminHomepageHeroPersistenceRecord = {
  workspaceId: string;
  updatedAt: string;
};

export type AdminHomepageHeroPersistenceResult =
  | {
      ok: true;
      record: AdminHomepageHeroPersistenceRecord;
    }
  | {
      ok: false;
      code:
        | "HERO_ADMIN_CONTEXT_INVALID"
        | "HERO_PERSISTENCE_UNAVAILABLE"
        | "HERO_PERSISTENCE_FAILED";
    };

export type AdminHomepageHeroWriteInput = {
  admin: TrustedProductAdminContext;
  image: HomepageHeroImageInput;
};

export interface AdminHomepageHeroPersistence {
  upsertHomepageHeroImage(
    input: AdminHomepageHeroWriteInput
  ): Promise<AdminHomepageHeroPersistenceResult>;
}

type AdminHomepageHeroWriteClient = {
  rpc(
    fn: "execute_admin_homepage_hero_image_write",
    args: {
      p_workspace_id: string;
      p_payload: Record<string, unknown>;
    }
  ): {
    single(): Promise<MutationResult>;
  };
};

type AdminHomepageHeroWriteClientResult =
  | {
      configured: true;
      client: AdminHomepageHeroWriteClient;
      missingEnv: [];
    }
  | {
      configured: false;
      client: null;
      reason: "authenticated_admin_write_client_required";
    };

type SupabaseAdminHomepageHeroPersistenceOptions = {
  supabase?: AdminHomepageHeroWriteClientResult;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string | undefined) {
  return typeof value === "string" && uuidPattern.test(value.trim());
}

function validAdminContext(admin: TrustedProductAdminContext) {
  return (
    admin.resolution === "server-auth-membership" &&
    isUuid(admin.workspaceId) &&
    isUuid(admin.adminUserId) &&
    (admin.membershipId === undefined || isUuid(admin.membershipId))
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function createDefaultSupabase(): Promise<AdminHomepageHeroWriteClientResult> {
  const supabase = await createSessionBoundSupabaseAdminReadClient();

  if (!supabase.configured) {
    return {
      configured: false,
      client: null,
      reason: "authenticated_admin_write_client_required"
    };
  }

  return {
    configured: true,
    client: supabase.client as unknown as AdminHomepageHeroWriteClient,
    missingEnv: []
  };
}

function payloadFromImage(image: HomepageHeroImageInput) {
  return {
    ...(image.imageUrl ? { image_url: image.imageUrl } : {}),
    image_alt: image.imageAlt,
    is_enabled: image.isEnabled
  };
}

function resultRecord(result: MutationResult) {
  if (result.error || !isRecord(result.data)) {
    return null;
  }

  const workspaceId = result.data.workspace_id;
  const updatedAt = result.data.updated_at;

  return typeof workspaceId === "string" &&
    isUuid(workspaceId) &&
    typeof updatedAt === "string" &&
    updatedAt.trim()
    ? {
        workspaceId: workspaceId.trim(),
        updatedAt: updatedAt.trim()
      }
    : null;
}

export class SupabaseAdminHomepageHeroPersistence
  implements AdminHomepageHeroPersistence
{
  constructor(
    private readonly options: SupabaseAdminHomepageHeroPersistenceOptions = {}
  ) {}

  private async getSupabase() {
    return this.options.supabase ?? createDefaultSupabase();
  }

  async upsertHomepageHeroImage(
    input: AdminHomepageHeroWriteInput
  ): Promise<AdminHomepageHeroPersistenceResult> {
    if (!validAdminContext(input.admin)) {
      return {
        ok: false,
        code: "HERO_ADMIN_CONTEXT_INVALID"
      };
    }

    const supabase = await this.getSupabase();

    if (!supabase.configured) {
      return {
        ok: false,
        code: "HERO_PERSISTENCE_UNAVAILABLE"
      };
    }

    try {
      const result = await supabase.client
        .rpc("execute_admin_homepage_hero_image_write", {
          p_workspace_id: input.admin.workspaceId,
          p_payload: payloadFromImage(input.image)
        })
        .single();
      const record = resultRecord(result);

      return record
        ? {
            ok: true,
            record
          }
        : {
            ok: false,
            code: "HERO_PERSISTENCE_FAILED"
          };
    } catch {
      return {
        ok: false,
        code: "HERO_PERSISTENCE_FAILED"
      };
    }
  }
}

export const supabaseAdminHomepageHeroPersistence =
  new SupabaseAdminHomepageHeroPersistence();
