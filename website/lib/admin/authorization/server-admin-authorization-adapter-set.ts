import "server-only";

import type { AdminAuthorizationAdapterSet } from "./admin-authorization-resolver";
import type { ServerAdminWorkspaceResolverDependencies } from "./server-admin-workspace-resolver";
import type {
  SupabaseAdminAuthIdentityDependencies,
  SupabaseAdminReadClientFactoryDependencies
} from "./supabase-admin-auth-identity-adapter";
import { createServerAdminWorkspaceResolver } from "./server-admin-workspace-resolver";
import {
  createSessionBoundSupabaseAdminReadClient,
  createSupabaseAdminAuthIdentityAdapter
} from "./supabase-admin-auth-identity-adapter";
import {
  createSupabaseAdminMembershipAdapter,
  createSupabaseAdminProfileAdapter
} from "./supabase-admin-profile-membership-adapters";

export type ServerAdminAuthorizationAdapterSetUnavailableReason =
  "admin_authorization_adapter_set_unavailable";

export type ServerAdminAuthorizationAdapterSetResult =
  | {
      configured: true;
      adapters: AdminAuthorizationAdapterSet;
    }
  | {
      configured: false;
      adapters: null;
      reason: ServerAdminAuthorizationAdapterSetUnavailableReason;
    };

export type ServerAdminAuthorizationAdapterSetDependencies = {
  auth?: SupabaseAdminAuthIdentityDependencies;
  readClient?: SupabaseAdminReadClientFactoryDependencies;
  workspace?: ServerAdminWorkspaceResolverDependencies;
};

function unavailable(): ServerAdminAuthorizationAdapterSetResult {
  return {
    configured: false,
    adapters: null,
    reason: "admin_authorization_adapter_set_unavailable"
  };
}

export async function createServerAdminAuthorizationAdapterSet(
  dependencies: ServerAdminAuthorizationAdapterSetDependencies = {}
): Promise<ServerAdminAuthorizationAdapterSetResult> {
  try {
    const supabase = await createSessionBoundSupabaseAdminReadClient(
      dependencies.readClient
    );

    if (!supabase.configured) {
      return unavailable();
    }

    const workspace = createServerAdminWorkspaceResolver(
      dependencies.workspace
    );
    const workspaceResolution = await workspace.resolveWorkspaceForRequest({});

    if (!workspaceResolution.serverResolvedWorkspaceId) {
      return unavailable();
    }

    return {
      configured: true,
      adapters: {
        auth: createSupabaseAdminAuthIdentityAdapter(dependencies.auth),
        profile: createSupabaseAdminProfileAdapter({
          supabase
        }),
        membership: createSupabaseAdminMembershipAdapter({
          supabase
        }),
        workspace
      }
    };
  } catch {
    return unavailable();
  }
}
