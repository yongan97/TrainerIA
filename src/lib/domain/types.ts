import type { SportId } from "@/lib/sports/registry";

export type ActivitySource = "garmin" | "whoop" | "manual";

/** EJECUTADO — modelo base multideporte. Métricas específicas en `metrics`. */
export interface Activity {
  id: string;
  sport: SportId | string;
  source: ActivitySource;
  started_at: string; // ISO
  duration_s: number | null;
  distance_m: number | null;
  elevation_gain_m: number | null;
  avg_hr: number | null;
  max_hr: number | null;
  hr_zones: Record<string, number> | null; // segundos por zona
  load: number | null; // carga normalizada para combinar deportes
  strain: number | null; // de Whoop, si matchea
  metrics: Record<string, number | null> | null; // específico por deporte
  external_id: string | null;
  raw: unknown;
  rpe: number | null; // esfuerzo percibido 1-10
  feel: string | null; // cómo se sintió
  user_notes: string | null;
  created_at: string;
}

/** PLANIFICADO — plan del entrenador. */
export interface PlannedSession {
  id: string;
  sport: SportId | string;
  date: string; // YYYY-MM-DD
  type: string | null;
  target_duration_s: number | null;
  targets: Record<string, unknown> | null; // zonas/pace/potencia objetivo
  rehab_notes: string | null;
  source: "manual" | "file";
  created_at: string;
}

/** TOLERADO — Whoop. */
export interface WhoopRecovery {
  id: string;
  date: string;
  recovery_score: number | null;
  hrv_rmssd: number | null;
  rhr: number | null;
  spo2: number | null;
  skin_temp_c: number | null;
  raw: unknown;
  created_at: string;
}

export interface WhoopSleep {
  id: string;
  date: string;
  duration_s: number | null;
  efficiency: number | null;
  disturbances: number | null;
  stages: Record<string, number> | null;
  raw: unknown;
  created_at: string;
}

export interface WhoopCycle {
  id: string;
  date: string;
  day_strain: number | null;
  avg_hr: number | null;
  kilojoules: number | null;
  raw: unknown;
  created_at: string;
}

export interface Settings {
  id: number;
  ftp: number | null;
  lthr: number | null;
  hr_max: number | null;
  hr_rest: number | null;
  weight_kg: number | null;
  goal_name: string | null;
  goal_date: string | null;
  goal_distance_km: number | null;
  updated_at: string;
}

export interface RehabLog {
  id: string;
  date: string;
  knee_pain: number | null; // 0-10
  drills_done: Record<string, boolean> | null;
  notes: string | null;
  created_at: string;
}
