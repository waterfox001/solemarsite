import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./env";

/**
 * Cliente Supabase criado exclusivamente a partir de variáveis de ambiente.
 * Se as variáveis não existirem, o app roda em modo demonstração local.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;

export const requireSupabase = (): SupabaseClient => {
  if (!supabase) throw new Error("Supabase não configurado. Preencha o arquivo .env.");
  return supabase;
};
