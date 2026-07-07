import { SetupNotice, EmptyState } from "@/components/ui/setup-notice";
import { TrendsCharts, type TrendPoint } from "@/components/charts/trends-charts";
import { isConfigured, getRecovery, getActivities } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function TrendsPage() {
  if (!isConfigured()) {
    return (
      <Page>
        <SetupNotice
          title="Falta configurar el entorno"
          body="Configurá Supabase (ver .env.example) para ver tendencias."
        />
      </Page>
    );
  }

  const [recovery, activities] = await Promise.all([
    getRecovery(60),
    getActivities(400),
  ]);

  // Ventana de los últimos 30 días.
  const days: string[] = [];
  const base = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  const recByDay = new Map(recovery.map((r) => [r.date, r]));
  // minutos por deporte por día
  const minByDay = new Map<string, { bike: number; run: number }>();
  for (const a of activities) {
    const day = a.started_at.slice(0, 10);
    const bucket = minByDay.get(day) ?? { bike: 0, run: 0 };
    const min = (a.duration_s ?? 0) / 60;
    if (a.sport === "bike") bucket.bike += min;
    else if (a.sport === "run") bucket.run += min;
    minByDay.set(day, bucket);
  }

  const data: TrendPoint[] = days.map((date) => {
    const r = recByDay.get(date);
    const m = minByDay.get(date) ?? { bike: 0, run: 0 };
    return {
      date: new Date(date + "T00:00:00").toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
      }),
      recovery: r?.recovery_score ?? null,
      hrv: r?.hrv_rmssd ?? null,
      bike_min: Math.round(m.bike),
      run_min: Math.round(m.run),
    };
  });

  const hasData =
    recovery.length > 0 || data.some((d) => d.bike_min || d.run_min);

  return (
    <Page>
      {hasData ? (
        <TrendsCharts data={data} />
      ) : (
        <EmptyState>
          Sin datos suficientes todavía. Sincronizá Whoop e importá entrenos para
          ver HRV, recovery y carga por deporte.
        </EmptyState>
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
          HRV, recovery y carga en el tiempo — por deporte y combinada.
        </p>
      </header>
      {children}
    </>
  );
}
