import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/** Exporta las actividades a CSV (para que el atleta sea dueño de sus datos). */
export async function GET() {
  try {
    const db = getAdminClient();
    const { data, error } = await db
      .from("activities")
      .select("started_at, sport, source, duration_s, distance_m, avg_hr, max_hr, strain, rpe, feel, metrics")
      .order("started_at", { ascending: false });
    if (error) throw new Error(error.message);

    const cols = ["fecha", "deporte", "fuente", "duracion_min", "distancia_km", "fc_media", "fc_max", "strain", "rpe", "sensacion", "potencia_media", "pace_s_km", "vo2max"];
    const rows = (data ?? []).map((a) => {
      const m = (a.metrics ?? {}) as Record<string, number | null>;
      return [
        a.started_at,
        a.sport,
        a.source,
        a.duration_s != null ? Math.round(a.duration_s / 60) : "",
        a.distance_m != null ? (a.distance_m / 1000).toFixed(2) : "",
        a.avg_hr ?? "",
        a.max_hr ?? "",
        a.strain != null ? Number(a.strain).toFixed(1) : "",
        a.rpe ?? "",
        a.feel ?? "",
        m.avg_power ?? "",
        m.avg_pace_s_per_km != null ? Math.round(m.avg_pace_s_per_km) : "",
        m.vo2max ?? "",
      ].join(",");
    });
    const csv = [cols.join(","), ...rows].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="traineria-actividades.csv"',
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
