import { SetupNotice, EmptyState } from "@/components/ui/setup-notice";
import { TrendsCharts, type TrendPoint } from "@/components/charts/trends-charts";
import { CorrelationScatter, type CorrPoint } from "@/components/charts/correlation-scatter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isConfigured, getRecovery, getActivities, getCycles } from "@/lib/data";
import { rollingAvg, acwr, linreg } from "@/lib/analytics";
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

  // Carga (strain) -> recovery del día siguiente: tu tolerancia personal
  const strainRecPairs: CorrPoint[] = [];
  for (const [d, strain] of strainByDay) {
    if (strain == null) continue;
    const next = new Date(new Date(d + "T00:00:00Z").getTime() + 86_400_000).toISOString().slice(0, 10);
    const rec = recByDay.get(next)?.recovery_score;
    if (rec != null) strainRecPairs.push({ x: strain, y: rec });
  }
  const strainReg = linreg(strainRecPairs);
  const perStrain = strainReg ? Math.round(strainReg.slope * 10) / 10 : null;

  // Composición de recovery (30 días): salud de la recuperación de un vistazo
  const rec30 = recovery.slice(0, 30).map((r) => r.recovery_score).filter((v): v is number => v != null);
  const green = rec30.filter((s) => s >= 67).length;
  const yellow = rec30.filter((s) => s >= 34 && s < 67).length;
  const red = rec30.filter((s) => s < 34).length;
  const rtot = rec30.length;

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
                <div className={`text-3xl font-bold tabular-nums sm:text-4xl ${zoneColor[acwrStatus.zone]}`}>
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

          {rtot >= 5 && (
            <Card className="mb-6">
              <CardContent className="py-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">Composición de recovery · {rtot} días</span>
                  <span className="text-xs text-muted-foreground">{Math.round((green / rtot) * 100)}% en verde</span>
                </div>
                <div className="flex h-3 w-full overflow-hidden rounded-full">
                  <div style={{ width: `${(green / rtot) * 100}%`, backgroundColor: "#2ba86a" }} />
                  <div style={{ width: `${(yellow / rtot) * 100}%`, backgroundColor: "#eab308" }} />
                  <div style={{ width: `${(red / rtot) * 100}%`, backgroundColor: "#e0555f" }} />
                </div>
                <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                  <span><span className="text-primary">●</span> {green} verdes</span>
                  <span><span className="text-yellow-400">●</span> {yellow} amarillos</span>
                  <span><span className="text-red-400">●</span> {red} rojos</span>
                </div>
              </CardContent>
            </Card>
          )}

          <TrendsCharts data={data} />

          {strainRecPairs.length >= 8 && strainReg && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-foreground">Cuánto te cuesta un día duro</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {perStrain != null && perStrain < 0
                    ? `En tus datos, cada punto de strain se asocia a ~${Math.abs(perStrain)}% menos de recovery al día siguiente. Es tu costo de recuperación por carga.`
                    : "En tus datos la carga no golpea mucho tu recovery del día siguiente: buena tolerancia."}
                </p>
              </CardHeader>
              <CardContent>
                <CorrelationScatter data={strainRecPairs} xLabel="Strain del día" yLabel="Recovery día sig." xUnit="" yUnit="%" line={strainReg} />
              </CardContent>
            </Card>
          )}
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
