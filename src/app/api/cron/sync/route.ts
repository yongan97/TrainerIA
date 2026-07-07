import { NextRequest, NextResponse } from "next/server";
import { syncWhoop } from "@/lib/whoop/sync";
import { getAdminClient } from "@/lib/supabase/admin";
import { garminConfigured, fetchGarminActivities } from "@/lib/garmin/connect";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Sync de Garmin best-effort: nunca tira el cron si Garmin falla. */
async function syncGarminBestEffort() {
  if (!garminConfigured().ok) return { skipped: true };
  try {
    const rows = await fetchGarminActivities(30);
    if (rows.length) {
      const db = getAdminClient();
      await db.from("activities").upsert(rows, { onConflict: "external_id" });
    }
    return { imported: rows.length };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

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
    const [whoop, garmin] = await Promise.all([
      syncWhoop(),
      syncGarminBestEffort(),
    ]);
    return NextResponse.json({ ok: true, whoop, garmin });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "error" },
      { status: 500 },
    );
  }
}
