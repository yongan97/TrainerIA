import { XMLParser } from "fast-xml-parser";
import type { SportId } from "@/lib/sports/registry";

/**
 * Parser de archivos .tcx (Garmin Connect export). Detecta el deporte y arma
 * una fila lista para `activities`, con métricas comunes tipadas y las
 * específicas del deporte en `metrics`.
 *
 * FIT es binario y requiere librería aparte; por ahora la vía es TCX (y el flag
 * experimental garmin-connect). Ver README.
 */
export interface ParsedActivity {
  sport: SportId | "unknown";
  source: "garmin";
  started_at: string | null;
  duration_s: number | null;
  distance_m: number | null;
  elevation_gain_m: number | null;
  avg_hr: number | null;
  max_hr: number | null;
  hr_zones: null;
  load: number | null;
  strain: null;
  metrics: Record<string, number | null>;
  external_id: string;
  raw: unknown;
}

function mapTcxSport(sport: string | undefined): SportId | "unknown" {
  const s = (sport ?? "").toLowerCase();
  if (s.includes("bik") || s.includes("cycl")) return "bike";
  if (s.includes("run")) return "run";
  return "unknown";
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true, // ns3:Watts -> Watts
});

function arr<T>(v: T | T[] | undefined): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}
function n(v: unknown): number | null {
  const x = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(x) ? x : null;
}
function avg(xs: number[]): number | null {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
}

interface Trackpoint {
  Time?: string;
  HeartRateBpm?: { Value?: number };
  Cadence?: number;
  DistanceMeters?: number;
  AltitudeMeters?: number;
  Extensions?: { TPX?: { Watts?: number; Speed?: number; RunCadence?: number } };
}

export function parseTcx(xml: string): ParsedActivity {
  const doc = parser.parse(xml);
  const activity = doc?.TrainingCenterDatabase?.Activities?.Activity;
  const act = Array.isArray(activity) ? activity[0] : activity;
  if (!act) throw new Error("TCX sin <Activity> reconocible.");

  const sport = mapTcxSport(act["@_Sport"]);
  const startId: string | undefined = act.Id;
  const laps = arr(act.Lap);

  let duration = 0;
  let distance = 0;
  const points: Trackpoint[] = [];
  for (const lap of laps) {
    duration += n(lap.TotalTimeSeconds) ?? 0;
    distance += n(lap.DistanceMeters) ?? 0;
    for (const tp of arr(lap.Track?.Trackpoint)) points.push(tp as Trackpoint);
  }

  const hrs = points.map((p) => n(p.HeartRateBpm?.Value)).filter((x): x is number => x != null);
  const cadences = points
    .map((p) => n(p.Extensions?.TPX?.RunCadence ?? p.Cadence))
    .filter((x): x is number => x != null);
  const watts = points
    .map((p) => n(p.Extensions?.TPX?.Watts))
    .filter((x): x is number => x != null);

  // Desnivel positivo acumulado.
  let elevGain = 0;
  let prevAlt: number | null = null;
  for (const p of points) {
    const a = n(p.AltitudeMeters);
    if (a != null && prevAlt != null && a > prevAlt) elevGain += a - prevAlt;
    if (a != null) prevAlt = a;
  }

  // Tiempos: si no hay TotalTimeSeconds usamos primer/último trackpoint.
  const times = points.map((p) => p.Time).filter(Boolean) as string[];
  const startedAt = times[0] ?? (typeof startId === "string" ? startId : null);
  if (!duration && times.length >= 2) {
    duration =
      (new Date(times[times.length - 1]).getTime() - new Date(times[0]).getTime()) / 1000;
  }

  const avgHr = avg(hrs);
  const avgCadence = avg(cadences);
  const avgWatts = avg(watts);
  const paceSecPerKm =
    distance > 0 && duration > 0 ? duration / (distance / 1000) : null;

  // Métricas específicas por deporte.
  const metrics: Record<string, number | null> =
    sport === "bike"
      ? {
          avg_power: avgWatts,
          max_power: watts.length ? Math.max(...watts) : null,
          avg_cadence: avgCadence,
        }
      : sport === "run"
        ? {
            avg_pace_s_per_km: paceSecPerKm,
            avg_cadence_spm: avgCadence,
            avg_run_power: avgWatts, // sólo si el archivo lo trae
          }
        : {};

  return {
    sport,
    source: "garmin",
    started_at: startedAt,
    duration_s: duration ? Math.round(duration) : null,
    distance_m: distance || null,
    elevation_gain_m: elevGain ? Math.round(elevGain) : null,
    avg_hr: avgHr != null ? Math.round(avgHr) : null,
    max_hr: hrs.length ? Math.max(...hrs) : null,
    hr_zones: null,
    load: null,
    strain: null,
    metrics,
    external_id: `garmin:${startedAt ?? startId ?? Math.round(distance)}`,
    raw: { sport: act["@_Sport"], id: startId },
  };
}
