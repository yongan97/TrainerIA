"use client";

import { useState } from "react";
import { ChevronDown, Clock, Utensils } from "lucide-react";
import type { Recipe, NutritionSlot } from "@/lib/nutrition";
import { cn } from "@/lib/utils";

const SLOT_ACCENT: Record<NutritionSlot, string> = {
  pre: "text-sky-400",
  post: "text-primary",
  rest: "text-yellow-400",
};

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
