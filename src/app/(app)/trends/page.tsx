import { SetupNotice, EmptyState } from "@/components/ui/setup-notice";
import { TrendsCharts, type TrendPoint } from "@/components/charts/trends-charts";
import { Card, CardContent } from "@/components/ui/card";
import { isConfigured, getRecovery, getActivities, getCycles } from "@/lib/data";
import { rollingAvg, acwr } from "@/lib/analytics";
import { isIndoorBike, minutesOf } from "@/lib/activities";

export const dynamic = "force-dynamic";

const RANGE = 42;

export default async function TrendsPage() {
  if (!isConfigured()) {
    return (
      <Page>
        <SetupNotice title="Falta configurar el entorno" body="Configurá Supabase para ver tendencias." />
      </Page>
    );
  }

  const [recovery, activities, cycles] = await Promise.all([
    getRecovery(RANGE + 5),
    getActivities(500),
    getCycles(RANGE + 5),
  ]);

  const days: string[] = [];
  const base = new Date();
  for (let i = RANGE - 1; i >= 0; i--) {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  const recByDay = new Map(recovery.map((r) => [r.date, r]));
  const strainByDay = new Map(cycles.map((c) => [c.date, c.day_strain]));
  const minByDay = new Map<string, { run: number; bikeOut: number; bikeIn: number }>();
  for (const a of activities) {
    const day = a.started_at.slice(0, 10);
    const b = minByDay.get(day) ?? { run: 0, bikeOut: 0, bikeIn: 0 };
    const m = minutesOf(a);
    if (a.sport === "run") b.run += m;
    else if (a.sport === "bike") (isIndoorBike(a) ? (b.bikeIn += m) : (b.bikeOut += m));
    minByDay.set(day, b);
  }

  const hrvArr = days.map((d) => recByDay.get(d)?.hrv_rmssd ?? null);
  const strainArr = days.map((d) => strainByDay.get(d) ?? null);
  const hrvBase = rollingAvg(hrvArr, 7);
  const acute = rollingAvg(strainArr, 7);
  const chronic = rollingAvg(strainArr, 28);

  const data: TrendPoint[] = days.map((date, i) => {
    const m = minByDay.get(date) ?? { run: 0, bikeOut: 0, bikeIn: 0 };
    return {
      date,
      label: new Date(date + "T00:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }),
      recovery: recByDay.get(date)?.recovery_score ?? null,
      hrv: hrvArr[i],
      hrvBaseline: hrvBase[i],
      strain: strainArr[i],
      acute: acute[i],
      chronic: chronic[i],
      run: Math.round(m.run),
      bike: Math.round(m.bikeOut + m.bikeIn),
    };
  });

  const acwrStatus = acwr(acute[acute.length - 1], chronic[chronic.length - 1]);
  const totalBikeIn = [...minByDay.values()].reduce((s, m) => s + m.bikeIn, 0);
  const totalBikeOut = [...minByDay.values()].reduce((s, m) => s + m.bikeOut, 0);
  const indoorPct = totalBikeIn + totalBikeOut > 0 ? Math.round((totalBikeIn / (totalBikeIn + totalBikeOut)) * 100) : null;

  const hasData = recovery.length > 0 || data.some((d) => d.run || d.bike);

  const zoneColor: Record<string, string> = {
    optimo: "text-primary",
    detrain: "text-sky-400",
    precaucion: "text-yellow-400",
    riesgo: "text-red-400",
    sin_dato: "text-muted-foreground",
  };

  return (
    <Page>
      {!hasData ? (
        <EmptyState>Sin datos suficientes todavía.</EmptyState>
      ) : (
        <>
          {/* Diagnóstico del entrenador: ACWR */}
          <Card className="mb-6">
            <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Ratio carga aguda:crónica (ACWR)</div>
                <div className={`text-4xl font-bold tabular-nums ${zoneColor[acwrStatus.zone]}`}>
                  {acwrStatus.ratio == null ? "—" : acwrStatus.ratio.toFixed(2)}
                </div>
                <div className={`text-sm font-medium ${zoneColor[acwrStatus.zone]}`}>{acwrStatus.label}</div>
              </div>
              <p className="max-w-sm text-sm text-muted-foreground">{acwrStatus.advice}</p>
              {indoorPct != null && (
                <div className="rounded-lg border border-border px-4 py-3 text-center">
                  <div className="text-2xl font-semibold tabular-nums">{indoorPct}%</div>
                  <div className="text-xs text-muted-foreground">de la bici, indoor</div>
                </div>
              )}
            </CardContent>
          </Card>

          <TrendsCharts data={data} />
        </>
      )}
    </Page>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Tendencias</h1>
        <p className="text-sm text-muted-foreground">
          HRV, recovery y carga en el tiempo — con lectura de entrenador.
        </p>
      </header>
      {children}
    </>
  );
}
