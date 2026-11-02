"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChefHat } from "lucide-react";
import { groupLabel } from "@/lib/kitchen/meals";
import { carbGrams, fmtInt } from "@/lib/kitchen/targets";
import type { MealId } from "@/lib/kitchen/types";
import { equivalents, MEAL_META, type ResolvedDay } from "@/lib/kitchen/week";
import { cn } from "@/lib/utils";

export function WeekBoard({
  days,
  today,
  weightKg,
}: {
  days: ResolvedDay[];
  today: string;
  weightKg: number;
}) {
  const router = useRouter();
  const initial = Math.max(0, days.findIndex((d) => d.fuel.date === today));
  const [idx, setIdx] = useState(initial);
  const [local, setLocal] = useState(days);
  const [open, setOpen] = useState<MealId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const day = local[idx];

  async function swap(meal: MealId, optionId: string) {
    const prev = local;
    setLocal((curr) =>
      curr.map((d, i) => {
        if (i !== idx) return d;
        return {
          ...d,
          meals: d.meals.map((m) =>
            m.meal === meal
              ? { ...m, option: equivalents(m.option, meal).find((o) => o.id === optionId) ?? m.option, swapped: true }
              : m,
          ),
        };
      }),
    );
    setOpen(null);
    setError(null);
    try {
      const res = await fetch("/api/nutrition/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day: day.fuel.date, meal, option_id: optionId }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "No se pudo guardar");
      router.refresh();
    } catch (e) {
      setLocal(prev);
      setError(friendlySave(e));
    }
  }

  const carbs = carbGrams(weightKg, day.fuel.band);

  return (
    <div>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {local.map((d, i) => (
          <button
            key={d.fuel.date}
            onClick={() => { setIdx(i); setOpen(null); }}
            className={cn(
              "min-h-16 min-w-[5.5rem] rounded-xl border px-3 py-2 text-left",
              i === idx ? "border-primary bg-primary/15" : "border-border bg-card",
            )}
          >
            <span className="block text-base font-semibold">{d.fuel.label.slice(0, 3)}</span>
            <span className="block text-xs text-muted-foreground">
              {d.fuel.training ? d.fuel.band === "rest" ? "Entreno" : labelBand(d.fuel.band) : "Descanso"}
            </span>
          </button>
        ))}
      </div>

      <p className="mb-4 text-base text-muted-foreground">
        {day.fuel.sessionLabel ?? "Sin sesión"} · hidratos del día: {fmtInt(carbs.min)}–{fmtInt(carbs.max)} g.
        Tocá Cambiar para otra opción del mismo tipo.
      </p>
      {error && <p className="mb-3 text-sm text-red-300">{error}</p>}

      <div className="space-y-3">
        {day.meals.map(({ meal, option }) => {
          const alts = equivalents(option, meal);
          const opened = open === meal;
          return (
            <article key={meal} className="rounded-2xl border border-border bg-card p-4 sm:p-5">
              <div className="text-sm text-muted-foreground">
                {MEAL_META[meal].name} · {MEAL_META[meal].time}
              </div>
              <h3 className="mt-1 text-xl font-semibold sm:text-2xl">{option.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{option.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/nutricion/cocina/${option.id}`}
                  className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary px-4 text-base font-semibold text-primary-foreground"
                >
                  <ChefHat className="h-5 w-5" />
                  Cocinar
                </Link>
                <button
                  onClick={() => setOpen(opened ? null : meal)}
                  className="inline-flex min-h-12 items-center rounded-xl border border-border bg-background px-4 text-base font-medium"
                >
                  {opened ? "Cerrar" : "Cambiar"}
                </button>
              </div>
              {opened && (
                <ul className="mt-3 space-y-2">
                  <li className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {groupLabel(option.group)}
                  </li>
                  {alts.map((alt) => (
                    <li key={alt.id}>
                      <button
                        onClick={() => swap(meal, alt.id)}
                        className={cn(
                          "flex min-h-14 w-full items-center rounded-xl border px-4 text-left text-base",
                          alt.id === option.id
                            ? "border-primary bg-primary/10"
                            : "border-border bg-background hover:bg-secondary",
                        )}
                      >
                        <span>
                          <span className="block font-medium">{alt.title}</span>
                          <span className="block text-sm text-muted-foreground">{alt.minutes} min</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function friendlySave(e: unknown): string {
  const raw = e instanceof Error ? e.message : "No se pudo guardar el cambio";
  if (/supabase|fetch|failed/i.test(raw)) return "No se guardó. En este entorno no está Supabase; cuando esté, el cambio queda para la semana.";
  return raw;
}

function labelBand(band: ResolvedDay["fuel"]["band"]): string {
  switch (band) {
    case "easy":
      return "Suave";
    case "quality":
      return "Calidad";
    case "long":
      return "Fondo";
    case "load":
      return "Carga";
    default:
      return "Descanso";
  }
}
