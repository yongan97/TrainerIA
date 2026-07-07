import { SetupNotice, EmptyState } from "@/components/ui/setup-notice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { SleepTrend, SleepStages, type SleepPoint } from "@/components/charts/sleep-charts";
import { isConfigured, getSleep } from "@/lib/data";
import { rollingAvg } from "@/lib/analytics";
import { fmtDuration } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SleepPage() {
  if (!isConfigured()) {
    return (
      <Page>
        <SetupNotice title="Falta configurar el entorno" body="Configurá Supabase para ver el sueño." />
      </Page>
    );
  }

  const sleep = await getSleep(21);
  if (sleep.length === 0) {
    return (
      <Page>
        <EmptyState>Sin datos de sueño todavía. Sincronizá Whoop.</EmptyState>
      </Page>
    );
  }

  const last = sleep[0];
  const asc = [...sleep].reverse();
  const hoursArr = asc.map((s) => (s.duration_s != null ? s.duration_s / 3600 : null));
  const avgArr = rollingAvg(hoursArr, 7);
  const points: SleepPoint[] = asc.map((s, i) => ({
    label: new Date(s.date + "T00:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }),
    hours: hoursArr[i] != null ? Math.round(hoursArr[i]! * 10) / 10 : null,
    avg: avgArr[i] != null ? Math.round(avgArr[i]! * 10) / 10 : null,
  }));

  const validHours = hoursArr.filter((h): h is number => h != null);
  const avg7 = validHours.slice(-7);
  const mean = avg7.length ? avg7.reduce((a, b) => a + b, 0) / avg7.length : null;
  // Deuda de sueño vs objetivo 8h (últimos 7 días)
  const debt = avg7.length ? avg7.reduce((s, h) => s + (8 - h), 0) : null;

  return (
    <Page>
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Anoche" value={fmtDuration(last.duration_s)} />
        <Stat label="Eficiencia" value={last.efficiency != null ? String(Math.round(last.efficiency)) : "—"} suffix="%" />
        <Stat label="Media 7d" value={mean != null ? `${mean.toFixed(1)}` : "—"} suffix="h" />
        <Stat
          label="Deuda 7d vs 8h"
          value={debt != null ? `${debt > 0 ? "-" : "+"}${Math.abs(debt).toFixed(1)}` : "—"}
          suffix="h"
          className={debt != null && debt > 3 ? "text-yellow-400" : undefined}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Fases de anoche</CardTitle>
          </CardHeader>
          <CardContent>
            <SleepStages stages={last.stages} />
          </CardContent>
        </Card>
        <SleepTrend data={points} />
      </div>
    </Page>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Sueño</h1>
        <p className="text-sm text-muted-foreground">Duración, fases, eficiencia y deuda de sueño.</p>
      </header>
      {children}
    </>
  );
}
