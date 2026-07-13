import { WHOOP, getWhoopEnv } from "./config";
import { saveTokens, loadTokens, type StoredTokens } from "./tokens";

interface WhoopTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number; // segundos
  scope?: string;
  token_type: string;
}

/** URL de autorización para iniciar el flujo OAuth. */
export function buildAuthorizeUrl(state: string): string {
  const { clientId, redirectUri } = getWhoopEnv();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: WHOOP.scopes.join(" "),
    state,
  });
  return `${WHOOP.authUrl}?${params.toString()}`;
}

function toStored(r: WhoopTokenResponse): StoredTokens {
  return {
    accessToken: r.access_token,
    refreshToken: r.refresh_token ?? null,
    // margen de 60s para no usar un token al borde de expirar
    expiresAt: Date.now() + (r.expires_in - 60) * 1000,
    scope: r.scope ?? null,
  };
}

/** Intercambia el `code` del callback por tokens y los persiste. */
export async function exchangeCodeForTokens(code: string): Promise<StoredTokens> {
  const { clientId, clientSecret, redirectUri } = getWhoopEnv();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
  });
  const res = await fetch(WHOOP.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`Whoop token exchange falló (${res.status}): ${await res.text()}`);
  }
  const tokens = toStored((await res.json()) as WhoopTokenResponse);
  await saveTokens(tokens);
  return tokens;
}

async function refresh(refreshToken: string): Promise<StoredTokens> {
  const { clientId, clientSecret } = getWhoopEnv();
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    scope: "offline",
  });
  const res = await fetch(WHOOP.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`Whoop refresh falló (${res.status}): ${await res.text()}`);
  }
  const tokens = toStored((await res.json()) as WhoopTokenResponse);
  // Whoop rota el refresh token; si no vino uno nuevo, conservamos el anterior.
  if (!tokens.refreshToken) tokens.refreshToken = refreshToken;
  await saveTokens(tokens);
  return tokens;
}

/**
 * Refresh single-flight: si varias llamadas concurrentes (p.ej. los 4 endpoints
 * que dispara syncWhoop en paralelo) ven el token vencido a la vez, un solo
 * refresh ocurre y el resto espera esa misma promesa. Sin esto, las N llamadas
 * mandan el MISMO refresh token single-use; Whoop rota el primero e invalida el
 * resto, detecta "reuso" y revoca toda la familia → 400 permanente.
 */
let inFlightRefresh: Promise<StoredTokens> | null = null;

/**
 * Devuelve un access token válido, refrescando si está vencido.
 * Lanza si no hay tokens guardados (hay que conectar Whoop primero).
 */
export async function getValidAccessToken(): Promise<string> {
  const current = await loadTokens();
  if (!current) {
    throw new Error("Whoop no está conectado. Iniciá el OAuth en /api/whoop/auth.");
  }
  if (Date.now() < current.expiresAt) {
    return current.accessToken;
  }
  if (!current.refreshToken) {
    throw new Error("Token vencido y sin refresh_token. Reconectá Whoop.");
  }
  // Dedupe: solo el primero arranca el refresh; el resto aguarda esa promesa.
  if (!inFlightRefresh) {
    const rt = current.refreshToken;
    inFlightRefresh = refresh(rt).finally(() => {
      inFlightRefresh = null;
    });
  }
  const refreshed = await inFlightRefresh;
  return refreshed.accessToken;
}
