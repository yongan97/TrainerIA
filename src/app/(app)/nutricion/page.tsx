import { Droplets, Sparkles, HeartPulse, Zap, Pill, Apple, Info, PartyPopper, TrendingUp } from "lucide-react";
import { SetupNotice } from "@/components/ui/setup-notice";
import { RecipeSection, MealCard } from "@/components/nutrition";
import { isConfigured, getNutritionContext, getNutritionLogs, getRecovery } from "@/lib/data";
import { LIBRARY, decideFocus, type NutritionSlot } from "@/lib/nutrition";
import {
  MEALS, INTRA_TRAINING, SUPPLEMENTS, SNACKS, RECOMMENDATIONS, POSTRE, FREE_MEAL,
  PLAN_AUTHOR, PLAN_PERIOD,
  currentStreak, adherence, dayScore, type NutritionLog,
} from "@/lib/nutrition-plan";
import { NutritionChecklist } from "@/components/nutrition-checklist";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const SLOT_META: Record<NutritionSlot, { title: string; subtitle: string }> = {
  pre: { title: "Antes de entrenar", subtitle: "Carbohidrato de fácil digestión, poca grasa y fibra." },
  post: { title: "Después de entrenar", subtitle: "Proteína + carbohidrato en los primeros 30-60 min." },
  rest: { title: "Días sin entrenar", subtitle: "Mantené proteína, aflojá el carbohidrato, sumá antiinflamatorios." },
};
const ACCENT: Record<NutritionSlot, string> = {
  pre: "border-sky-400/30 bg-sky-400/5",
  post: "border-primary/30 bg-primary/5",
  rest: "border-yellow-400/30 bg-yellow-400/5",
};

