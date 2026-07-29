import type { SportId } from "@/lib/sports/registry";

/**
 * Módulo de nutrición. Biblioteca de recetas/ideas (rápidas-intermedias, con
 * ingredientes accesibles en Buenos Aires) organizada por momento — antes /
 * después / días sin entrenar — más un motor contextual que elige el foco del
 * día según lo que entrenaste y cómo venís de recuperación.
 *
 * Multideporte: no asume "correr". El foco se decide por carga (strain/duración)
 * y recovery, no por el deporte.
 */

export type NutritionSlot = "pre" | "post" | "rest";

export interface Recipe {
  title: string;
  timing: string; // cuándo comerla
  minutes: number; // tiempo de preparación
  macros: string; // etiqueta de macros dominantes
  ingredients: string[];
  steps: string[];
  why: string; // por qué en este momento
  tags?: string[];
}

/** ANTES de entrenar: carbohidrato accesible, poca grasa/fibra, algo de proteína. */
export const PRE: Recipe[] = [
  {
    title: "Avena con banana y miel",
    timing: "45-60 min antes",
    minutes: 6,
    macros: "Carbo alto · proteína media",
    ingredients: [
      "1/2 taza de avena",
      "1 banana pisada",
      "1 cda de miel",
      "Leche o bebida vegetal",
      "Opcional: 1 cdita de mantequilla de maní",
    ],
    steps: [
      "Calentá la avena con la leche 2-3 min (microondas o cacerola).",
      "Sumá la banana pisada y la miel, mezclá.",
      "Si vas a entrenar fuerte, agregá la mantequilla de maní.",
    ],
    why: "Carbohidrato de digestión media que te deja energía estable sin caer pesado. El clásico previo a una sesión.",
    tags: ["pre-largo", "pre-bici"],
  },
  {
    title: "Tostadas con miel o mermelada + café/mate",
    timing: "30-45 min antes",
    minutes: 4,
    macros: "Carbo rápido",
    ingredients: [
      "2 rebanadas de pan (lactal o de campo)",
      "Miel, mermelada o dulce de membrillo",
      "Café o mate",
    ],
    steps: [
      "Tostá el pan.",
      "Untá con miel/mermelada.",
      "Acompañá con café o mate para el envión de cafeína.",
    ],
    why: "Carbohidrato rápido y liviano para entrenos tempranos cuando no querés cocinar ni comer pesado.",
    tags: ["pre-rápido", "mañana"],
  },
  {
    title: "Yogur con banana, avena y pasas",
    timing: "60-90 min antes",
    minutes: 3,
    macros: "Carbo + proteína",
    ingredients: [
      "1 yogur natural o descremado",
      "1 banana en rodajas",
      "2 cdas de avena",
      "Puñado de pasas de uva o dátiles",
    ],
    steps: [
      "Mezclá todo en un bowl.",
      "Comelo con tiempo para que baje bien antes de arrancar.",
    ],
    why: "Combina carbohidrato con algo de proteína; ideal cuando tenés margen de una hora larga antes de entrenar.",
    tags: ["pre-suave"],
  },
  {
    title: "Snack pre-carrera: banana + dátiles",
    timing: "15-30 min antes",
    minutes: 1,
    macros: "Carbo rápido",
    ingredients: ["1 banana", "3-4 dátiles o un puñado de pasas", "Agua"],
    steps: ["Comé la banana y los dátiles justo antes de salir."],
    why: "Energía de acción rápida, cero fibra pesada. Perfecto si entrenás apenas te levantás.",
    tags: ["pre-rápido", "pre-carrera"],
  },
];

