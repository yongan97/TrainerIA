import { NextRequest, NextResponse } from "next/server";
import { runAllSync } from "@/lib/sync-all";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Sync manual/automático desde la app (auto-sync al abrir si los datos están
 * viejos). Mismo pipeline que el cron, sin secret (same-origin).
 * ?days=N hace un backfill de N días de historia de Whoop.
 */
export async function POST(req: NextRequest) {
  try {
    const days = Number(new URL(req.url).searchParams.get("days"));
    const sinceISO =
      Number.isFinite(days) && days > 0
        ? new Date(Date.now() - days * 86_400_000).toISOString()
        : undefined;
    const result = await runAllSync(sinceISO);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
