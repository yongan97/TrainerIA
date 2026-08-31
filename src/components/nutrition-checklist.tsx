"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Droplets, Flame, Plus, Minus } from "lucide-react";
import {
  CHECKLIST_ITEMS, WATER_GOAL_ML, dayScore,
  type ChecklistKey, type NutritionLog,
} from "@/lib/nutrition-plan";
import { cn } from "@/lib/utils";

const GLASS_ML = 250;

/**
 * Checklist diario del plan: comidas, suplementos y agua.
 * Optimista (marca al toque) y persiste en /api/nutrition.
 */
export function NutritionChecklist({
  date, initial, streak, adherence7,
}: {
  date: string;
  initial: NutritionLog | null;
  streak: number;
  adherence7: number | null;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [log, setLog] = useState<Partial<NutritionLog>>(initial ?? { date });

  async function save(patch: Partial<NutritionLog>) {
    const next = { ...log, ...patch };
    setLog(next); // optimista
    try {
      await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, ...patch }),
      });
      startTransition(() => router.refresh());
    } catch {
      // si falla, el refresh siguiente lo corrige
    }
  }

  const water = log.water_ml ?? 0;
  const score = dayScore(log);
  const pct = Math.round(score * 100);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      {/* Encabezado: progreso + racha */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-foreground">Checklist de hoy</div>
          <div className="text-xs text-muted-foreground">
            {pct}% del plan{adherence7 != null && ` · ${Math.round(adherence7 * 100)}% últimos 7 días`}
          </div>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-sm font-semibold text-primary">
            <Flame className="h-4 w-4" />
            {streak} {streak === 1 ? "día" : "días"}
          </div>
        )}
      </div>

      {/* Barra de progreso */}
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>

      {/* Ítems */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {CHECKLIST_ITEMS.map((it) => {
          const on = Boolean(log[it.key as ChecklistKey]);
          return (
            <button
              key={it.key}
              onClick={() => save({ [it.key]: !on } as Partial<NutritionLog>)}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                on
                  ? "border-primary/40 bg-primary/10 text-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-secondary/60",
              )}
            >
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                  on ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40",
                )}
              >
                {on && <Check className="h-3 w-3" />}
              </span>
              {it.label}
            </button>
          );
        })}
      </div>

      {/* Agua */}
      <div className="mt-3 flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
        <Droplets className={cn("h-4 w-4 shrink-0", water >= WATER_GOAL_ML ? "text-sky-400" : "text-muted-foreground")} />
        <div className="flex-1 text-sm">
          <span className="text-foreground">{(water / 1000).toFixed(2).replace(/0$/, "")} L</span>
          <span className="text-muted-foreground"> / {WATER_GOAL_ML / 1000} L</span>
        </div>
        <button
          onClick={() => save({ water_ml: Math.max(0, water - GLASS_ML) })}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-secondary"
          aria-label="Quitar un vaso"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => save({ water_ml: water + GLASS_ML })}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-secondary"
          aria-label="Sumar un vaso"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