/** DESPUÉS de entrenar: proteína (20-30 g) + carbohidrato en los primeros 30-60 min. */
export const POST: Recipe[] = [
  {
    title: "Licuado recuperador",
    timing: "Primeros 30 min",
    minutes: 4,
    macros: "Proteína + carbo (líquido)",
    ingredients: [
      "1 banana",
      "1 taza de leche o bebida vegetal",
      "3 cdas de avena",
      "1 cda de mantequilla de maní",
      "1 cdita de cacao amargo y/o miel",
    ],
    steps: ["Licuá todo 30 seg.", "Tomalo apenas terminás de entrenar."],
    why: "Cuando venís vaciado y sin ganas de cocinar: repone glucógeno y arranca la reparación muscular en formato líquido y fácil de bajar.",
    tags: ["post-fuerte", "rápido"],
  },
  {
    title: "Revuelto de huevos con palta y pan",
    timing: "Dentro de la 1ª hora",
    minutes: 10,
    macros: "Proteína alta · grasa buena",
    ingredients: [
      "2-3 huevos",
      "1/2 palta",
      "2 rebanadas de pan integral",
      "Sal, pimienta, aceite de oliva",
    ],
    steps: [
      "Revolvé los huevos a fuego medio con un chorrito de aceite.",
      "Tostá el pan y pisá la palta encima.",
      "Serví los huevos sobre el pan.",
    ],
    why: "Proteína completa del huevo + carbo del pan + grasa saludable de la palta. Comida de recuperación redonda y rápida.",
    tags: ["post", "rápido"],
  },
  {
    title: "Bowl de arroz con atún y huevo",
    timing: "Dentro de 1-2 h",
    minutes: 15,
    macros: "Carbo + proteína",
    ingredients: [
      "1 taza de arroz cocido",
      "1 lata de atún al natural",
      "1 huevo duro",
      "1/2 palta, tomate",
      "Aceite de oliva, limón",
    ],
    steps: [
      "Sobre el arroz tibio sumá el atún escurrido.",
      "Agregá el huevo duro en mitades, la palta y el tomate.",
      "Condimentá con aceite de oliva y limón.",
    ],
    why: "Rellena glucógeno con el arroz y aporta proteína magra. Se arma en minutos si tenés arroz cocido de antes.",
    tags: ["post", "completo"],
  },
  {
    title: "Milanesa de pollo al horno con puré de batata",
    timing: "Comida post-sesión fuerte",
    minutes: 30,
    macros: "Proteína alta · carbo",
    ingredients: [
      "2 milanesas de pollo",
      "2 batatas",
      "Pan rallado, 1 huevo",
      "Aceite de oliva, sal",
    ],
    steps: [
      "Pasá el pollo por huevo y pan rallado; horneá 20-25 min girando a mitad.",
      "Herví la batata y pisála con un chorrito de aceite de oliva.",
      "Serví juntos.",
    ],
    why: "Comida completa para después de un entreno duro o largo: mucha proteína para reparar y batata para reponer energía.",
    tags: ["post-fuerte", "intermedia"],
  },
  {
    title: "Wrap de pollo con queso y vegetales",
    timing: "Dentro de 1-2 h",
    minutes: 12,
    macros: "Proteína + carbo",
    ingredients: [
      "1-2 tortillas de trigo",
      "Pechuga de pollo grillada en tiras",
      "Queso, hojas verdes, tomate",
      "Yogur o mostaza para untar",
    ],
    steps: [
      "Calentá la tortilla.",
      "Rellená con el pollo, el queso y los vegetales.",
      "Enrollá y listo.",
    ],
    why: "Práctico y transportable; buena relación proteína/carbo para recuperar sin cocinar mucho.",
    tags: ["post", "rápido"],
  },
];

/** DÍAS SIN ENTRENAR: mantenimiento, proteína para reparar, antiinflamatorios, más verdura. */
export const REST: Recipe[] = [
  {
    title: "Salmón o caballa con vegetales asados",
    timing: "Almuerzo o cena",
    minutes: 25,
    macros: "Proteína · omega-3 (antiinflamatorio)",
    ingredients: [
      "1 filete de salmón o caballa",
      "Zucchini, morrón, cebolla, brócoli",
      "Aceite de oliva, limón, sal",
    ],
    steps: [
      "Cortá los vegetales, condimentá y horneá 20 min.",
      "Sumá el pescado los últimos 10-12 min.",
      "Terminá con limón.",
    ],
    why: "El omega-3 del pescado azul ayuda a bajar la inflamación — útil para recuperar cuádriceps y gemelo. Día de descanso = momento de reparar.",
    tags: ["antiinflamatorio", "rehab"],
  },
  {
    title: "Ensalada completa de proteína",
    timing: "Almuerzo",
    minutes: 12,
    macros: "Proteína · fibra · grasa buena",
    ingredients: [
      "Hojas verdes (rúcula, espinaca, mix)",
      "Pollo o atún o 2 huevos duros",
      "Palta, tomate, zanahoria",
      "Semillas (girasol, chía), aceite de oliva",
    ],
    steps: [
      "Armá la base de hojas.",
      "Sumá la proteína elegida y los vegetales.",
      "Coroná con semillas y aceite de oliva.",
    ],
    why: "Comida liviana pero con proteína suficiente para mantener músculo en un día sin carga. Las semillas suman omega-3.",
    tags: ["liviano"],
  },
  {
    title: "Tortilla de verduras al horno",
    timing: "Almuerzo o cena",
    minutes: 25,
    macros: "Proteína · vegetales",
    ingredients: [
      "4 huevos",
      "Espinaca, cebolla, zapallito",
      "Queso rallado, sal",
    ],
    steps: [
      "Salteá las verduras 5 min.",
      "Batí los huevos, mezclá con las verduras y el queso.",
      "Horneá en fuente 15-18 min hasta que cuaje.",
    ],
    why: "Proteína del huevo + carga de vegetales, bajo en carbohidrato para un día de menor gasto. Rinde para dos comidas.",
    tags: ["liviano", "batch"],
  },
  {
    title: "Guiso liviano de lentejas",
    timing: "Cena",
    minutes: 30,
    macros: "Proteína vegetal · hierro · carbo",
    ingredients: [
      "1 taza de lentejas",
      "Cebolla, zanahoria, morrón, tomate",
      "Caldo, laurel, aceite de oliva",
    ],
    steps: [
      "Rehogá las verduras.",
      "Sumá las lentejas y el caldo; cociná 20-25 min.",
      "Ajustá sal y serví.",
    ],
    why: "Legumbre con hierro y proteína vegetal; reconforta sin ser pesada. Buena para reponer en un día tranquilo.",
    tags: ["invierno"],
  },
];

