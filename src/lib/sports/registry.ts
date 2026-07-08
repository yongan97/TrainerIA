/**
 * Registry multideporte. Fuente única de verdad de qué deportes existen, cómo
 * se ven (color/ícono) y qué métricas específicas maneja cada uno.
 *
 * Para sumar un deporte nuevo: agregar una entrada acá. Nada de `if (sport === 'bike')`
 * desparramado por la app.
 */
export type SportId = "bike" | "run";

export interface SportMetricDef {
  key: string; // clave dentro de activities.metrics (jsonb)
  label: string;
  unit: string;
}

export interface SportConfig {
  id: SportId;
  label: string;
  colorVar: string; // variable CSS (ver globals.css)
  icon: "bike" | "footprints"; // nombre de ícono lucide
  /** métricas específicas que viven en activities.metrics */
  metrics: SportMetricDef[];
}

export const SPORTS: Record<SportId, SportConfig> = {
  bike: {
    id: "bike",
    label: "Ciclismo",
    colorVar: "var(--sport-bike)",
    icon: "bike",
    metrics: [
      { key: "avg_power", label: "Potencia media", unit: "W" },
      { key: "normalized_power", label: "NP", unit: "W" },
      { key: "intensity_factor", label: "IF", unit: "" },
      { key: "tss", label: "TSS", unit: "" },
      { key: "avg_cadence", label: "Cadencia", unit: "rpm" },
      { key: "max_power", label: "Potencia máx", unit: "W" },
    ],
  },
  run: {
    id: "run",
    label: "Running",
    colorVar: "var(--sport-run)",
    icon: "footprints",
    metrics: [
      { key: "avg_pace_s_per_km", label: "Pace medio", unit: "min/km" },
      { key: "avg_cadence_spm", label: "Cadencia", unit: "spm" },
      { key: "avg_run_power", label: "Potencia (si hay)", unit: "W" },
      { key: "elevation_gain_m", label: "Desnivel+", unit: "m" },
    ],
  },
};

export const SPORT_IDS = Object.keys(SPORTS) as SportId[];

export function isSportId(value: string): value is SportId {
  return value in SPORTS;
}

export function getSport(id: string): SportConfig | undefined {
  return isSportId(id) ? SPORTS[id] : undefined;
}

/**
 * Mapea el sport_id de Whoop (v2) al deporte de nuestro modelo.
 * Whoop tiene decenas de tipos; acá cubrimos los que hago y devolvemos null
 * para el resto (se guarda igual con sport crudo en raw, pero sin métricas propias).
 * IDs de referencia de Whoop; se ajustan empíricamente con datos reales.
 */
const WHOOP_SPORT_ID_MAP: Record<number, SportId> = {
  0: "run", // Running
  1: "bike", // Cycling
  97: "bike", // Spin / indoor cycling (verificado con datos reales)
  // Walking (63), swimming (33), hiking (52), meditación (243) y genérico (-1)
  // NO se mapean a bike/run: se guardan con su nombre real de Whoop para no
  // ensuciar la señal de impacto de running (relevante para el rehab de cuádriceps).
};

export function mapWhoopSport(sportId: number | null | undefined): SportId | null {
  if (sportId == null) return null;
  return WHOOP_SPORT_ID_MAP[sportId] ?? null;
}

/**
 * Mapea el typeKey de Garmin Connect al deporte de nuestro modelo.
 * Cubre las variantes de bici y running; el resto se guarda con su typeKey real.
 */
export function mapGarminSport(typeKey: string | null | undefined): SportId | null {
  const k = (typeKey ?? "").toLowerCase();
  if (k.includes("run")) return "run"; // running, trail_running, treadmill_running
  if (k.includes("cycl") || k.includes("bik") || k.includes("ride"))
    return "bike"; // cycling, virtual_ride, indoor_cycling, road_biking, mountain_biking
  return null;
}
