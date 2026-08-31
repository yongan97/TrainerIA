"use client";

import { useState } from "react";
import { ChevronDown, Clock, Utensils } from "lucide-react";
import type { Recipe, NutritionSlot } from "@/lib/nutrition";
import type { Meal } from "@/lib/nutrition-plan";
import { cn } from "@/lib/utils";

const SLOT_ACCENT: Record<NutritionSlot, string> = {
  pre: "text-sky-400",
  post: "text-primary",
  rest: "text-yellow-400",
};

/** Grupo de opciones del plato (proteína / hidratos / vegetales). */
function PlateGroup({ title, hint, items, color }: { title: string; hint?: string; items: string[]; color: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline gap-2">
        <span className={cn("text-xs font-semibold uppercase tracking-wide", color)}>{title}</span>
        {hint && <span className="text-[11px] text-muted-foreground/70">{hint}</span>}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((it, i) => (
          <span key={i} className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground/90">
            {it}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Contenido de una comida: plato estructurado u opciones sueltas. */
export function MealBody({ meal }: { meal: Meal }) {
  return (
    <div className="space-y-4 text-sm">
      {meal.base && (
        <div className="flex flex-wrap gap-1.5">
          {meal.base.map((b, i) => (
            <span key={i} className="rounded-md bg-secondary px-2 py-1 text-xs text-muted-foreground">{b}</span>
          ))}
        </div>
      )}

      {meal.plate && (
        <div className="space-y-3">
          <PlateGroup title="1 · Proteína" items={meal.plate.proteina} color="text-primary" />
          <PlateGroup title="2 · Hidratos" hint={meal.plate.hidratosNota} items={meal.plate.hidratos} color="text-yellow-400" />
          <PlateGroup title="3 · Vegetales" hint="1/3 del plato" items={meal.plate.vegetales} color="text-sky-400" />
        </div>
      )}

      {meal.options && (
        <div>
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-primary">Elegí una</div>
          <ul className="space-y-1 text-foreground/90">
            {meal.options.map((o, i) => (
              <li key={i} className="flex gap-1.5"><span className="text-muted-foreground/50">›</span>{o}</li>
            ))}
          </ul>
        </div>
      )}

      {meal.paraLlevar && (
        <div>
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground/60">Para llevar al trabajo</div>
          <div className="flex flex-wrap gap-1.5">
            {meal.paraLlevar.map((o, i) => (
              <span key={i} className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground/90">{o}</span>
            ))}
          </div>
        </div>
      )}

      {meal.alternativas && (
        <div>
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground/60">O bien</div>
          <ul className="space-y-0.5 text-foreground/90">
            {meal.alternativas.map((o, i) => (
              <li key={i} className="flex gap-1.5"><span className="text-muted-foreground/50">›</span>{o}</li>
            ))}
          </ul>
        </div>
      )}

      {meal.notes && (
        <ul className="space-y-1 rounded-md bg-background/50 p-3 text-xs text-muted-foreground">
          {meal.notes.map((n, i) => <li key={i}>{n}</li>)}
        </ul>
      )}
    </div>
  );
}

/** Tarjeta de comida del plan, desplegable. */
export function MealCard({ meal, defaultOpen = false }: { meal: Meal; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cn("rounded-lg border bg-card", defaultOpen ? "border-primary/40" : "border-border")}>
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 p-4 text-left">
        <span className="text-lg">{meal.emoji}</span>
        <span className="flex-1">
          <span className="font-medium text-foreground">{meal.name}</span>
          <span className="ml-2 text-xs text-muted-foreground">{meal.time}</span>
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="border-t border-border px-4 pb-4 pt-3"><MealBody meal={meal} /></div>}
    </div>
  );
}

/** Tarjeta de receta expandible: título + macros visibles, ingredientes/pasos al abrir. */
export function RecipeCard({
  recipe,
  slot,
  defaultOpen = false,
}: {
  recipe: Recipe;
  slot: NutritionSlot;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-border bg-card">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <span className={cn("mt-0.5 shrink-0", SLOT_ACCENT[slot])}>
          <Utensils className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="font-medium text-foreground">{recipe.title}</span>
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {recipe.minutes} min · {recipe.timing}
            </span>
            <span className={SLOT_ACCENT[slot]}>{recipe.macros}</span>
          </span>
        </span>
        <ChevronDown
          className={cn(
            "mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="space-y-3 border-t border-border px-4 pb-4 pt-3 text-sm">
          <p className="text-muted-foreground">{recipe.why}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground/60">
                Ingredientes
              </p>
              <ul className="space-y-0.5 text-foreground/90">
                {recipe.ingredients.map((i, k) => (
                  <li key={k} className="flex gap-1.5">
                    <span className="text-muted-foreground/50">·</span>
                    {i}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground/60">
                Preparación
              </p>
              <ol className="space-y-0.5 text-foreground/90">
                {recipe.steps.map((s, k) => (
                  <li key={k} className="flex gap-1.5">
                    <span className="text-muted-foreground/50">{k + 1}.</span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Sección de un momento (antes/después/descanso) con sus recetas. */
export function RecipeSection({
  slot,
  title,
  subtitle,
  recipes,
  highlight = false,
}: {
  slot: NutritionSlot;
  title: string;
  subtitle: string;
  recipes: Recipe[];
  highlight?: boolean;
}) {
  return (
    <section id={slot} className="scroll-mt-6">
      <div className="mb-3">
        <h2
          className={cn(
            "text-lg font-semibold tracking-tight",
            highlight && SLOT_ACCENT[slot],
          )}
        >
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="space-y-2">
        {recipes.map((r, i) => (
          <RecipeCard
            key={r.title}
            recipe={r}
            slot={slot}
            defaultOpen={highlight && i === 0}
          />
        ))}
      </div>
    </section>
  );
}
