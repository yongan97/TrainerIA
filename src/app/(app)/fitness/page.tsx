import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { SetupNotice, EmptyState } from "@/components/ui/setup-notice";
import { Vo2Chart, type Vo2Point } from "@/components/charts/vo2-chart";
import { isConfigured, getActivities } from "@/lib/data";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

function m(a: { metrics: unknown }, key: string): number | null {
  const v = (a.metrics as Record<string, number | null> | null)?.[key];
  return typeof v === "number" ? v : null;
}

export default async function FitnessPage() {
  if (!isConfigured()) {
    return (
      <Page>
        <SetupNotice title="Falta configurar el entorno" body="Configurá Supabase." />
      </Page>
    );
  }
  const activities = await getActivities(500);
  const runsAsc = activities
    .filter((a) => a.sport === "run" && m(a, "vo2max") != null)
    .sort((x, y) => x.started_at.localeCompare(y.started_at));

  if (runsAsc.length === 0) {
    return (
      <Page>
        <EmptyState>Sin datos de VO₂max todavía. Corré con el reloj Garmin y sincronizá.</EmptyState>
      </Page>
    );
  }

  const points: Vo2Point[] = runsAsc.map((a) => ({
    label: new Date(a.started_at).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }),
    vo2: m(a, "vo2max")!,
  }));
  const latest = points[points.length - 1].vo2;
  const first = points[0].vo2;
  const delta = latest - first;
  const bestTE = Math.max(...runsAsc.map((a) => m(a, "aerobic_te") ?? 0));

  return (
    <Page>
      <div className="mb-6 grid grid-cols-3 gap-4">
        <Stat label="VO₂max actual" value={String(latest)} suffix="ml/kg/min" />
        <Stat label="Cambio en el período" value={`${delta >= 0 ? "+" : ""}${delta}`} className={delta >= 0 ? "text-primary" : "text-red-400"} />
        <Stat label="Mejor efecto aeróbico" value={bestTE.toFixed(1)} hint="training effect" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Evolución del VO₂max</CardTitle>
          <p className="text-xs text-muted-foreground">Estimación de Garmin por carrera · {runsAsc.length} salidas · desde {fmtDate(runsAsc[0].started_at)}</p>
        </CardHeader>
        <CardContent>
          <Vo2Chart data={points} />
        </CardContent>
      </Card>
    </Page>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Fitness (VO₂max)</h1>
        <p className="text-sm text-muted-foreground">Evolución de tu capacidad aeróbica estimada.</p>
      </header>
      {children}
    </>
  );
}
