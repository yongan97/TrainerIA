/**
 * Cuentas que ya estaban personalizadas para este atleta (106,5 kg, 185 cm):
 * proteína 1,8 g/kg todos los días, y carga de hidratos 7–10 g/kg.
 * Sobre 106,5 kg, 7 g/kg ≈ 750 g y 8 g/kg ≈ 850 g (el rango práctico de un fondo).
 * El tope del protocolo escandinavo es 10 g/kg (~1065 g), solo 2–3 días antes de una carrera.
 *
 * El plato de Harvard base es ½ verdura, ¼ proteína, ¼ hidrato.
 * En día de entreno crece la tajada de hidrato y se achica la de verdura.
 * La proteína en gramos no baja: 1,8 g/kg se reparte en las 4 comidas.
 *
 * No es consejo médico. Confirmalo con un nutricionista.
 */

import type { CarbBand } from "@/lib/kitchen/types";

export const HEIGHT_CM = 185;
export const DEFAULT_WEIGHT_KG = 106.5;
export const PROTEIN_G_PER_KG = 1.8;
export const MAX_LOSS_KG_PER_WEEK = 0.5;
/** Primera meta, después 90–95 kg. */
export const GOAL_WEIGHT_KG = 100;
export const GOAL_RANGE_KG = { min: 90, max: 95 } as const;
export const MEAL_COUNT = 4;

export interface CarbRange {
  minGPerKg: number;
  maxGPerKg: number;
  label: string;
  hint: string;
}

export const CARB_RANGES: Record<CarbBand, CarbRange> = {
  rest: {
    minGPerKg: 3,
    maxGPerKg: 4,
    label: "Día sin entreno",
    hint: "Plato Harvard clásico: aflojá el hidrato, mantené la proteína y llená de verdura.",
  },
  easy: {
    minGPerKg: 5,
    maxGPerKg: 6,
    label: "Entreno suave",
    hint: "Sumá una porción más de hidrato en el almuerzo o la merienda. La proteína no se toca.",
  },
  quality: {
    minGPerKg: 6,
    maxGPerKg: 7,
    label: "Sesión de calidad",
    hint: "Hidrato fácil de digerir en el almuerzo y la merienda. Poca fibra justo antes de salir.",
  },
  long: {
    minGPerKg: 7,
    maxGPerKg: 8,
    label: "Fondo",
    hint: "7–8 g/kg: con 106,5 kg son ~750–850 g. Es el rango de carga que ya usabas en los fondos.",
  },
  load: {
    minGPerKg: 7,
    maxGPerKg: 10,
    label: "Carga de glucógeno",
    hint: "Protocolo escandinavo, 2–3 días antes de carrera: hasta 10 g/kg. Bajá grasa y fibra, subí sal y agua.",
  },
};

export interface PlateSplit {
  veg: number;
  protein: number;
  carb: number;
}

/** Porcentajes del plato. Suman 100. */
export function plateSplit(band: CarbBand): PlateSplit {
  switch (band) {
    case "rest":
      return { veg: 50, protein: 25, carb: 25 };
    case "easy":
      return { veg: 42, protein: 25, carb: 33 };
    case "quality":
      return { veg: 35, protein: 25, carb: 40 };
    case "long":
      return { veg: 30, protein: 25, carb: 45 };
    case "load":
      return { veg: 25, protein: 23, carb: 52 };
  }
}

export function proteinGrams(weightKg: number): number {
  return Math.round(weightKg * PROTEIN_G_PER_KG);
}

export function proteinPerMeal(weightKg: number): number {
  return Math.round(proteinGrams(weightKg) / MEAL_COUNT);
}

export function carbGrams(weightKg: number, band: CarbBand): { min: number; max: number } {
  const r = CARB_RANGES[band];
  return {
    min: Math.round(weightKg * r.minGPerKg),
    max: Math.round(weightKg * r.maxGPerKg),
  };
}

/** Fecha en la que llegaría a `goalKg` al tope de 0,5 kg/semana. */
export function dateAtMaxPace(weightKg: number, goalKg: number, fromISO: string): string {
  const weeks = Math.max(0, (weightKg - goalKg) / MAX_LOSS_KG_PER_WEEK);
  const d = new Date(fromISO + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + Math.ceil(weeks * 7));
  return d.toISOString().slice(0, 10);
}

/** Ritmo que implicaría llegar a `goalKg` en `goalDate`. Null si la fecha ya pasó o no baja. */
export function paceKgPerWeek(
  weightKg: number,
  goalKg: number,
  goalDate: string,
  fromISO: string,
): number | null {
  const ms = new Date(goalDate + "T12:00:00Z").getTime() - new Date(fromISO + "T12:00:00Z").getTime();
  const weeks = ms / (7 * 86_400_000);
  if (weeks <= 0) return null;
  return (weightKg - goalKg) / weeks;
}

export function fmtKg(n: number): string {
  return n.toLocaleString("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function fmtInt(n: number): string {
  return Math.round(n).toLocaleString("es-AR");
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Lunes de la semana que contiene `iso` (calendario, mediodía UTC para no correr el día). */
export function mondayOf(iso: string): string {
  const d = new Date(iso + "T12:00:00Z");
  const dow = d.getUTCDay(); // 0 domingo
  const diff = dow === 0 ? 6 : dow - 1;
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().slice(0, 10);
}

/** 0 lunes … 6 domingo. */
export function weekdayIndex(iso: string): number {
  const dow = new Date(iso + "T12:00:00Z").getUTCDay();
  return dow === 0 ? 6 : dow - 1;
}

export const WEEKDAY_LABELS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"] as const;

export function formatDayLong(iso: string): string {
  return new Date(iso + "T12:00:00Z").toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}
