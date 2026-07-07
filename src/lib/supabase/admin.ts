import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase con service-role. SOLO usar en el server (route handlers,
 * server components, cron). Nunca importar desde componentes cliente.
 *
 * Como la app es de un solo usuario sin login, todas las escrituras/lecturas
 * pasan por este cliente. Si algún día sumamos auth, migramos a RLS + anon key.
 */
let cached: SupabaseClient | null = null;

export function getAdminClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.",
    );
  }

  cached = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
