import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { buildAuthorizeUrl } from "@/lib/whoop/oauth";

export const runtime = "nodejs";

/** Inicia el flujo OAuth: genera state anti-CSRF y redirige a Whoop. */
export async function GET() {
  try {
    const state = crypto.randomBytes(16).toString("hex");
    const url = buildAuthorizeUrl(state);
    const res = NextResponse.redirect(url);
    res.cookies.set("whoop_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
    return res;
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "error" },
      { status: 500 },
    );
  }
}
