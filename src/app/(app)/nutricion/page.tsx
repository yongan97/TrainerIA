import { HeartPulse } from "lucide-react";
import { HoyView } from "@/components/kitchen/hoy-view";
import { MediterraneanPrinciples } from "@/components/kitchen/principles";
import { NutritionChecklist } from "@/components/nutrition-checklist";
import { getKitchenView } from "@/lib/kitchen/store";
import { getNutritionLogs, getRecovery } from "@/lib/data";
import { dayScore, type NutritionLog } from "@/lib/nutrition-plan";

export const dynamic = "force-dynamic";

export default async function NutricionPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [view, recovery, logs] = await Promise.all([
    getKitchenView(today),
    getRecovery(60),
    getNutritionLogs(60),
  ]);

  return (
    <div className="space-y-6">
      {!view.configured && (
        <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          Sin Supabase los cambios no se guardan. El menú de la semana igual está listo para cocinar.
        </p>
      )}
      <MediterraneanPrinciples />
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
          El omega-3 de todos los días ayuda con la inflamación. La proteína (1,8 g/kg) reparte la reparación en las comidas.
          Bajar hacia 100 kg —y después a 90–95— descarga la pierna. Tope 0,5 kg por semana, y nada de recorte en semana de carga o de carrera.
        </p>
      </div>
      <AdherenceNote logs={logs} recovery={recovery} />
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
  return <p className="text-sm text-foreground/90">{text}</p>;
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
  return `Los días que cumplís el checklist, tu recovery del día siguiente promedia ${g}% — contra ${b}% cuando no.`;
}
