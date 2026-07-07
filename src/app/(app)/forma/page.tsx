import { SetupNotice, EmptyState } from "@/components/ui/setup-notice";
import { Card, CardContent } from "@/components/ui/card";
import { FormCharts, type FormPoint } from "@/components/charts/form-charts";
import { isConfigured, getCycles } from "@/lib/data";
import { computePmc, formStatus, trainingStatus } from "@/lib/analytics";

export const dynamic = "force-dynamic";

const WARMUP = 120; // días para calentar las EMAs
const SHOW = 49; // días visibles

export default async function FormaPage() {
  if (!isConfigured()) {
    return (
      <Page>
        <SetupNotice title="Falta configurar el entorno" body="Configurá Supabase para ver tu forma." />
      </Page>
    );
  }

  const cycles = await getCycles(WARMUP);
  if (cycles.length === 0) {
    return (
      <Page>
        <EmptyState>Sin datos de carga todavía. Sincronizá Whoop.</EmptyState>
      </Page>
    );
  }

  // Serie diaria continua (rellena días sin dato con 0 = descanso).
  const strainByDay = new Map(cycles.map((c) => [c.date, c.day_strain ?? 0]));
  const today = new Date();
  const start = new Date(today);
  start.setUTCDate(today.getUTCDate() - (WARMUP - 1));
  const dates: string[] = [];
  for (let d = new Date(start); d <= today; d.setUTCDate(d.getUTCDate() + 1)) {
    dates.push(d.toISOString().slice(0, 10));
  }
  const load = dates.map((d) => strainByDay.get(d) ?? 0);
  const pmc = computePmc(load);

  const points: FormPoint[] = dates.slice(-SHOW).map((d, i) => {
    const p = pmc[pmc.length - SHOW + i];
    return {
      label: new Date(d + "T00:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }),
      ctl: Math.round(p.ctl * 10) / 10,
      atl: Math.round(p.atl * 10) / 10,
      tsb: Math.round(p.tsb * 10) / 10,
    };
  });

  const last = pmc[pmc.length - 1];
  const prev7 = pmc[pmc.length - 8] ?? pmc[0];
  const fs = formStatus(last.tsb);
  const ts = trainingStatus(last.ctl, prev7.ctl, last.tsb);
  const tsTone: Record<string, string> = {
    productive: "text-primary bg-primary/5 ring-primary/30",
    maintaining: "text-sky-400 bg-sky-400/5 ring-sky-400/30",
    peaking: "text-violet-300 bg-violet-400/5 ring-violet-400/30",
    overreach: "text-red-400 bg-red-400/5 ring-red-400/30",
    detrain: "text-yellow-400 bg-yellow-400/5 ring-yellow-400/30",
  };
  const toneColor: Record<string, string> = {
    fresh: "text-sky-400",
    neutral: "text-primary",
    productive: "text-primary",
    loaded: "text-yellow-400",
    overreached: "text-red-400",
  };

  return (
    <Page>
      <div className="mb-6 grid grid-cols-3 gap-4">
        <Metric label="Fitness (CTL)" value={last.ctl.toFixed(1)} hint="fondo · 42 días" />
        <Metric label="Fatiga (ATL)" value={last.atl.toFixed(1)} hint="cansancio · 7 días" />
        <Metric label="Forma (TSB)" value={last.tsb.toFixed(1)} hint={fs.label} valueClass={toneColor[fs.tone]} />
      </div>

      <div className={`mb-6 rounded-xl border border-border p-5 ring-1 ${tsTone[ts.tone]}`}>
        <div className="text-xs font-semibold uppercase tracking-wide">Estado de entrenamiento</div>
        <div className="mt-1 text-2xl font-bold">{ts.label}</div>
        <p className="mt-1 text-sm text-muted-foreground">{ts.advice}</p>
      </div>

      <Card className="mb-6">
        <CardContent className="py-4">
          <p className="text-sm">
            <span className={`font-medium ${toneColor[fs.tone]}`}>Forma: {fs.label}.</span>{" "}
            <span className="text-muted-foreground">{fs.advice}</span>
          </p>
        </CardContent>
      </Card>

      <FormCharts data={points} />
    </Page>
  );
}

function Metric({ label, value, hint, valueClass }: { label: string; value: string; hint: string; valueClass?: string }) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`mt-1 text-2xl font-semibold tabular-nums ${valueClass ?? ""}`}>{value}</div>
        <div className="text-[11px] text-muted-foreground/70">{hint}</div>
      </CardContent>
    </Card>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Forma</h1>
        <p className="text-sm text-muted-foreground">
          Fitness, fatiga y forma (modelo PMC) — ¿estás construyendo o sobrecargado?
        </p>
      </header>
      {children}
    </>
  );
}
