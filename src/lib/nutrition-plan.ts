/**
 * Plan de alimentación real del usuario (Lic. Floreani Carla, nutricionista).
 * Fuente única del contenido de la vista Nutrición. Transcripción fiel del plan;
 * si el nutri lo actualiza, se edita acá.
 */

export const PLAN_AUTHOR = "Lic. Floreani Carla · Nutricionista";
export const PLAN_PERIOD = "Agosto 2026";

export interface Plate {
  proteina: string[];
  hidratos: string[];
  vegetales: string[];
  hidratosNota?: string;
}

export interface Meal {
  id: "desayuno" | "almuerzo" | "merienda" | "cena";
  name: string;
  time: string;
  /** Hora local (AR) desde la que esta comida es "la que toca". */
  fromHour: number;
  emoji: string;
  base?: string[];
  /** Opciones sueltas (desayuno / merienda). */
  options?: string[];
  /** Estructura de plato (almuerzo / cena). */
  plate?: Plate;
  alternativas?: string[];
  notes?: string[];
  /** Opciones prácticas para llevar/comprar. */
  paraLlevar?: string[];
}

const DESAYUNO_OPTS = [
  "Tostada integral + huevos revueltos (1 entero + 1 clara)",
  "Tostada integral + queso port salut y tomate",
  "Tostada integral + mantequilla de maní (1 cdita)",
  "Tostada integral + ricota magra u hummus",
  "Bowl de granola o cereales (5 cdas) con yogur o leche",
  "Pancakes de avena (6 cdas) + 1 huevo + 1 clara",
  "Porridge de avena (5 cdas + ½ taza de leche)",
];

const PROTEINAS = [
  "1-2 bifes (180-200 g)",
  "1-2 milanesas (carne, pollo o cerdo)",
  "¼ de pollo al horno",
  "2-3 hamburguesas caseras",
  "2-3 rodajas de carne al horno",
  "180-200 g de legumbres cocidas (o veggie burger, seitán, soja, tofu)",
  "2 huevos + 2 claras (omelette con port salut)",
  "180 g de ricota magra",
  "1 lata grande de atún al natural",
  "2-3 filet de pescado (merluza, gatuzo, brótola)",
];

const HIDRATOS = [
  "Arroz",
  "Puré de papa",
  "Papas",
  "Batata (hervida o al horno)",
  "Ensalada de papa y huevo",
  "Fideos",
  "Quinoa",
  "Cous cous",
  "Polenta",
];

const VEGETALES = [
  "Ensalada (tomate, lechuga, rúcula…)",
  "Puré de zapallo",
  "Revuelto de zapallitos",
  "Vegetales al horno",
  "Vegetales al wok",
];

const ALTERNATIVAS_PLATO = [
  "1-2 porciones de tarta (atún, pollo o vegetales con ricota) + ensalada + 3 cdas de hidratos",
  "Pastel de papa",
  "Guiso de lentejas (con papa o batata)",
];

export const MEALS: Meal[] = [
  {
    id: "desayuno",
    name: "Desayuno",
    time: "7:30–8:30 h",
    fromHour: 5,
    emoji: "🍳",
    base: ["Infusión a gusto", "½ taza de leche ó 1 yogur descremado ó 1 licuado de frutas (opcional)"],
    options: DESAYUNO_OPTS,
    notes: [
      "Podés sumar ¼ de palta a las tostadas, y una fruta fresca a cualquier opción.",
      "Ideal romper el ayuno con 1 puñado de frutos secos.",
      "Si entrenás: dividilo en dos → PRE: tostada de pan blanco con miel o dulce de membrillo. POST: tostada con huevos (3 claras) ó pancake.",
    ],
  },
  {
    id: "almuerzo",
    name: "Almuerzo",
    time: "13:00 h",
    fromHour: 11,
    emoji: "🍽️",
    plate: {
      proteina: PROTEINAS,
      hidratos: HIDRATOS,
      vegetales: VEGETALES,
      hidratosNota: "1/3 del plato (~10 cdas)",
    },
    alternativas: ALTERNATIVAS_PLATO,
    notes: ["Ojo con los almuerzos que compramos comida."],
  },
  {
    id: "merienda",
    name: "Merienda",
    time: "17:00–17:30 h",
    fromHour: 15,
    emoji: "🥪",
    base: ["Infusión a gusto", "½ taza de leche ó 1 yogur descremado ó 1 licuado de frutas (opcional)"],
    options: DESAYUNO_OPTS,
    notes: ["⭐ Momento bisagra del día — prestarle atención."],
    paraLlevar: [
      "Sándwich de port salut y tomate",
      "Yogur (Ser Pro) con granola o cereales",
      "Pancake solo o con mantequilla de maní",
      "Barrita de proteína (Kibar, Crudda, Pont, Integra) + banana",
      "Barrita de cereal (Integra, Muecas) + yogur + banana",
    ],
  },
  {
    id: "cena",
    name: "Cena",
    time: "20:30 h",
    fromHour: 19,
    emoji: "🌙",
    plate: {
      proteina: PROTEINAS,
      hidratos: HIDRATOS,
      vegetales: VEGETALES,
      hidratosNota: "1/3 del plato (~8 cdas)",
    },
    alternativas: ALTERNATIVAS_PLATO,
    notes: ["🚴 CENA PRE-FONDO: un buen plato de pastas con salsa muy liviana o aceite de oliva + queso de rallar + 1 pizca de sal."],
  },
];

