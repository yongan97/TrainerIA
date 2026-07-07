import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { isSportId } from "@/lib/sports/registry";

export const runtime = "nodejs";

interface SessionInput {
  sport: string;
  weekday: number; // 0 = lunes
  type: string;
  values: string[]; // progresión por semana
  unit: string;
}

function mondayOf(dateStr: string): Date {
  const d = new Date(dateStr + "T00:00:00Z");
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  return d;
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const meso = String(b.meso ?? "Mesociclo");
    const start = String(b.start ?? "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) {
      return NextResponse.json({ error: "fecha de inicio inválida" }, { status: 400 });
    }
    const sessions = (b.sessions ?? []) as SessionInput[];
    const monday = mondayOf(start);
    const rows: Record<string, unknown>[] = [];

    for (const s of sessions) {
      if (!isSportId(s.sport)) continue;
      const values = s.values.filter((v) => v.trim() !== "");
      values.forEach((val, w) => {
        const d = new Date(monday);
        d.setUTCDate(monday.getUTCDate() + w * 7 + (s.weekday ?? 0));
        const date = d.toISOString().slice(0, 10);
        const valUnit = `${val}${s.unit ? " " + s.unit : ""}`;
        rows.push({
          sport: s.sport,
          date,
          type: s.type ? `${s.type} · ${valUnit}` : valUnit,
          targets: { meso, semana: w + 1, codigo: s.type || null, valor: val, unidad: s.unit || null, notas: `${s.type ? s.type + ": " : ""}${valUnit}` },
          source: "manual",
        });
      });
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: "no se generaron sesiones" }, { status: 400 });
    }
    const db = getAdminClient();
    // Reemplaza el meso si ya existía (idempotente por nombre)
    await db.from("planned_sessions").delete().eq("targets->>meso", meso);
    const { error } = await db.from("planned_sessions").insert(rows);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, created: rows.length });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
