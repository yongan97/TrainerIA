import { mapWhoopSport } from "@/lib/sports/registry";

/**
 * Mappers defensivos de las respuestas de Whoop v2 a nuestras filas.
 * Guardamos siempre `raw` para poder re-mapear si un campo tiene otro nombre.
 * Los helpers toleran undefined/null y estructuras anidadas variables.
 */
type Obj = Record<string, unknown>;

function obj(v: unknown): Obj {
  return v && typeof v === "object" ? (v as Obj) : {};
}
function num(v: unknown): number | null {
  return typeof v === "number" && !Number.isNaN(v) ? v : null;
}

/** Whoop marca el día con el fin del ciclo/sueño; tomamos YYYY-MM-DD UTC. */
function dateOf(iso: unknown): string | null {
  if (typeof iso !== "string") return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

export function mapRecovery(r: Obj) {
  const score = obj(r.score);
  return {
    external_id: String(r.cycle_id ?? r.sleep_id ?? r.id ?? ""),
    date: dateOf(r.updated_at ?? r.created_at),
    recovery_score: num(score.recovery_score),
    hrv_rmssd: num(score.hrv_rmssd_milli),
    rhr: num(score.resting_heart_rate),
    spo2: num(score.spo2_percentage),
    skin_temp_c: num(score.skin_temp_celsius),
    raw: r,
  };
}

export function mapSleep(r: Obj) {
  const score = obj(r.score);
  const stageSummary = obj(score.stage_summary);
  return {
    external_id: String(r.id ?? ""),
    date: dateOf(r.end ?? r.start),
    duration_s:
      num(stageSummary.total_in_bed_time_milli) != null
        ? Math.round((stageSummary.total_in_bed_time_milli as number) / 1000)
        : null,
    efficiency: num(score.sleep_efficiency_percentage),
    disturbances: num(stageSummary.disturbance_count),
    stages: {
      light_ms: num(stageSummary.total_light_sleep_time_milli) ?? 0,
      deep_ms: num(stageSummary.total_slow_wave_sleep_time_milli) ?? 0,
      rem_ms: num(stageSummary.total_rem_sleep_time_milli) ?? 0,
      awake_ms: num(stageSummary.total_awake_time_milli) ?? 0,
    },
    raw: r,
  };
}

export function mapCycle(r: Obj) {
  const score = obj(r.score);
  return {
    external_id: String(r.id ?? ""),
    date: dateOf(r.start),
    day_strain: num(score.strain),
    avg_hr: num(score.average_heart_rate),
    kilojoules: num(score.kilojoule),
    raw: r,
  };
}

export function mapWorkout(r: Obj) {
  const score = obj(r.score);
  const zones = obj(score.zone_duration);
  const sportId = num(r.sport_id);
  const sport = mapWhoopSport(sportId);
  return {
    external_id: String(r.id ?? ""),
    sport, // puede ser null si no lo mapeamos aún
    sport_name: typeof r.sport_name === "string" ? r.sport_name : null,
    started_at: typeof r.start === "string" ? r.start : null,
    duration_s:
      typeof r.start === "string" && typeof r.end === "string"
        ? Math.round((new Date(r.end).getTime() - new Date(r.start).getTime()) / 1000)
        : null,
    distance_m: num(score.distance_meter),
    elevation_gain_m: num(score.altitude_gain_meter),
    avg_hr: num(score.average_heart_rate),
    max_hr: num(score.max_heart_rate),
    hr_zones: {
      zone_0_ms: num(zones.zone_zero_milli) ?? 0,
      zone_1_ms: num(zones.zone_one_milli) ?? 0,
      zone_2_ms: num(zones.zone_two_milli) ?? 0,
      zone_3_ms: num(zones.zone_three_milli) ?? 0,
      zone_4_ms: num(zones.zone_four_milli) ?? 0,
      zone_5_ms: num(zones.zone_five_milli) ?? 0,
    },
    strain: num(score.strain),
    raw: r,
  };
}