/** Hora local de Buenos Aires (UTC-3, sin horario de verano). */
export function hourAR(now: Date = new Date()): number {
  return new Date(now.getTime() - 3 * 3600 * 1000).getUTCHours();
}

/** Qué comida "toca" según la hora local. */
export function currentMeal(now: Date = new Date()): Meal {
  const h = hourAR(now);
  let pick = MEALS[0];
  for (const m of MEALS) if (h >= m.fromHour) pick = m;
  return pick;
}

/** Sugerencia concreta y estable dentro del día (rota día a día). */
export function suggestion(meal: Meal, dateISO: string): string[] {
  const seed = Number(dateISO.replace(/-/g, "")) + meal.fromHour;
  const pick = (arr: string[], off: number) => arr[(seed + off) % arr.length];
  if (meal.plate) {
    return [
      pick(meal.plate.proteina, 0),
      pick(meal.plate.hidratos, 3),
      pick(meal.plate.vegetales, 5),
    ];
  }
  return [pick(meal.options ?? [], 0)];
}

/** Combustible durante entrenamientos largos (>60'). Clave para fondos. */
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

export const SNACKS = [
  "Yogur descremado solo o con fruta/granola/cereales (3 cdas)",
  "1 fruta fresca (1 banana por día)",
  "1 barrita de cereal de buena calidad (1 vez/día, no obligatoria)",
  "1 puñado de frutos secos",
  "2-3 dátiles",
  "1 barrita de proteína (Kibar/Integra/Crudda)",
];

export const RECOMMENDATIONS = [
  "Descansar 7-8 h por noche o más; cuidar la calidad (a la cama sin pantallas).",
  "Comer despacio, masticar bien, tardar al menos 20 min.",
  "Moderar aderezos comerciales; probar antes de agregar sal.",
  "Hacer las 4 comidas + colaciones si pasás >4 h sin comer o tenés hambre.",
  "Mantener el orden los fines de semana.",
  "Tomar al menos 1,5 L de agua/día (sin sed, sin boca seca, orina clara por la tarde).",
  "Moderar / evitar el alcohol.",
  "Máximo 3 yemas por día.",
  "Aceite: no más de 1 cda sopera de oliva por ensalada; si sumás palta u aceitunas, elegí UNA (1 cda aceite ó 8 aceitunas ó ¼ palta).",
  "Cocción saludable: evitar frituras y cocinar con mucho aceite.",
];

export const POSTRE =
  "Fruta fresca (evitar banana de postre y fruta como postre de la cena) ó ensalada de fruta (½ taza) ó helado casero de frutas ó postre lácteo/maicena (máx 2 veces/semana) ó 1 cuadradito de chocolate amargo. No es obligatorio.";

export const FREE_MEAL =
  "1 vez por semana: 1 plato de pastas ó 2-3 porciones de pizza ó 2-3 empanadas al horno ó 15-20 piezas de sushi ó 1 hamburguesa. No es obligatorio — somos seres sociales y está bien disfrutar.";

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
