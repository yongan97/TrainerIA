import Link from "next/link";
import { ArrowRight, Salad } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getKitchenView } from "@/lib/kitchen/store";
import { carbGrams, fmtInt, proteinGrams } from "@/lib/kitchen/targets";
import { currentMealId, MEAL_META } from "@/lib/kitchen/week";

/** Widget de nutrición en la pantalla Hoy. */
export async function NutritionWidget({ today }: { today: string }) {
  const view = await getKitchenView(today);
  const day = view.days.find((d) => d.fuel.date === today) ?? view.days[0];
  const mealId = currentMealId();
  const meal = day.meals.find((m) => m.meal === mealId) ?? day.meals[0];
  const carbs = carbGrams(view.weightKg, day.fuel.band);
  const protein = proteinGrams(view.weightKg);
  const checked = ["desayuno", "almuerzo", "merienda", "cena"].filter((k) => view.todayLog?.[k as "desayuno"]).length;

  return (
    <Card className="mt-6">
      <CardContent className="py-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Salad className="h-4 w-4" />
            Hoy en la cocina
          </div>
          <Link href="/nutricion" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
            Abrir <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <p className="mt-2 text-lg font-semibold">{MEAL_META[meal.meal].name}: {meal.option.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {day.fuel.training ? day.fuel.sessionLabel : "Sin entreno"} · hidratos {fmtInt(carbs.min)}–{fmtInt(carbs.max)} g · proteína {fmtInt(protein)} g
          {view.todayLog ? ` · comidas ${checked}/4` : ""}
        </p>
      </CardContent>
    </Card>
  );
}
