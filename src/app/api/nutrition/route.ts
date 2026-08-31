import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const FLAGS = ["desayuno", "almuerzo", "merienda", "cena", "creatina", "omega3"] as const;

/** Upsert del checklist de nutrición de un día. */
export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const date = String(b.date ?? "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ ok: false, error: "fecha inválida" }, { status: 400 });
    }
    const row: Record<string, unknown> = { date, updated_at: new Date().toISOString() };
    for (const f of FLAGS) if (f in b) row[f] = Boolean(b[f]);
    if (b.water_ml != null) row.water_ml = Math.max(0, Math.min(6000, Number(b.water_ml) || 0));
    if (b.notes != null) row.notes = String(b.notes);

    const db = getAdminClient();
    const { data, error } = await db
      .from("nutrition_logs")
      .upsert(row, { onConflict: "date" })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, log: data });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
