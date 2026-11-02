import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/** Tilda o destilda un ítem de la lista de la semana. */
export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const week = String(b.week_start ?? "");
    const key = String(b.item_key ?? "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(week) || !key || key.length > 80) {
      return NextResponse.json({ ok: false, error: "ítem inválido" }, { status: 400 });
    }
    const db = getAdminClient();
    if (b.checked) {
      const { error } = await db.from("shopping_checks").upsert(
        { week_start: week, item_key: key, checked: true, updated_at: new Date().toISOString() },
        { onConflict: "week_start,item_key" },
      );
      if (error) throw new Error(error.message);
    } else {
      const { error } = await db.from("shopping_checks").delete().eq("week_start", week).eq("item_key", key);
      if (error) throw new Error(error.message);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
