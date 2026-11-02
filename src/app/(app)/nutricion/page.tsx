import { HeartPulse, Info } from "lucide-react";
import { HoyView } from "@/components/kitchen/hoy-view";
import { NutritionChecklist } from "@/components/nutrition-checklist";
import { MealCard, RecipeSection } from "@/components/nutrition";
import { getKitchenView } from "@/lib/kitchen/store";
import { getNutritionContext, getNutritionLogs, getRecovery } from "@/lib/data";
import { LIBRARY, decideFocus, type NutritionSlot } from "@/lib/nutrition";
import {
  MEALS, SNACKS, RECOMMENDATIONS, POSTRE, FREE_MEAL, PLAN_AUTHOR,
  dayScore, type NutritionLog,
} from "@/lib/nutrition-plan";

export const dynamic = "force-dynamic";

const SLOT_META: Record<NutritionSlot, { title: string; subtitle: string }> = {
  pre: { title: "Antes de entrenar", subtitle: "Carbohidrato de fácil digestión, poca grasa y fibra." },
  post: { title: "Después de entrenar", subtitle: "Proteína + carbohidrato en los primeros 30-60 min." },
  rest: { title: "Días sin entrenar", subtitle: "Mantené proteína, aflojá el carbohidrato." },
};

export default async function NutricionPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [view, ctx, recovery, logs] = await Promise.all([
    getKitchenView(today),
    getNutritionContext(today),
    getRecovery(60),
    getNutritionLogs(60),
  ]);
  const focus = decideFocus(ctx);

  return (
    <div className="space-y-6">
      {!view.configured && (
        <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          Sin Supabase los cambios no se guardan. El menú de la semana igual está listo para cocinar.
        </p>
      )}
      <HoyView view={view} />
      <NutritionChecklist
        date={today}
        initial={view.todayLog}
        streak={view.streak}
        adherence7={view.adherence7}
        large
      />
      <div className="rounded-2xl border border-border bg-card/50 p-5">
        <div className="flex items-center gap-2 text-base font-medium">
          <HeartPulse className="h-4 w-4 text-primary" />
          Cuádriceps y rodilla
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          El omega-3 del plan ayuda con la inflamación. La proteína repartida en las 4 comidas repara lo que cargaste.
          Bajar hacia 100 kg —y después a 90–95— descarga la pierna. Tope 0,5 kg por semana, y nada de recorte en semana de carga o de carrera.
        </p>
      </div>

      <details className="rounded-2xl border border-border bg-card/40 p-5">
        <summary className="cursor-pointer text-base font-medium">
          Plan original de {PLAN_AUTHOR} y recetas sueltas
        </summary>
        <p className="mt-2 text-sm text-muted-foreground">
          {focus.headline} {focus.detail}
        </p>
        <div className="mt-4 space-y-2">
          {MEALS.map((m) => (
            <MealCard key={m.id} meal={m} />
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Postre (opcional): {POSTRE}</p>
        <p className="mt-2 text-sm text-muted-foreground">{FREE_MEAL}</p>
        <ul className="mt-3 space-y-1 text-sm text-foreground/90">
          {SNACKS.map((s) => <li key={s}>{s}</li>)}
        </ul>
        <div className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <ul className="space-y-1">
            {RECOMMENDATIONS.map((r) => <li key={r}>{r}</li>)}
          </ul>
        </div>
        <div className="mt-6 space-y-8">
          {(["pre", "post", "rest"] as NutritionSlot[]).map((slot) => (
            <RecipeSection
              key={slot}
              slot={slot}
              title={SLOT_META[slot].title}
              subtitle={SLOT_META[slot].subtitle}
              recipes={LIBRARY[slot]}
              highlight={slot === focus.slot}
            />
          ))}
        </div>
        <AdherenceNote logs={logs} recovery={recovery} />
      </details>
    </div>
  );
}

/** El cruce real usa los logs de los últimos 60 días, no solo el de hoy. */
function AdherenceNote({
  logs,
  recovery,
}: {
  logs: NutritionLog[];
  recovery: { date: string; recovery_score: number | null }[];
}) {
  const text = adherenceVsRecovery(logs, recovery);
  if (!text) return null;
  return <p className="mt-4 text-sm text-foreground/90">{text}</p>;
}

function adherenceVsRecovery(
  logs: NutritionLog[],
  recovery: { date: string; recovery_score: number | null }[],
): string | null {
  const recByDate = new Map(recovery.map((r) => [r.date, r.recovery_score]));
  const good: number[] = [];
  const bad: number[] = [];
  for (const l of logs) {
    const next = new Date(new Date(l.date + "T00:00:00").getTime() + 86_400_000).toISOString().slice(0, 10);
    const rec = recByDate.get(next);
    if (rec == null) continue;
    (dayScore(l) >= 0.7 ? good : bad).push(rec);
  }
  if (good.length < 3 || bad.length < 3) return null;
  const avg = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
  const g = Math.round(avg(good));
  const b = Math.round(avg(bad));
  if (g - b < 3) return null;
  return `Los días que cumplís el plan, tu recovery del día siguiente promedia ${g}% — contra ${b}% cuando no.`;
}
