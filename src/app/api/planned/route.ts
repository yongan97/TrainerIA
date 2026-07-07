import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { isSportId } from "@/lib/sports/registry";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sport = String(body.sport ?? "");
    const date = String(body.date ?? "");
    if (!isSportId(sport)) {
      return NextResponse.json({ error: "deporte inválido" }, { status: 400 });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "fecha inválida" }, { status: 400 });
    }

    const row = {
      sport,
      date,
      type: body.type ? String(body.type) : null,
      target_duration_s: body.target_minutes
        ? Math.round(Number(body.target_minutes) * 60)
        : null,
      targets: body.targets ?? null,
      rehab_notes: body.rehab_notes ? String(body.rehab_notes) : null,
      source: "manual" as const,
    };

    const db = getAdminClient();
    const { data, error } = await db
      .from("planned_sessions")
      .insert(row)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, session: data });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "falta id" }, { status: 400 });
    const db = getAdminClient();
    const { error } = await db.from("planned_sessions").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "error" },
      { status: 500 },
    );
  }
}
