import "server-only";

import { getSupabaseServerRuntimeConfig } from "../server-runtime-config";

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

export function getSupabaseServerConfig(
  env: NodeJS.ProcessEnv = process.env
): SupabaseServerConfig {
  return getSupabaseServerRuntimeConfig(env);
}

export function isSupabaseServerConfigured(
  env: NodeJS.ProcessEnv = process.env
) {
  return getSupabaseServerConfig(env).configured;
}
