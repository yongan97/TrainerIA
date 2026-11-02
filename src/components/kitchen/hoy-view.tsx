import Link from "next/link";
import { ChefHat, Droplets, Pill, Zap } from "lucide-react";
import { HarvardPlate } from "@/components/kitchen/harvard-plate";
import type { KitchenView } from "@/lib/kitchen/store";
import { INTRA_TRAINING, SUPPLEMENTS } from "@/lib/nutrition-plan";
import { carbGrams, CARB_RANGES, fmtInt, proteinGrams, proteinPerMeal } from "@/lib/kitchen/targets";
import { currentMealId, MEAL_META } from "@/lib/kitchen/week";
import { cn } from "@/lib/utils";

export function HoyView({ view, now = new Date() }: { view: KitchenView; now?: Date }) {
  const day = view.days.find((d) => d.fuel.date === view.today) ?? view.days[0];
  const mealNow = currentMealId(now);
  const protein = proteinGrams(view.weightKg);
  const perMeal = proteinPerMeal(view.weightKg);
  const carbs = carbGrams(view.weightKg, day.fuel.band);
  const range = CARB_RANGES[day.fuel.band];
  const long = day.fuel.minutes >= 60 || day.fuel.band === "long" || day.fuel.band === "load";

  return (
    <div className="space-y-6">
      {view.usingTypicalWeek && (
        <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          Esta semana no hay sesiones cargadas en el plan. Para los hidratos uso tu semana tipo:
          lunes trote, martes corto, miércoles calidad, jueves descanso, viernes calidad, domingo fondo.
          Cuando cargues el mesociclo, manda eso.
        </p>
      )}

      <section className={cn("rounded-2xl border p-5 sm:p-6", bandClass(day.fuel.band))}>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          {day.fuel.training ? "Día de entreno" : "Día sin entreno"}
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          {day.fuel.sessionLabel ?? "Jueves libre, o no hay nada en el plan."}
        </h2>
        <p className="mt-2 text-base text-foreground/90">
          {range.label}: {range.minGPerKg}–{range.maxGPerKg} g/kg de hidrato →{" "}
          <strong>{fmtInt(carbs.min)}–{fmtInt(carbs.max)} g</strong> con {view.weightKg.toLocaleString("es-AR")} kg.
          Proteína fija: <strong>{fmtInt(protein)} g</strong> (1,8 g/kg), unos {fmtInt(perMeal)} g por comida.
        </p>
        {day.fuel.minutes > 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            {day.fuel.minutes} min
            {day.fuel.source === "entrenado" ? " · ya lo hiciste" : day.fuel.source === "plan" ? " · está en el plan" : " · semana tipo"}
            {day.fuel.sport ? ` · ${day.fuel.sport}` : ""}
          </p>
        )}
        <p className="mt-3 text-sm text-foreground/80">{view.cutReason}</p>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <HarvardPlate band={day.fuel.band} grams={{ protein, carbMin: carbs.min, carbMax: carbs.max }} />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Las 4 comidas</h2>
        <p className="text-sm text-muted-foreground">
          Desayuno, almuerzo y cena salen del plan del entrenador. La merienda no está en ese papel:
          es fruta, yogur o pan integral para la tarde, y crece si el día es de entreno.
        </p>
        {day.meals.map(({ meal, option, swapped }) => {
          const meta = MEAL_META[meal];
          const active = meal === mealNow;
          return (
            <article
              key={meal}
              className={cn(
                "rounded-2xl border bg-card p-4 sm:p-5",
                active ? "border-primary/50" : "border-border",
              )}
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="text-2xl font-semibold tracking-tight">{meta.name}</h3>
                <span className="text-base text-muted-foreground">{meta.time}</span>
                {active && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-sm text-primary">Ahora</span>}
                {swapped && <span className="text-sm text-muted-foreground">Cambiada</span>}
              </div>
              <p className="mt-2 text-lg text-foreground">{option.title}</p>
              {option.plate && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {option.plate.protein} · {option.plate.carb} · {option.plate.veg}
                </p>
              )}
              {day.fuel.band !== "rest" && (
                <p className="mt-2 text-sm text-foreground/90">{option.carbBoost}</p>
              )}
              <Link
                href={`/nutricion/cocina/${option.id}`}
                className="mt-4 inline-flex min-h-14 items-center gap-2 rounded-xl bg-primary px-5 text-base font-semibold text-primary-foreground"
              >
                <ChefHat className="h-5 w-5" />
                Cocinar
              </Link>
            </article>
          );
        })}
      </section>

      <section className={cn("rounded-2xl border p-5", long ? "border-primary/40 bg-primary/5" : "border-border bg-card")}>
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Zap className="h-5 w-5 text-primary" />
          Combustible en ruta
          {long && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-sm font-medium text-primary">para hoy</span>}
        </div>
        <p className="mt-2 text-base text-muted-foreground">{INTRA_TRAINING.intro}</p>
        <p className="mt-3 text-base font-medium">{INTRA_TRAINING.perDose}</p>
        <ul className="mt-2 grid gap-1 text-base sm:grid-cols-2">
          {INTRA_TRAINING.options.map((o) => (
            <li key={o} className="text-foreground/90">{o}</li>
          ))}
        </ul>
        <p className="mt-3 flex items-start gap-2 text-base text-sky-300">
          <Droplets className="mt-1 h-4 w-4 shrink-0" />
          {INTRA_TRAINING.drink}
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <Pill className="h-5 w-5 text-primary" />
          Todos los días
        </div>
        <ul className="space-y-3">
          {SUPPLEMENTS.map((s) => (
            <li key={s.name}>
              <p className="text-base font-medium">{s.name}</p>
              <p className="text-base text-foreground/90">{s.dose}</p>
              <p className="text-sm text-muted-foreground">{s.how}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function bandClass(band: KitchenView["days"][number]["fuel"]["band"]): string {
  switch (band) {
    case "rest":
      return "border-border bg-card";
    case "easy":
      return "border-sky-400/30 bg-sky-400/5";
    case "quality":
      return "border-primary/40 bg-primary/5";
    case "long":
      return "border-yellow-400/40 bg-yellow-400/10";
    case "load":
      return "border-orange-400/40 bg-orange-400/10";
  }
}
