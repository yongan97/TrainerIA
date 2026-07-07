import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/whoop/oauth";
import { syncWhoop } from "@/lib/whoop/sync";

export const runtime = "nodejs";

/** Callback de Whoop: valida state, canjea code por tokens y hace un primer sync. */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${origin}/overview?whoop=error&msg=${error}`);
  }

  const expected = req.cookies.get("whoop_oauth_state")?.value;
  if (!code || !state || !expected || state !== expected) {
    return NextResponse.redirect(`${origin}/overview?whoop=state_mismatch`);
  }

  try {
    await exchangeCodeForTokens(code);
    // Primer sync inmediato para tener datos reales al toque.
    await syncWhoop().catch(() => null);
    const res = NextResponse.redirect(`${origin}/overview?whoop=connected`);
    res.cookies.delete("whoop_oauth_state");
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.redirect(
      `${origin}/overview?whoop=exchange_failed&msg=${encodeURIComponent(msg)}`,
    );
  }
}
