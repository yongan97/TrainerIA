import { NextResponse } from "next/server";
import { syncWhoop } from "@/lib/whoop/sync";
import { reconcileActivities } from "@/lib/reconcile";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Dispara un sync incremental manual (usado por el botón de la UI). */
export async function POST() {
  try {
    const result = await syncWhoop();
    const reconciled = await reconcileActivities();
    return NextResponse.json({ ok: true, result, reconciled });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "error" },
      { status: 500 },
    );
  }
}
