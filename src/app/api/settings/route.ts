import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const numOrNull = (v: unknown) => (v === "" || v == null ? null : Number(v));

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const row = {
      id: 1,
      ftp: numOrNull(b.ftp),
      lthr: numOrNull(b.lthr),
      hr_max: numOrNull(b.hr_max),
      hr_rest: numOrNull(b.hr_rest),
      weight_kg: numOrNull(b.weight_kg),
      goal_name: b.goal_name ? String(b.goal_name) : null,
      goal_date: b.goal_date && /^\d{4}-\d{2}-\d{2}$/.test(b.goal_date) ? b.goal_date : null,
      updated_at: new Date().toISOString(),
    };
    const db = getAdminClient();
    const { error } = await db.from("settings").upsert(row, { onConflict: "id" });
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
