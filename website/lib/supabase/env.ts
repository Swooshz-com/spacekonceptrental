import "server-only";

export const supabaseServerEnvNames = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY"
] as const;

export type SupabaseServerEnvName = (typeof supabaseServerEnvNames)[number];

export type SupabaseServerConfig =
  | {
      configured: true;
      supabaseUrl: string;
      supabaseAnonKey: string;
      missingEnv: [];
    }
  | {
      configured: false;
      missingEnv: SupabaseServerEnvName[];
    };

function readOptionalEnv(
  env: NodeJS.ProcessEnv,
  name: SupabaseServerEnvName
) {
  const value = env[name]?.trim();

  return value || undefined;
}

export function getSupabaseServerConfig(
  env: NodeJS.ProcessEnv = process.env
): SupabaseServerConfig {
  const supabaseUrl = readOptionalEnv(env, "SUPABASE_URL");
  const supabaseAnonKey = readOptionalEnv(env, "SUPABASE_ANON_KEY");
  const missingEnv: SupabaseServerEnvName[] = [];

  if (!supabaseUrl) {
    missingEnv.push("SUPABASE_URL");
  }

  if (!supabaseAnonKey) {
    missingEnv.push("SUPABASE_ANON_KEY");
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      configured: false,
      missingEnv
    };
  }

  return {
    configured: true,
    supabaseUrl,
    supabaseAnonKey,
    missingEnv: []
  };
}

export function isSupabaseServerConfigured(
  env: NodeJS.ProcessEnv = process.env
) {
  return getSupabaseServerConfig(env).configured;
}
