import { getNutritionLogs, getSettings, isConfigured } from "@/lib/data";
import { adherence, currentStreak, type NutritionLog } from "@/lib/nutrition-plan";
import { getAdminClient } from "@/lib/supabase/admin";
import type { MealId, SessionLite, ShoppingLine } from "@/lib/kitchen/types";
import {
  DEFAULT_WEIGHT_KG,
  GOAL_WEIGHT_KG,
  dateAtMaxPace,
  mondayOf,
  addDays,
} from "@/lib/kitchen/targets";
import { buildWeekFuel, minutesFromPlanned } from "@/lib/kitchen/training";
import { resolveWeek, shoppingList, type ResolvedDay } from "@/lib/kitchen/week";

export interface WeightPoint {
  date: string;
  weight_kg: number;
  source: "manual" | "whoop";
}

export interface KitchenView {
  today: string;
  weekStart: string;
  configured: boolean;
  weightKg: number;
  weightSource: "whoop" | "manual" | "perfil";
  whoopKg: number | null;
  goalKg: number;
  goalDate: string | null;
  /** True cuando no hay fecha guardada y mostramos la del tope de 0,5 kg/semana. */
  goalDateSuggested: boolean;
  weights: WeightPoint[];
  days: ResolvedDay[];
  shopping: ShoppingLine[];
  checks: string[];
  usingTypicalWeek: boolean;
  cutAllowed: boolean;
  cutReason: string;
  todayLog: NutritionLog | null;
  streak: number;
  adherence7: number | null;
  goalRaceDate: string | null;
}

async function quiet<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (!isConfigured()) return fallback;
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

