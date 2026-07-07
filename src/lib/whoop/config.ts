/**
 * Configuración de la API v2 de Whoop (OAuth 2.0).
 * Docs: https://developer.whoop.com/api
 * Las URLs base se pueden sobreescribir por env por si Whoop las cambia.
 */
export const WHOOP = {
  authUrl:
    process.env.WHOOP_AUTH_URL ??
    "https://api.prod.whoop.com/oauth/oauth2/auth",
  tokenUrl:
    process.env.WHOOP_TOKEN_URL ??
    "https://api.prod.whoop.com/oauth/oauth2/token",
  apiBase:
    process.env.WHOOP_API_BASE ?? "https://api.prod.whoop.com/developer",
  scopes: [
    "read:recovery",
    "read:sleep",
    "read:cycles",
    "read:workout",
    "read:profile",
    "offline", // necesario para obtener refresh_token
  ],
};

export function getWhoopEnv() {
  const clientId = process.env.WHOOP_CLIENT_ID;
  const clientSecret = process.env.WHOOP_CLIENT_SECRET;
  const redirectUri = process.env.WHOOP_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Faltan WHOOP_CLIENT_ID / WHOOP_CLIENT_SECRET / WHOOP_REDIRECT_URI.",
    );
  }
  return { clientId, clientSecret, redirectUri };
}
