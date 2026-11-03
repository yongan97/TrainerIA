"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { AISLE_LABEL, formatQty, shoppingKey } from "@/lib/kitchen/week";
import type { ShoppingLine } from "@/lib/kitchen/types";
import { cn } from "@/lib/utils";

const ORDER: ShoppingLine["aisle"][] = ["carniceria", "verduleria", "almacen"];

export function ShoppingList({
  lines,
  checks,
  weekStart,
}: {
  lines: ShoppingLine[];
  checks: string[];
  weekStart: string;
}) {
  const [on, setOn] = useState(() => new Set(checks));
  const [error, setError] = useState<string | null>(null);
  const done = lines.filter((l) => on.has(shoppingKey(l))).length;

  async function toggle(line: ShoppingLine) {
    const key = shoppingKey(line);
    const next = !on.has(key);
    setOn((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(key);
      else copy.delete(key);
      return copy;
    });
    setError(null);
    try {
      const res = await fetch("/api/nutrition/shopping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ week_start: weekStart, item_key: key, checked: next }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "No se pudo guardar");
    } catch (e) {
      setOn((prev) => {
        const copy = new Set(prev);
        if (next) copy.delete(key);
        else copy.add(key);
        return copy;
      });
      const raw = e instanceof Error ? e.message : "No se pudo guardar";
      setError(/supabase|fetch|failed/i.test(raw) ? "No se guardó el tilde. Falta Supabase en este entorno." : raw);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-end justify-between gap-3">
        <p className="text-base text-muted-foreground">
          Sale de las comidas de esta semana, con los cambios que hayas hecho. El pescado está en carnicería.
        </p>
        <p className="shrink-0 text-lg font-semibold tabular-nums">
          {done}/{lines.length}
        </p>
      </div>
      {error && <p className="mb-3 text-sm text-red-300">{error}</p>}
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-secondary">
        <div className="h-full bg-primary" style={{ width: `${lines.length ? (done / lines.length) * 100 : 0}%` }} />
      </div>
      {ORDER.map((aisle) => {
        const items = lines.filter((l) => l.aisle === aisle);
        if (!items.length) return null;
        return (
          <section key={aisle} className="mb-6">
            <h2 className="mb-2 text-xl font-semibold">
              {AISLE_LABEL[aisle]}
              {aisle === "carniceria" && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">carne y pescado</span>
              )}
            </h2>
            <ul className="space-y-2">
              {items.map((line) => {
                const key = shoppingKey(line);
                const checked = on.has(key);
                return (
                  <li key={key}>
                    <button
                      onClick={() => toggle(line)}
                      className={cn(
                        "flex min-h-14 w-full items-center gap-3 rounded-xl border px-4 text-left text-lg",
                        checked ? "border-primary/30 bg-primary/10 text-muted-foreground" : "border-border bg-card",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border",
                          checked ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40",
                        )}
                      >
                        {checked && <Check className="h-4 w-4" />}
                      </span>
                      <span className={cn("flex-1", checked && "line-through")}>{line.name}</span>
                      <span className="tabular-nums text-base text-muted-foreground">{formatQty(line.qty, line.unit)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
      <p className="text-sm text-muted-foreground">
        Las claras de las recetas se suman como huevos.
        Alérgico a mariscos: en esta lista no hay langostinos, mejillones, sardinas ni atún de lata.
      </p>
    </div>
  );
}
