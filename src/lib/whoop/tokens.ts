import { getAdminClient } from "@/lib/supabase/admin";
import { encrypt, decrypt } from "@/lib/crypto";

export interface StoredTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number; // epoch ms
  scope: string | null;
}

const PROVIDER = "whoop";

/** Guarda (upsert) los tokens cifrados. Single-user: una fila por provider. */
export async function saveTokens(t: StoredTokens): Promise<void> {
  const db = getAdminClient();
  const { error } = await db.from("oauth_tokens").upsert(
    {
      provider: PROVIDER,
      access_token: encrypt(t.accessToken),
      refresh_token: t.refreshToken ? encrypt(t.refreshToken) : null,
      expires_at: new Date(t.expiresAt).toISOString(),
      scope: t.scope,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "provider" },
  );
  if (error) throw new Error(`No se pudieron guardar tokens: ${error.message}`);
}

export async function loadTokens(): Promise<StoredTokens | null> {
  const db = getAdminClient();
  const { data, error } = await db
    .from("oauth_tokens")
    .select("access_token, refresh_token, expires_at, scope")
    .eq("provider", PROVIDER)
    .maybeSingle();
  if (error) throw new Error(`No se pudieron leer tokens: ${error.message}`);
  if (!data) return null;
  return {
    accessToken: decrypt(data.access_token),
    refreshToken: data.refresh_token ? decrypt(data.refresh_token) : null,
    expiresAt: new Date(data.expires_at).getTime(),
    scope: data.scope,
  };
}
