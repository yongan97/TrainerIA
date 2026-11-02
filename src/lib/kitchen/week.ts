import { MEAL_BY_ID, optionsFor } from "@/lib/kitchen/meals";
import { SAUCES, SAUCE_BY_ID } from "@/lib/kitchen/sauces";
import type { Cookable, DayFuel, MealId, MealOption, ShoppingLine } from "@/lib/kitchen/types";
import { addDays } from "@/lib/kitchen/targets";

export const MEAL_ORDER: MealId[] = ["desayuno", "almuerzo", "merienda", "cena"];

export const MEAL_META: Record<MealId, { name: string; time: string; fromHour: number }> = {
  desayuno: { name: "Desayuno", time: "7:30–8:30", fromHour: 5 },
  almuerzo: { name: "Almuerzo", time: "13:00", fromHour: 11 },
  merienda: { name: "Merienda", time: "17:00–17:30", fromHour: 15 },
  cena: { name: "Cena", time: "20:30", fromHour: 19 },
};

/** Plantilla lunes→domingo. Los ids son los default; el usuario puede cambiar por equivalentes. */
export const WEEK_TEMPLATE: Record<MealId, string>[] = [
  { desayuno: "des-yogur-avena", almuerzo: "bife-nalga", merienda: "mer-yogur-banana", cena: "lentejas" },
  { desayuno: "des-tostada-palta", almuerzo: "merluza-horno", merienda: "mer-yogur-banana", cena: "tortilla" },
  { desayuno: "des-granola", almuerzo: "cuadril-horno", merienda: "mer-tostada-miel", cena: "salmon-horno" },
  { desayuno: "des-queso", almuerzo: "pollo-salteado", merienda: "mer-fruta-nueces", cena: "atun-rojo" },
  { desayuno: "des-porridge", almuerzo: "garbanzos", merienda: "mer-tostada-miel", cena: "pasta-clara" },
  { desayuno: "des-ricota", almuerzo: "milanesas", merienda: "mer-yogur-banana", cena: "huevos-verdura" },
  { desayuno: "des-bowl", almuerzo: "pollo-horno", merienda: "mer-ricota", cena: "omelette" },
];

export interface ResolvedMeal {
  meal: MealId;
  option: MealOption;
  swapped: boolean;
}

export interface ResolvedDay {
  fuel: DayFuel;
  meals: ResolvedMeal[];
}

/** Hora de Buenos Aires (UTC−3, sin horario de verano). */
export function hourAR(now: Date = new Date()): number {
  return new Date(now.getTime() - 3 * 3600 * 1000).getUTCHours();
}

export function currentMealId(now: Date = new Date()): MealId {
  const h = hourAR(now);
  let pick: MealId = "desayuno";
  for (const id of MEAL_ORDER) if (h >= MEAL_META[id].fromHour) pick = id;
  return pick;
}

export function resolveWeek(
  weekStart: string,
  days: DayFuel[],
  swaps: Record<string, string>,
): ResolvedDay[] {
  return days.map((fuel) => {
    const idx = fuel.weekday;
    const template = WEEK_TEMPLATE[idx];
    const meals: ResolvedMeal[] = MEAL_ORDER.map((meal) => {
      const key = `${fuel.date}:${meal}`;
      const wanted = swaps[key];
      const fallback = MEAL_BY_ID[template[meal]];
      const candidate = wanted ? MEAL_BY_ID[wanted] : undefined;
      const option =
        candidate && candidate.group === fallback.group && candidate.slots.includes(meal)
          ? candidate
          : fallback;
      return { meal, option, swapped: option.id !== fallback.id };
    });
    return { fuel, meals };
  });
}

export function equivalents(option: MealOption, meal: MealId): MealOption[] {
  return optionsFor(meal, option.group);
}

/** Lista de compras de la semana ya resuelta (con los cambios). Agrupa por ingrediente. */
export function shoppingList(days: ResolvedDay[]): ShoppingLine[] {
  const map = new Map<string, ShoppingLine>();
  const add = (ing: { key: string; name: string; qty: number; unit: string; aisle: ShoppingLine["aisle"] }) => {
    // Las claras se compran como huevos. En la receta siguen escritas como claras.
    const line =
      ing.key === "clara" || ing.key === "huevo"
        ? { ...ing, key: "huevo", name: "Huevos" }
        : ing;
    const id = `${line.key}|${line.unit}`;
    const prev = map.get(id);
    if (prev) prev.qty += line.qty;
    else map.set(id, { ...line });
  };

  const sauceIds = new Set<string>();
  for (const day of days) {
    for (const m of day.meals) {
      for (const ing of m.option.ingredients) add(ing);
      if (m.option.sauceId && m.option.sauceId !== "aderezo") sauceIds.add(m.option.sauceId);
    }
  }
  // Una tanda de cada salsa que la semana usa, además del aderezo que ya va en cada plato.
  for (const id of sauceIds) {
    const sauce = SAUCE_BY_ID[id];
    if (!sauce) continue;
    for (const ing of sauce.ingredients) add(ing);
  }

  const order: ShoppingLine["aisle"][] = ["carniceria", "verduleria", "almacen"];
  return [...map.values()].sort((a, b) => {
    const ao = order.indexOf(a.aisle) - order.indexOf(b.aisle);
    if (ao !== 0) return ao;
    return a.name.localeCompare(b.name, "es");
  });
}

export function shoppingKey(line: ShoppingLine): string {
  return `${line.key}|${line.unit}`;
}

export function formatQty(qty: number, unit: string): string {
  if (unit === "g" && qty >= 1000) {
    return `${(qty / 1000).toLocaleString("es-AR", { maximumFractionDigits: 2 })} kg`;
  }
  if (unit === "ml" && qty >= 1000) {
    return `${(qty / 1000).toLocaleString("es-AR", { maximumFractionDigits: 2 })} L`;
  }
  const n = qty >= 10 ? Math.round(qty) : Math.round(qty * 10) / 10;
  const num = n.toLocaleString("es-AR", { maximumFractionDigits: 1 });
  if (unit === "u") return num;
  return `${num} ${unit}`;
}

export const AISLE_LABEL: Record<ShoppingLine["aisle"], string> = {
  carniceria: "Carnicería",
  verduleria: "Verdulería",
  almacen: "Almacén",
};

export function findCookable(id: string): Cookable | null {
  return MEAL_BY_ID[id] ?? SAUCE_BY_ID[id] ?? null;
}

export function isSauce(id: string): boolean {
  return Boolean(SAUCE_BY_ID[id]);
}

export function weekDates(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export { SAUCES };
