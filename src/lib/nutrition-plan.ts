/**
 * Checklist diario y combustible de entreno.
 * No es un plan de comidas: el menú vive en src/lib/kitchen y sale del
 * plan semanal del entrenador. Proteína, hidratos, intra-entreno, creatina
 * y omega-3 son cuentas de nutrición deportiva para este atleta.
 */

/** Combustible durante entrenamientos largos (>60'). */
export const INTRA_TRAINING = {
  intro:
    "Para entrenamientos de más de 60'. Empezá a las 40-45' y repetí cada 40-45'. Practicá la tolerancia para la carrera.",
  perDose: "30 g de hidratos por toma =",
  options: [
    "1 gel con o sin cafeína (Nutremax, Gu, Chitaka, Ei, Race)",
    "5-8 gomitas (según marca)",
    "30 g de dulce de membrillo",
    "1 fruta mediana",
    "1 barrita de cereal (Cereal Mix)",
    "1 turrón",
    "3-4 dátiles",
    "40 g de pasas de uva",
  ],
  drink: "+ 500 ml de bebida isotónica (casera o comercial, ej. HYDROMAX)",
};

export const SUPPLEMENTS = [
  {
    name: "Creatina (monohidrato)",
    dose: "3-5 g por día, TODOS los días (entrenes o no).",
    how: "En cualquier momento; absorbe mejor con algo dulce. Ej: diluida en agua junto al desayuno. Marcas: ENA o Matter.",
  },
  {
    name: "Omega-3",
    dose: "Todos los días, cerca de las comidas.",
    how: "La cantidad de cápsulas depende de la marca. Marcas: Regulip 1000, Star, Innova Naturals (farmacias o Mercado Libre).",
  },
];

// ————— Adherencia diaria (checklist) —————

export interface NutritionLog {
  date: string;
  desayuno: boolean;
  almuerzo: boolean;
  merienda: boolean;
  cena: boolean;
  creatina: boolean;
  omega3: boolean;
  water_ml: number;
  notes: string | null;
}

export const WATER_GOAL_ML = 1500;

export const CHECKLIST_ITEMS = [
  { key: "desayuno", label: "Desayuno", group: "comidas" },
  { key: "almuerzo", label: "Almuerzo", group: "comidas" },
  { key: "merienda", label: "Merienda", group: "comidas" },
  { key: "cena", label: "Cena", group: "comidas" },
  { key: "creatina", label: "Creatina", group: "suplementos" },
  { key: "omega3", label: "Omega-3", group: "suplementos" },
] as const;

export type ChecklistKey = (typeof CHECKLIST_ITEMS)[number]["key"];

/** Puntaje 0-1 de un día: 6 ítems + agua (7 en total). */
export function dayScore(log: Partial<NutritionLog> | null | undefined): number {
  if (!log) return 0;
  let done = 0;
  for (const it of CHECKLIST_ITEMS) if (log[it.key]) done++;
  if ((log.water_ml ?? 0) >= WATER_GOAL_ML) done++;
  return done / (CHECKLIST_ITEMS.length + 1);
}

/** Un día "cuenta" para la racha si cumplió al menos el 70%. */
export const STREAK_THRESHOLD = 0.7;

/** Racha de días consecutivos (hacia atrás desde hoy) que superan el umbral. */
export function currentStreak(logs: NutritionLog[], today: string): number {
  const byDate = new Map(logs.map((l) => [l.date, l]));
  let streak = 0;
  const d = new Date(today + "T00:00:00");
  // Si hoy todavía no llegó al umbral, la racha se cuenta desde ayer (día en curso).
  for (let i = 0; i < 365; i++) {
    const key = d.toISOString().slice(0, 10);
    const ok = dayScore(byDate.get(key)) >= STREAK_THRESHOLD;
    if (ok) streak++;
    else if (i > 0) break; // corta, salvo que sea el día en curso
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return streak;
}

/** Adherencia promedio (0-1) de los últimos N días con registro. */
export function adherence(logs: NutritionLog[], days: number, today: string): number | null {
  const start = new Date(new Date(today + "T00:00:00").getTime() - (days - 1) * 86_400_000);
  const inRange = logs.filter((l) => new Date(l.date + "T00:00:00") >= start);
  if (!inRange.length) return null;
  return inRange.reduce((s, l) => s + dayScore(l), 0) / days;
}
