import { NextResponse } from "next/server";
import { runAllSync } from "@/lib/sync-all";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Sync manual/automático desde la app (auto-sync al abrir si los datos están
 * viejos). Mismo pipeline que el cron, sin secret (same-origin).
 */
export async function POST() {
  try {
    const result = await runAllSync();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