export default async function NutricionPage() {
  if (!isConfigured()) {
    return (
      <Page>
        <SetupNotice title="Falta configurar el entorno" body="Configurá Supabase para ver la nutrición contextual." />
      </Page>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const [ctx, logs, recovery] = await Promise.all([
    getNutritionContext(today),
    getNutritionLogs(60),
    getRecovery(60),
  ]);
  const focus = decideFocus(ctx);
  const todayLog = logs.find((l) => l.date === today) ?? null;
  const streak = currentStreak(logs, today);
  const adh7 = adherence(logs, 7, today);
  const insight = adherenceVsRecovery(logs, recovery);
  // ¿Hoy hay (o hubo) sesión larga? Para resaltar el combustible en ruta.
  const longToday = (ctx.todayMinutes ?? 0) >= 60 || (ctx.todayStrain ?? 0) >= 12;

  return (
    <Page>
      {/* Recomendación contextual del día */}
      <div className={cn("mb-6 rounded-xl border p-5", ACCENT[focus.slot])}>
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4" />
          {focus.title}
        </div>
        <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">{focus.headline}</p>
        <p className="mt-1 text-sm text-muted-foreground">{focus.detail}</p>
        {focus.hydration && (
          <p className="mt-3 flex items-start gap-2 rounded-lg bg-background/40 p-3 text-sm text-foreground/90">
            <Droplets className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
            {focus.hydration}
          </p>
        )}
      </div>

      {/* Checklist diario — el motor de adherencia */}
      <div className="mb-6">
        <NutritionChecklist date={today} initial={todayLog} streak={streak} adherence7={adh7} />
        {insight && (
          <p className="mt-3 flex items-start gap-2 rounded-lg border border-primary/25 bg-primary/5 p-3 text-sm text-foreground/90">
            <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            {insight}
          </p>
        )}
      </div>

      {/* Combustible en ruta — resaltado si hoy hay sesión larga */}
      <section className={cn("mb-8 rounded-xl border p-5", longToday ? "border-primary/40 bg-primary/5" : "border-border bg-card/50")}>
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Zap className={cn("h-4 w-4", longToday ? "text-primary" : "text-muted-foreground")} />
          Combustible en ruta {longToday && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">para hoy</span>}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{INTRA_TRAINING.intro}</p>
        <p className="mt-3 text-sm font-medium text-foreground">{INTRA_TRAINING.perDose}</p>
        <ul className="mt-1 grid gap-1 text-sm text-foreground/90 sm:grid-cols-2">
          {INTRA_TRAINING.options.map((o, i) => (
            <li key={i} className="flex gap-1.5"><span className="text-primary">›</span>{o}</li>
          ))}
        </ul>
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-background/40 p-3 text-sm text-sky-300">
          <Droplets className="mt-0.5 h-4 w-4 shrink-0" />
          {INTRA_TRAINING.drink}
        </p>
      </section>

      {/* Plan diario */}
      <section className="mb-8">
        <h2 className="mb-1 text-lg font-semibold tracking-tight">Mi plan diario</h2>
        <p className="mb-3 text-sm text-muted-foreground">Las 4 comidas con sus opciones. Tocá para desplegar.</p>
        <div className="space-y-2">
          {MEALS.map((m) => <MealCard key={m.id} meal={m} />)}
        </div>
        <p className="mt-3 text-xs text-muted-foreground/70">Postre (opcional): {POSTRE}</p>
      </section>

      {/* Suplementos + comida libre */}
      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Pill className="h-4 w-4 text-primary" /> Suplementos
          </div>
          <ul className="space-y-3 text-sm">
            {SUPPLEMENTS.map((s, i) => (
              <li key={i}>
                <p className="font-medium text-foreground">{s.name}</p>
                <p className="text-foreground/90">{s.dose}</p>
                <p className="text-xs text-muted-foreground">{s.how}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Apple className="h-4 w-4 text-primary" /> Colaciones
            </div>
            <ul className="space-y-0.5 text-sm text-foreground/90">
              {SNACKS.map((s, i) => <li key={i} className="flex gap-1.5"><span className="text-muted-foreground/50">·</span>{s}</li>)}
            </ul>
          </div>
          <div className="rounded-lg border border-yellow-400/30 bg-yellow-400/5 p-5">
            <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
              <PartyPopper className="h-4 w-4 text-yellow-400" /> Comida libre
            </div>
            <p className="text-sm text-muted-foreground">{FREE_MEAL}</p>
          </div>
        </div>
      </div>

      {/* Recomendaciones */}
      <section className="mb-8 rounded-lg border border-border bg-card/50 p-5">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Info className="h-4 w-4 text-primary" /> Recomendaciones generales
        </div>
        <ul className="grid gap-1.5 text-sm text-foreground/90 sm:grid-cols-2">
          {RECOMMENDATIONS.map((r, i) => <li key={i} className="flex gap-1.5"><span className="text-muted-foreground/50">·</span>{r}</li>)}
        </ul>
      </section>

      {/* Ideas de recetas (complemento del plan) */}
      <section>
        <h2 className="mb-1 text-lg font-semibold tracking-tight">Ideas de recetas rápidas</h2>
        <p className="mb-3 text-sm text-muted-foreground">Recetas concretas que encajan dentro de tu plan, según el momento.</p>
        <div className="space-y-8">
          {(["pre", "post", "rest"] as NutritionSlot[]).map((slot) => (
            <RecipeSection key={slot} slot={slot} title={SLOT_META[slot].title} subtitle={SLOT_META[slot].subtitle} recipes={LIBRARY[slot]} highlight={slot === focus.slot} />
          ))}
        </div>
      </section>

      {/* Nota de rehab */}
      <div className="mt-10 rounded-lg border border-border bg-card/50 p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <HeartPulse className="h-4 w-4 text-primary" /> Para tu recuperación de cuádriceps y rodilla
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          El <strong className="text-foreground/90">omega-3</strong> del plan ayuda a bajar la inflamación muscular. La{" "}
          <strong className="text-foreground/90">proteína repartida</strong> en las 4 comidas repara el músculo cargado. Y bajar de a poco
          hacia tu peso objetivo <strong className="text-foreground/90">descarga directamente</strong> el cuádriceps y la rodilla.
        </p>
      </div>
    </Page>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Nutrición</h1>
        <p className="text-sm text-muted-foreground">
          Tu plan de <span className="text-foreground/80">{PLAN_AUTHOR}</span> · {PLAN_PERIOD}
        </p>
      </header>
      {children}
    </>
  );
}

/** Cruza adherencia al plan con el recovery del día siguiente: el bucle motivador. */
function adherenceVsRecovery(
  logs: NutritionLog[],
  recovery: { date: string; recovery_score: number | null }[],
): string | null {
  const recByDate = new Map(recovery.map((r) => [r.date, r.recovery_score]));
  const good: number[] = [];
  const bad: number[] = [];
  for (const l of logs) {
    const next = new Date(new Date(l.date + "T00:00:00").getTime() + 86_400_000)
      .toISOString()
      .slice(0, 10);
    const rec = recByDate.get(next);
    if (rec == null) continue;
    (dayScore(l) >= 0.7 ? good : bad).push(rec);
  }
  if (good.length < 3 || bad.length < 3) return null;
  const avg = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
  const g = Math.round(avg(good));
  const b = Math.round(avg(bad));
  if (g - b < 3) return null;
  return `Los días que cumplís el plan, tu recovery del día siguiente promedia ${g}% — contra ${b}% cuando no. Comer bien te está rindiendo.`;
}
