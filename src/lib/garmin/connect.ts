import { GarminConnect } from "garmin-connect";
import { mapGarminSport } from "@/lib/sports/registry";

/**
 * Vía EXPERIMENTAL de Garmin: librería no oficial `garmin-connect` (API privada,
 * ingeniería inversa) detrás del flag GARMIN_ENABLED. Puede romperse cuando
 * Garmin cambia su login. La vía estable sigue siendo el import de .tcx.
 *
 * Credenciales desde env (GARMIN_EMAIL / GARMIN_PASSWORD). La password se carga
 * directo en Vercel: nunca pasa por el código fuente ni por logs.
 */
export function garminConfigured(): { ok: boolean; reason?: string } {
  if (process.env.GARMIN_ENABLED !== "true")
    return { ok: false, reason: "GARMIN_ENABLED no está en 'true'." };
  if (!process.env.GARMIN_EMAIL || !process.env.GARMIN_PASSWORD)
    return { ok: false, reason: "Faltan GARMIN_EMAIL o GARMIN_PASSWORD." };
  return { ok: true };
}

async function loginClient(): Promise<GarminConnect> {
  const gc = new GarminConnect({
    username: process.env.GARMIN_EMAIL as string,
    password: process.env.GARMIN_PASSWORD as string,
  });
  await gc.login();
  return gc;
}

/** Prueba el login sin bajar datos. Devuelve nombre de perfil si entra. */
export async function testGarminLogin(): Promise<{
  ok: boolean;
  profile?: string;
  error?: string;
}> {
  const cfg = garminConfigured();
  if (!cfg.ok) return { ok: false, error: cfg.reason };
  try {
    const gc = await loginClient();
    const profile = await gc.getUserProfile();
    const name =
      (profile as { displayName?: string; userName?: string })?.displayName ??
      (profile as { userName?: string })?.userName ??
      "conectado";
    return { ok: true, profile: name };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

type GAct = Record<string, unknown>;
function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
function typeKeyOf(a: GAct): string {
  const t = a.activityType as { typeKey?: string } | undefined;
  return t?.typeKey ?? "unknown";
}

/** Mapea una actividad de Garmin a una fila de `activities`. */
export function mapGarminActivity(a: GAct) {
  const typeKey = typeKeyOf(a);
  const sport = mapGarminSport(typeKey);
  const gmt = typeof a.startTimeGMT === "string" ? a.startTimeGMT : null;
  const startedAt = gmt ? gmt.replace(" ", "T") + "Z" : null;
  const dist = num(a.distance);
  const dur = num(a.duration);
  const paceSecPerKm = dist && dur && dist > 0 ? dur / (dist / 1000) : null;

  // Métricas comunes ricas de Garmin (VO2max, training effect, carga).
  const common: Record<string, number | null> = {
    vo2max: num(a.vO2MaxValue),
    aerobic_te: num(a.aerobicTrainingEffect),
    anaerobic_te: num(a.anaerobicTrainingEffect),
    garmin_load: num(a.activityTrainingLoad),
  };
  const metrics: Record<string, number | null> =
    sport === "bike"
      ? {
          ...common,
          avg_power: num(a.avgPower),
          max_power: num(a.maxPower),
          normalized_power: num(a.normPower),
          avg_cadence: num(a.averageBikingCadenceInRevPerMinute),
        }
      : sport === "run"
        ? {
            ...common,
            avg_pace_s_per_km: paceSecPerKm,
            avg_cadence_spm: num(a.averageRunningCadenceInStepsPerMinute),
            avg_run_power: num(a.avgPower),
          }
        : common;

  const avgHr = num(a.averageHR);
  const maxHr = num(a.maxHR);
  // Zonas de FC de Garmin (hrTimeInZone_1..5, en segundos -> ms).
  const zSec = (n: number) => num(a[`hrTimeInZone_${n}`]);
  const hasZones = [1, 2, 3, 4, 5].some((n) => (zSec(n) ?? 0) > 0);
  const hrZones = hasZones
    ? {
        zone_1_ms: Math.round((zSec(1) ?? 0) * 1000),
        zone_2_ms: Math.round((zSec(2) ?? 0) * 1000),
        zone_3_ms: Math.round((zSec(3) ?? 0) * 1000),
        zone_4_ms: Math.round((zSec(4) ?? 0) * 1000),
        zone_5_ms: Math.round((zSec(5) ?? 0) * 1000),
      }
    : null;
  return {
    sport: sport ?? typeKey, // canónico (bike/run) o el typeKey real de Garmin
    source: "garmin" as const,
    started_at: startedAt,
    duration_s: dur ? Math.round(dur) : null,
    distance_m: dist,
    elevation_gain_m: num(a.elevationGain),
    avg_hr: avgHr ? Math.round(avgHr) : null,
    max_hr: maxHr ? Math.round(maxHr) : null,
    hr_zones: hrZones,
    load: null,
    strain: null,
    metrics,
    external_id: `garmin:${a.activityId}`,
    raw: a,
  };
}

/** Baja las últimas `limit` actividades ya mapeadas. */
export async function fetchGarminActivities(limit = 20) {
  const gc = await loginClient();
  const acts = (await gc.getActivities(0, limit)) as unknown as GAct[];
  return acts.map(mapGarminActivity).filter((a) => a.started_at && a.external_id);
}

export interface Split {
  index: number;
  distance_m: number | null;
  duration_s: number | null;
  avg_hr: number | null;
  avg_power: number | null;
  avg_pace_s_per_km: number | null;
  elevation_gain_m: number | null;
}

/**
 * Trae los splits por vuelta de una actividad de Garmin (endpoint no oficial
 * activity-service). Defensivo: si falla, devuelve lista vacía.
 */
export async function fetchGarminSplits(activityId: string): Promise<Split[]> {
  const cfg = garminConfigured();
  if (!cfg.ok) return [];
  try {
    const gc = await loginClient();
    const base = (gc as unknown as { url: { ACTIVITY: string } }).url.ACTIVITY;
    const res = (await gc.get(`${base}${activityId}/splits`)) as { lapDTOs?: GAct[] };
    const laps = res?.lapDTOs ?? [];
    return laps.map((lap, i) => {
      const dist = num(lap.distance);
      const dur = num(lap.duration) ?? num(lap.elapsedDuration);
      const speed = num(lap.averageSpeed); // m/s
      return {
        index: i + 1,
        distance_m: dist,
        duration_s: dur,
        avg_hr: num(lap.averageHR),
        avg_power: num(lap.averagePower),
        avg_pace_s_per_km: speed && speed > 0 ? 1000 / speed : dist && dur && dist > 0 ? dur / (dist / 1000) : null,
        elevation_gain_m: num(lap.elevationGain),
      };
    });
  } catch {
    return [];
  }
}