function num(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function getKitchenView(today: string): Promise<KitchenView> {
  const weekStart = mondayOf(today);
  const weekEnd = addDays(weekStart, 6);

  const [settings, logs, plannedRows, weights, swaps, checks, trained] = await Promise.all([
    getSettings(),
    getNutritionLogs(60),
    quiet(async () => {
      const db = getAdminClient();
      const { data, error } = await db
        .from("planned_sessions")
        .select("sport, type, date, target_duration_s, targets")
        .gte("date", weekStart)
        .lte("date", weekEnd);
      if (error) throw new Error(error.message);
      return data ?? [];
    }, [] as Array<Record<string, unknown>>),
    quiet(async () => {
      const db = getAdminClient();
      const { data, error } = await db
        .from("weight_logs")
        .select("date, weight_kg, source")
        .order("date", { ascending: false })
        .limit(120);
      if (error) throw new Error(error.message);
      return (data ?? []) as Array<{ date: string; weight_kg: number | string; source: string }>;
    }, [] as Array<{ date: string; weight_kg: number | string; source: string }>),
    quiet(async () => {
      const db = getAdminClient();
      const { data, error } = await db
        .from("meal_swaps")
        .select("day, meal, option_id")
        .gte("day", weekStart)
        .lte("day", weekEnd);
      if (error) throw new Error(error.message);
      return (data ?? []) as Array<{ day: string; meal: string; option_id: string }>;
    }, [] as Array<{ day: string; meal: string; option_id: string }>),
    quiet(async () => {
      const db = getAdminClient();
      const { data, error } = await db
        .from("shopping_checks")
        .select("item_key, checked")
        .eq("week_start", weekStart);
      if (error) throw new Error(error.message);
      return (data ?? []) as Array<{ item_key: string; checked: boolean }>;
    }, [] as Array<{ item_key: string; checked: boolean }>),
    quiet(async () => {
      const db = getAdminClient();
      const tomorrow = addDays(today, 1);
      const { data, error } = await db
        .from("activities")
        .select("sport, duration_s")
        .gte("started_at", today)
        .lt("started_at", tomorrow)
        .order("duration_s", { ascending: false })
        .limit(1);
      if (error) throw new Error(error.message);
      const row = data?.[0] as { sport?: string; duration_s?: number | null } | undefined;
      if (!row?.duration_s) return { minutes: null as number | null, label: null as string | null };
      return {
        minutes: Math.round(row.duration_s / 60),
        label: row.sport ? `Ya entrenaste (${row.sport})` : "Ya entrenaste",
      };
    }, { minutes: null as number | null, label: null as string | null }),
  ]);

  const whoopKg = num(settings?.weight_kg);
  if (whoopKg && whoopKg > 30) {
    await quiet(async () => {
      const db = getAdminClient();
      const { error } = await db.from("weight_logs").upsert(
        { date: today, source: "whoop", weight_kg: Math.round(whoopKg * 10) / 10 },
        { onConflict: "date,source" },
      );
      if (error) throw new Error(error.message);
      return true;
    }, false);
  }

  const weightPoints: WeightPoint[] = weights
    .filter((w) => w.source === "manual" || w.source === "whoop")
    .map((w) => ({
      date: String(w.date).slice(0, 10),
      weight_kg: Number(w.weight_kg),
      source: w.source as "manual" | "whoop",
    }));
  if (whoopKg && !weightPoints.some((w) => w.date === today && w.source === "whoop")) {
    weightPoints.unshift({ date: today, weight_kg: whoopKg, source: "whoop" });
  }

  const manual = weightPoints.find((w) => w.source === "manual");
  const whoopPoint = weightPoints.find((w) => w.source === "whoop");
  let weightKg = DEFAULT_WEIGHT_KG;
  let weightSource: KitchenView["weightSource"] = "perfil";
  if (manual && (!whoopPoint || manual.date >= whoopPoint.date)) {
    weightKg = manual.weight_kg;
    weightSource = "manual";
  } else if (whoopKg) {
    weightKg = whoopKg;
    weightSource = "whoop";
  } else if (manual) {
    weightKg = manual.weight_kg;
    weightSource = "manual";
  }

  const goalKg = num(settings?.weight_goal_kg) ?? GOAL_WEIGHT_KG;
  const storedGoal = settings?.weight_goal_date ?? null;
  const goalDateSuggested = !storedGoal;
  const goalDate = storedGoal ?? dateAtMaxPace(weightKg, goalKg, today);

  const planned: SessionLite[] = (plannedRows as Array<Record<string, unknown>>).map((row) => {
    const parsed = minutesFromPlanned({
      sport: (row.sport as string) ?? null,
      type: (row.type as string) ?? null,
      target_duration_s: (row.target_duration_s as number) ?? null,
      targets: (row.targets as Record<string, unknown>) ?? null,
    });
    return {
      date: String(row.date).slice(0, 10),
      sport: (row.sport as string) ?? null,
      type: (row.type as string) ?? null,
      minutes: parsed.minutes,
      codigo: parsed.codigo,
    };
  });

  const fuel = buildWeekFuel({
    today,
    goalDate: settings?.goal_date ?? null,
    planned,
    trainedMinutesToday: trained.minutes,
    trainedLabelToday: trained.label,
  });

  const swapMap: Record<string, string> = {};
  for (const s of swaps) swapMap[`${String(s.day).slice(0, 10)}:${s.meal}`] = s.option_id;

  const days = resolveWeek(weekStart, fuel.days, swapMap);
  const shopping = shoppingList(days);

  return {
    today,
    weekStart,
    configured: isConfigured(),
    weightKg,
    weightSource,
    whoopKg,
    goalKg,
    goalDate,
    goalDateSuggested,
    weights: weightPoints,
    days,
    shopping,
    checks: checks.filter((c) => c.checked).map((c) => c.item_key),
    usingTypicalWeek: fuel.usingTypicalWeek,
    cutAllowed: fuel.cutAllowed,
    cutReason: fuel.cutReason,
    todayLog: logs.find((l) => l.date === today) ?? null,
    streak: currentStreak(logs, today),
    adherence7: adherence(logs, 7, today),
    goalRaceDate: settings?.goal_date ?? null,
  };
}

export type { MealId };
