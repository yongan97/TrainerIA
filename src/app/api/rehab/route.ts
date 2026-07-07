import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/** Upsert por fecha: un registro de rehab por día. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const date = String(body.date ?? "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "fecha inválida" }, { status: 400 });
    }
    const kneePain =
      body.knee_pain == null ? null : Math.max(0, Math.min(10, Number(body.knee_pain)));

    const row = {
      date,
      knee_pain: kneePain,
      drills_done: body.drills_done ?? null,
      notes: body.notes ? String(body.notes) : null,
    };

    const db = getAdminClient();
    const { data, error } = await db
      .from("rehab_logs")
      .upsert(row, { onConflict: "date" })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, log: data });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "error" },
      { status: 500 },
    );
  }
}
