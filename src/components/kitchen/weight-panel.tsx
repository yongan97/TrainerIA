"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  dateAtMaxPace,
  fmtKg,
  GOAL_RANGE_KG,
  MAX_LOSS_KG_PER_WEEK,
  paceKgPerWeek,
} from "@/lib/kitchen/targets";
import type { WeightPoint } from "@/lib/kitchen/store";

export function WeightPanel({
  today,
  weightKg,
  weightSource,
  whoopKg,
  goalKg,
  goalDate,
  goalDateSuggested,
  weights,
  cutAllowed,
  cutReason,
}: {
  today: string;
  weightKg: number;
  weightSource: "whoop" | "manual" | "perfil";
  whoopKg: number | null;
  goalKg: number;
  goalDate: string;
  goalDateSuggested: boolean;
  weights: WeightPoint[];
  cutAllowed: boolean;
  cutReason: string;
}) {
  const router = useRouter();
  const [kg, setKg] = useState(weightKg.toFixed(1));
  const [goal, setGoal] = useState(String(goalKg));
  const [when, setWhen] = useState(goalDate);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const pace = paceKgPerWeek(weightKg, Number(goal) || goalKg, when, today);
  const tooFast = pace != null && pace > MAX_LOSS_KG_PER_WEEK + 0.05;
  const suggested = dateAtMaxPace(weightKg, Number(goal) || goalKg, today);
  const later = dateAtMaxPace(weightKg, (GOAL_RANGE_KG.min + GOAL_RANGE_KG.max) / 2, today);
  const sourceLabel =
    weightSource === "whoop" ? "último Whoop" : weightSource === "manual" ? "pesada manual" : "el peso del perfil (106,5 kg)";

  async function post(body: Record<string, unknown>, ok: string) {
    setSaving(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/nutrition/weight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "No se pudo guardar");
      setMsg(ok);
      router.refresh();
    } catch (e) {
      const raw = e instanceof Error ? e.message : "No se pudo guardar";
      setErr(/supabase|fetch|failed/i.test(raw) ? "No se guardó. Falta Supabase en este entorno." : raw);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Ahora</p>
        <p className="mt-1 text-5xl font-semibold tabular-nums">{fmtKg(weightKg)} <span className="text-2xl font-normal text-muted-foreground">kg</span></p>
        <p className="mt-1 text-base text-muted-foreground">Según {sourceLabel}. 185 cm.</p>
        {whoopKg != null && weightSource !== "whoop" && (
          <p className="mt-1 text-sm text-muted-foreground">Whoop tiene {fmtKg(whoopKg)} kg. La pesada manual de hoy manda para las cuentas.</p>
        )}
        <p className="mt-4 text-base text-foreground/90">{cutReason}</p>
        {!cutAllowed && (
          <p className="mt-2 rounded-xl bg-yellow-400/10 px-3 py-2 text-sm text-yellow-100">
            Esta semana no se recorta, aunque la balanza te tiente.
          </p>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <form
          className="rounded-2xl border border-border bg-card p-5"
          onSubmit={(e) => {
            e.preventDefault();
            post({ date: today, weight_kg: kg }, "Pesada guardada.");
          }}
        >
          <h2 className="text-lg font-semibold">Anotar peso</h2>
          <p className="mt-1 text-sm text-muted-foreground">Manual, de la balanza. Whoop sigue entrando solo con el sync.</p>
          <label className="mt-3 block text-sm text-muted-foreground">
            Kilos
            <input
              inputMode="decimal"
              value={kg}
              onChange={(e) => setKg(e.target.value)}
              className="mt-1 min-h-14 w-full rounded-xl border border-input bg-background px-4 text-2xl"
            />
          </label>
          <button disabled={saving} className="mt-3 min-h-12 rounded-xl bg-primary px-4 text-base font-semibold text-primary-foreground disabled:opacity-50">
            Guardar pesada
          </button>
        </form>

        <form
          className="rounded-2xl border border-border bg-card p-5"
          onSubmit={(e) => {
            e.preventDefault();
            post({ goal_kg: goal, goal_date: when }, "Meta guardada.");
          }}
        >
          <h2 className="text-lg font-semibold">Meta</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Primera parada: 100 kg. Después, {GOAL_RANGE_KG.min}–{GOAL_RANGE_KG.max} kg. Tope {fmtKg(MAX_LOSS_KG_PER_WEEK).replace(",0", "")} kg por semana.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="text-sm text-muted-foreground">
              Kilos
              <input
                inputMode="decimal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="mt-1 min-h-14 w-full rounded-xl border border-input bg-background px-3 text-xl"
              />
            </label>
            <label className="text-sm text-muted-foreground">
              Fecha
              <input
                type="date"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
                className="mt-1 min-h-14 w-full rounded-xl border border-input bg-background px-3 text-base"
              />
            </label>
          </div>
          {goalDateSuggested && (
            <p className="mt-2 text-sm text-muted-foreground">
              La fecha que ves es la del tope de 0,5 kg/semana. Guardala si te cierra.
            </p>
          )}
          {tooFast && (
            <p className="mt-2 text-sm text-yellow-200">
              Esa fecha pide {pace?.toLocaleString("es-AR", { maximumFractionDigits: 2 })} kg por semana. Es más que el tope.
              Al ritmo seguro llegarías el {suggested.split("-").reverse().join("/")}.
            </p>
          )}
          {!tooFast && pace != null && pace > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              Ritmo de esta meta: {pace.toLocaleString("es-AR", { maximumFractionDigits: 2 })} kg/semana.
            </p>
          )}
          <button disabled={saving} className="mt-3 min-h-12 rounded-xl bg-secondary px-4 text-base font-semibold disabled:opacity-50">
            Guardar meta
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Las dos metas</h2>
        <ul className="mt-3 space-y-2 text-base">
          <li>100 kg, al tope de 0,5 kg/semana: alrededor del {fmtDate(suggested)}.</li>
          <li>Después, 90–95 kg: alrededor del {fmtDate(later)}, si seguís al mismo ritmo desde hoy.</li>
        </ul>
        <p className="mt-3 text-sm text-muted-foreground">
          El motivo es W/kg y descargar el cuádriceps y la rodilla. No es un plan clínico.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Historial</h2>
        {weights.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay pesadas. Anotá una, o esperá al próximo sync de Whoop.</p>
        ) : (
          <ul className="space-y-2">
            {weights.slice(0, 21).map((w) => (
              <li key={`${w.date}-${w.source}`} className="flex min-h-12 items-center justify-between rounded-xl border border-border bg-card px-4">
                <span>{fmtDate(w.date)}</span>
                <span className="font-medium tabular-nums">{fmtKg(w.weight_kg)} kg</span>
                <span className="text-sm text-muted-foreground">{w.source === "whoop" ? "Whoop" : "Manual"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      {msg && <p className="text-sm text-primary">{msg}</p>}
      {err && <p className="text-sm text-red-300">{err}</p>}
    </div>
  );
}

function fmtDate(iso: string): string {
  return new Date(iso + "T12:00:00Z").toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
