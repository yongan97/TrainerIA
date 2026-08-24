import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { fetchGarminDynamics, garminConfigured } from "@/lib/garmin/connect";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Enriquece las bicis recientes con la dinámica de pedaleo (efectividad de
 * torque, suavidad, balance) que el sync normal no trae. Baja la actividad
 * completa de Garmin y hace merge en `metrics`.
 * ?days=N (default 30) · ?debug=1 devuelve las claves crudas para inspección.
 */
export async function POST(req: NextRequest) {
  const cfg = garminConfigured();
  if (!cfg.ok) return NextResponse.json({ ok: false, error: cfg.reason }, { status: 400 });
  try {
    const url = new URL(req.url);
    const days = Number(url.searchParams.get("days")) || 30;
    const debug = url.searchParams.get("debug") === "1";
    const since = new Date(Date.now() - days * 86_400_000).toISOString();

    const db = getAdminClient();
    const { data } = await db
      .from("activities")
      .select("id, external_id, metrics")
      .eq("source", "garmin")
      .eq("sport", "bike")
      .gte("started_at", since)
      .order("started_at", { ascending: false })
      .limit(15);

    const rows = (data ?? []) as Array<{
      id: string;
      external_id: string;
      metrics: Record<string, number | null> | null;
    }>;
    const idMap = new Map(rows.map((r) => [r.external_id.replace(/^garmin:/, ""), r]));
    const ids = [...idMap.keys()];

    const { dynamics, debugKeys } = await fetchGarminDynamics(ids, debug);

    let enriched = 0;
    for (const [actId, d] of Object.entries(dynamics)) {
      const row = idMap.get(actId);
      if (!row) continue;
      const clean = Object.fromEntries(Object.entries(d).filter(([, v]) => v != null));
      const metrics = { ...(row.metrics ?? {}), ...clean };
      const { error } = await db.from("activities").update({ metrics }).eq("id", row.id);
      if (!error) enriched++;
    }

    return NextResponse.json({ ok: true, checked: ids.length, enriched, debugKeys });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
