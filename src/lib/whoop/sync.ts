import { getAdminClient } from "@/lib/supabase/admin";
import { whoopApi } from "./client";
import { mapRecovery, mapSleep, mapCycle, mapWorkout } from "./mappers";

export interface SyncResult {
  recovery: number;
  sleep: number;
  cycles: number;
  workouts: number;
  weightKg: number | null; // peso traído de body measurement (si el scope está)
  since: string;
}

/** Ventana por defecto del sync incremental si no hay datos previos. */
const DEFAULT_LOOKBACK_DAYS = 30;

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

/**
 * Sync incremental de Whoop v2. Baja recovery/sleep/cycles/workouts desde
 * `sinceISO` (o los últimos 30 días) y hace upsert idempotente por external_id.
 */
export async function syncWhoop(sinceISO?: string): Promise<SyncResult> {
  const db = getAdminClient();
  const since = sinceISO ?? isoDaysAgo(DEFAULT_LOOKBACK_DAYS);

  const [recovery, sleep, cycles, workouts] = await Promise.all([
    whoopApi.recovery(since),
    whoopApi.sleep(since),
    whoopApi.cycles(since),
    whoopApi.workouts(since),
  ]);

  const recoveryRows = recovery.map(mapRecovery).filter((r) => r.date);
  const sleepRows = sleep.map(mapSleep).filter((r) => r.date);
  const cycleRows = cycles.map(mapCycle).filter((r) => r.date);

  // Workouts -> activities (source whoop). Sólo los que pudimos ubicar en el tiempo.
  const activityRows = workouts
    .map(mapWorkout)
    .filter((w) => w.started_at && w.external_id)
    .map((w) => ({
      // Deporte canónico (bike/run) si lo mapeamos; si no, el nombre real de
      // Whoop (spin, swimming, hiking…) en vez de un genérico "unknown".
      sport: w.sport ?? w.sport_name ?? "unknown",
      source: "whoop" as const,
      started_at: w.started_at,
      duration_s: w.duration_s,
      distance_m: w.distance_m,
      elevation_gain_m: w.elevation_gain_m,
      avg_hr: w.avg_hr,
      max_hr: w.max_hr,
      hr_zones: w.hr_zones,
      strain: w.strain,
      load: null,
      metrics: null,
      external_id: `whoop:${w.external_id}`,
      raw: w.raw,
    }));

  if (recoveryRows.length)
    await upsert(db, "whoop_recovery", recoveryRows, "external_id");
  if (sleepRows.length) await upsert(db, "whoop_sleep", sleepRows, "external_id");
  if (cycleRows.length) await upsert(db, "whoop_cycles", cycleRows, "external_id");
  if (activityRows.length)
    await upsert(db, "activities", activityRows, "external_id");

  // Body measurement (peso): best-effort. Si el scope todavía no está otorgado
  // (falta reconectar), no debe romper el sync — se activa al reconectar Whoop.
  let weightKg: number | null = null;
  try {
    const body = await whoopApi.body();
    if (typeof body.weight_kilogram === "number" && body.weight_kilogram > 0) {
      weightKg = Math.round(body.weight_kilogram * 10) / 10;
      await db
        .from("settings")
        .update({ weight_kg: weightKg, updated_at: new Date().toISOString() })
        .eq("id", 1);
    }
  } catch {
    // scope read:body_measurement aún no otorgado; ignorar.
  }

  return {
    recovery: recoveryRows.length,
    sleep: sleepRows.length,
    cycles: cycleRows.length,
    workouts: activityRows.length,
    weightKg,
    since,
  };
}

async function upsert(
  db: ReturnType<typeof getAdminClient>,
  table: string,
  rows: unknown[],
  onConflict: string,
) {
  const { error } = await db.from(table).upsert(rows, { onConflict });
  if (error) throw new Error(`Upsert en ${table} falló: ${error.message}`);
}
