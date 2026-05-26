import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  getSupabaseServerConfig,
  type SupabaseServerEnvName
} from "./env";

export type ServerSupabaseClientResult =
  | {
      configured: true;
      client: SupabaseClient;
      missingEnv: [];
    }
  | {
      configured: false;
      client: null;
      missingEnv: SupabaseServerEnvName[];
    };

export function createServerSupabaseClient(): ServerSupabaseClientResult {
  const config = getSupabaseServerConfig();

  if (!config.configured) {
    return {
      configured: false,
      client: null,
      missingEnv: config.missingEnv
    };
  }

  return {
    configured: true,
    client: createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false
      }
    }),
    missingEnv: []
  };
}