export const LIBRARY: Record<NutritionSlot, Recipe[]> = { pre: PRE, post: POST, rest: REST };

// ————— Motor contextual —————

export interface NutritionContext {
  alreadyTrained: boolean;
  todayStrain: number | null; // strain de Whoop del día (o de la actividad)
  todaySport: SportId | string | null;
  todayMinutes: number | null;
  recovery: number | null;
  plannedHardAhead: boolean; // sesión dura hoy (aún no hecha) o mañana
}

export interface NutritionFocus {
  slot: NutritionSlot;
  title: string;
  headline: string;
  detail: string;
  hydration: string | null;
}

const HARD_STRAIN = 14; // umbral de sesión exigente en la escala de Whoop

/** Decide el foco nutricional del día a partir del contexto de entrenamiento. */
export function decideFocus(ctx: NutritionContext): NutritionFocus {
  const hardToday =
    (ctx.todayStrain != null && ctx.todayStrain >= HARD_STRAIN) ||
    (ctx.todayMinutes != null && ctx.todayMinutes >= 90);

  // 1) Ya entrenaste hoy → prioridad recuperación.
  if (ctx.alreadyTrained) {
    const hydration =
      hardToday
        ? "Sesión larga/intensa: reponé líquidos con agua + sal (una pizca) y sumá potasio (banana). Sobre todo si sudaste mucho."
        : null;
    return {
      slot: "post",
      title: hardToday ? "Hoy: recuperación fuerte" : "Hoy: recuperación",
      headline: hardToday
        ? "Entrenaste fuerte. Ventana de recuperación abierta."
        : "Ya entrenaste. Toca reponer.",
      detail: hardToday
        ? "Apuntá a 25-30 g de proteína + buena dosis de carbohidrato en los próximos 60 min para reparar músculo y rellenar glucógeno. Si venís de una sesión que te cargó la pierna, el pescado azul o las semillas suman antiinflamatorios."
        : "Una comida con proteína y algo de carbohidrato en la próxima hora alcanza para recuperar bien una sesión moderada.",
      hydration,
    };
  }

  // 2) No entrenaste todavía pero hay sesión dura por delante → carga previa.
  if (ctx.plannedHardAhead) {
    return {
      slot: "pre",
      title: "Hoy: carga previa",
      headline: "Tenés sesión exigente por delante.",
      detail:
        "Priorizá carbohidrato de fácil digestión 1-3 h antes, con poca grasa y fibra para no caer pesado. Si es a primera hora, algo rápido (banana + miel) 30 min antes.",
      hydration: "Llegá bien hidratado: agua durante el día, no solo antes de arrancar.",
    };
  }

  // 3) Día sin entrenar → mantenimiento y reparación.
  const lowRecovery = ctx.recovery != null && ctx.recovery < 50;
  return {
    slot: "rest",
    title: "Hoy: día de mantenimiento",
    headline: lowRecovery
      ? "Día sin entrenar y recovery bajo: momento de reparar."
      : "Día sin entrenar: mantené el músculo, aflojá el carbo.",
    detail: lowRecovery
      ? "Con la recuperación baja, cargá proteína para reparar y sumá antiinflamatorios (pescado azul, semillas, verduras de hoja, frutos rojos). Bajá un poco el carbohidrato respecto de un día de entreno."
      : "Sin carga hoy, no necesitás tanto carbohidrato. Mantené la proteína alta para conservar músculo y llená el plato de vegetales. Buen día para pescado o legumbres.",
    hydration: null,
  };
}
