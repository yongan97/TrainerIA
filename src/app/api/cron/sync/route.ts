import { NextRequest, NextResponse } from "next/server";
import { syncWhoop } from "@/lib/whoop/sync";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Endpoint de cron (Vercel). Protegido por CRON_SECRET: Vercel envía el header
 * `Authorization: Bearer <CRON_SECRET>` cuando configurás el cron con ese secret.
 * Ver vercel.json.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }
  try {
    const result = await syncWhoop();
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "error" },
      { status: 500 },
    );
  }
}
