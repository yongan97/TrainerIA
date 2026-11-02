import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { GOAL_RANGE_KG, GOAL_WEIGHT_KG } from "@/lib/kitchen/targets";

export const runtime = "nodejs";

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** Pesada manual, o la meta (kg + fecha). No toca el sync de Whoop. */
export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const db = getAdminClient();

    if (b.goal_kg != null || b.goal_date != null) {
      const goal = num(b.goal_kg);
      if (goal == null || goal < GOAL_RANGE_KG.min - 5 || goal > 130) {
        return NextResponse.json({ ok: false, error: "meta de peso inválida" }, { status: 400 });
      }
      const date = typeof b.goal_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(b.goal_date) ? b.goal_date : null;
      const { error } = await db
        .from("settings")
        .update({
          weight_goal_kg: goal,
          weight_goal_date: date,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    }

    const date = String(b.date ?? "");
    const kg = num(b.weight_kg);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || kg == null || kg < 40 || kg > 200) {
      return NextResponse.json({ ok: false, error: "pesada inválida" }, { status: 400 });
    }
    const { error } = await db.from("weight_logs").upsert(
      { date, source: "manual", weight_kg: Math.round(kg * 10) / 10 },
      { onConflict: "date,source" },
    );
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, defaultGoal: GOAL_WEIGHT_KG });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
