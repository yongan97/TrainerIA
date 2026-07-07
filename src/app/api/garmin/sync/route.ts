import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { garminConfigured, fetchGarminActivities } from "@/lib/garmin/connect";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Sync de Garmin vía librería no oficial (detrás de GARMIN_ENABLED).
 * Baja las últimas actividades y hace upsert idempotente por external_id.
 */
export async function POST(req: NextRequest) {
  const cfg = garminConfigured();
  if (!cfg.ok) {
    return NextResponse.json({ ok: false, error: cfg.reason }, { status: 400 });
  }
  try {
    const limitParam = new URL(req.url).searchParams.get("limit");
    const limit = Math.min(50, Math.max(1, Number(limitParam) || 20));
    const rows = await fetchGarminActivities(limit);
    if (rows.length) {
      const db = getAdminClient();
      const { error } = await db
        .from("activities")
        .upsert(rows, { onConflict: "external_id" });
      if (error) throw new Error(error.message);
    }
    return NextResponse.json({
      ok: true,
      imported: rows.length,
      sports: rows.reduce<Record<string, number>>((acc, r) => {
        acc[r.sport] = (acc[r.sport] ?? 0) + 1;
        return acc;
      }, {}),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
