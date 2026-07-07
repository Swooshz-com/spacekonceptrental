import "server-only";

import { createSessionBoundSupabaseAdminReadClient } from "../admin/authorization/supabase-admin-auth-identity-adapter";
import type { TrustedProductAdminContext } from "../products/persistence";
import type { PublicPageMediaInput } from "./public-page-media-content";

type MutationResult = {
  data: unknown;
  error: unknown;
};

export type AdminPublicPageMediaPersistenceRecord = {
  workspaceId: string;
  slot: string;
  updatedAt: string;
};

export type AdminPublicPageMediaPersistenceResult =
  | {
      ok: true;
      record: AdminPublicPageMediaPersistenceRecord;
    }
  | {
      ok: false;
      code:
        | "PUBLIC_PAGE_MEDIA_ADMIN_CONTEXT_INVALID"
        | "PUBLIC_PAGE_MEDIA_PERSISTENCE_UNAVAILABLE"
        | "PUBLIC_PAGE_MEDIA_PERSISTENCE_FAILED";
    };

export type AdminPublicPageMediaWriteInput = {
  admin: TrustedProductAdminContext;
  content: PublicPageMediaInput;
};

export interface AdminPublicPageMediaPersistence {
  upsertPublicPageMedia(
    input: AdminPublicPageMediaWriteInput
  ): Promise<AdminPublicPageMediaPersistenceResult>;
}

type AdminPublicPageMediaWriteClient = {
  rpc(
    fn: "execute_admin_public_page_media_write",
    args: {
      p_workspace_id: string;
      p_slot: string;
      p_payload: Record<string, unknown>;
    }
  ): {
    single(): Promise<MutationResult>;
  };
};

type AdminPublicPageMediaWriteClientResult =
  | {
      configured: true;
      client: AdminPublicPageMediaWriteClient;
      missingEnv: [];
    }
  | {
      configured: false;
      client: null;
      reason: "authenticated_admin_write_client_required";
    };

type SupabaseAdminPublicPageMediaPersistenceOptions = {
  supabase?: AdminPublicPageMediaWriteClientResult;
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

async function createDefaultSupabase(): Promise<AdminPublicPageMediaWriteClientResult> {
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
    client: supabase.client as unknown as AdminPublicPageMediaWriteClient,
    missingEnv: []
  };
}

function payloadFromContent(content: PublicPageMediaInput) {
  return {
    image_url: content.imageUrl,
    image_alt: content.imageAlt,
    is_enabled: content.isEnabled
  };
}

function resultRecord(result: MutationResult) {
  if (result.error || !isRecord(result.data)) {
    return null;
  }

  const workspaceId = result.data.workspace_id;
  const slot = result.data.slot;
  const updatedAt = result.data.updated_at;

  return typeof workspaceId === "string" &&
    isUuid(workspaceId) &&
    typeof slot === "string" &&
    slot.trim() &&
    typeof updatedAt === "string" &&
    updatedAt.trim()
    ? {
        workspaceId: workspaceId.trim(),
        slot: slot.trim(),
        updatedAt: updatedAt.trim()
      }
    : null;
}

export class SupabaseAdminPublicPageMediaPersistence
  implements AdminPublicPageMediaPersistence
{
  constructor(
    private readonly options: SupabaseAdminPublicPageMediaPersistenceOptions = {}
  ) {}

  private async getSupabase() {
    return this.options.supabase ?? createDefaultSupabase();
  }

  async upsertPublicPageMedia(
    input: AdminPublicPageMediaWriteInput
  ): Promise<AdminPublicPageMediaPersistenceResult> {
    if (!validAdminContext(input.admin)) {
      return {
        ok: false,
        code: "PUBLIC_PAGE_MEDIA_ADMIN_CONTEXT_INVALID"
      };
    }

    const supabase = await this.getSupabase();

    if (!supabase.configured) {
      return {
        ok: false,
        code: "PUBLIC_PAGE_MEDIA_PERSISTENCE_UNAVAILABLE"
      };
    }

    try {
      const result = await supabase.client
        .rpc("execute_admin_public_page_media_write", {
          p_workspace_id: input.admin.workspaceId,
          p_slot: input.content.slot,
          p_payload: payloadFromContent(input.content)
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
            code: "PUBLIC_PAGE_MEDIA_PERSISTENCE_FAILED"
          };
    } catch {
      return {
        ok: false,
        code: "PUBLIC_PAGE_MEDIA_PERSISTENCE_FAILED"
      };
    }
  }
}

export const supabaseAdminPublicPageMediaPersistence =
  new SupabaseAdminPublicPageMediaPersistence();
