import "server-only";

export type ServerAdminMutationCapabilityEnv = {
  ADMIN_MUTATIONS_ENABLED?: string | null;
};

export type ServerAdminMutationCapabilityResult =
  | { enabled: true }
  | {
      enabled: false;
      reason: "admin_mutations_disabled";
      statusCode: 503;
    };

export function resolveServerAdminMutationCapability(
  env: ServerAdminMutationCapabilityEnv =
    process.env as ServerAdminMutationCapabilityEnv
): ServerAdminMutationCapabilityResult {
  if (env.ADMIN_MUTATIONS_ENABLED?.trim() === "true") {
    return { enabled: true };
  }

  return {
    enabled: false,
    reason: "admin_mutations_disabled",
    statusCode: 503
  };
}
