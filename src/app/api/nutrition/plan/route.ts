import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { MEAL_BY_ID } from "@/lib/kitchen/meals";
import { weekdayIndex } from "@/lib/kitchen/targets";
import { WEEK_TEMPLATE } from "@/lib/kitchen/week";
import type { MealId } from "@/lib/kitchen/types";

export const runtime = "nodejs";

const MEALS: MealId[] = ["desayuno", "almuerzo", "merienda", "cena"];

/** Cambia una comida por otra del mismo grupo (carne por carne, pescado por pescado). */
export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const day = String(b.day ?? "");
    const meal = String(b.meal ?? "") as MealId;
    const optionId = String(b.option_id ?? "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !MEALS.includes(meal)) {
      return NextResponse.json({ ok: false, error: "comida inválida" }, { status: 400 });
    }
    const baseId = WEEK_TEMPLATE[weekdayIndex(day)][meal];
    const base = MEAL_BY_ID[baseId];
    const next = MEAL_BY_ID[optionId];
    if (!base || !next || next.group !== base.group || !next.slots.includes(meal)) {
      return NextResponse.json({ ok: false, error: "esa opción no es equivalente" }, { status: 400 });
    }

    const db = getAdminClient();
    const { error } = await db.from("meal_swaps").upsert(
      { day, meal, option_id: optionId, updated_at: new Date().toISOString() },
      { onConflict: "day,meal" },
    );
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
