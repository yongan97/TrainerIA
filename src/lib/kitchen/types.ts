/** Tipos de la app de cocina. Puros: se pueden importar desde el cliente. */

export type MealId = "desayuno" | "almuerzo" | "merienda" | "cena";

export type Aisle = "carniceria" | "verduleria" | "almacen";

export type SwapGroup =
  | "desayuno"
  | "merienda"
  | "carne"
  | "pollo"
  | "pescado"
  | "legumbre"
  | "huevo";

export type CarbBand = "rest" | "easy" | "quality" | "long" | "load";

export interface Ingredient {
  key: string;
  name: string;
  qty: number;
  unit: string;
  aisle: Aisle;
}

export interface CookStep {
  text: string;
  /** Segundos del timer de este paso, si hace falta esperar. */
  seconds?: number;
  timerLabel?: string;
}

export interface Cookable {
  id: string;
  title: string;
  minutes: number;
  summary: string;
  ingredients: Ingredient[];
  steps: CookStep[];
}

export interface MealOption extends Cookable {
  meal: MealId;
  /** En qué comidas se puede usar como reemplazo. */
  slots: MealId[];
  group: SwapGroup;
  /** Qué va en cada parte del plato. Desayuno/merienda pueden ir vacíos. */
  plate: { protein: string; carb: string; veg: string } | null;
  sauceId?: string;
  /** Hidrato que se agranda en día de entreno. */
  carbBoost: string;
}

export interface Sauce extends Cookable {
  /** Para qué sirve, en una línea. */
  use: string;
  /** Se prepara una tanda y rinde varios días. */
  keeps: string;
}

export interface SessionLite {
  date: string;
  sport: string | null;
  type: string | null;
  minutes: number;
  codigo: string | null;
}

export interface DayFuel {
  date: string;
  weekday: number; // 0 lunes … 6 domingo
  label: string;
  training: boolean;
  band: CarbBand;
  minutes: number;
  sessionLabel: string | null;
  sport: string | null;
  /** De dónde salió: plan real, lo ya entrenado, o la semana tipo. */
  source: "plan" | "entrenado" | "tipica" | "descanso";
  cutNote: string | null;
}

export interface ShoppingLine {
  key: string;
  name: string;
  qty: number;
  unit: string;
  aisle: Aisle;
}
