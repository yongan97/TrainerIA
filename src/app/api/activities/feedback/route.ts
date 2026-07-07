import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const id = String(b.id ?? "");
    if (!id) return NextResponse.json({ error: "falta id" }, { status: 400 });
    const rpe = b.rpe == null || b.rpe === "" ? null : Math.max(1, Math.min(10, Number(b.rpe)));
    const db = getAdminClient();
    const { error } = await db
      .from("activities")
      .update({ rpe, feel: b.feel || null, user_notes: b.notes || null })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
