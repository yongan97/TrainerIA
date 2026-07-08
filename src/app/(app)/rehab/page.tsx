import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { SetupNotice, EmptyState } from "@/components/ui/setup-notice";
import { RehabForm } from "@/components/forms/rehab-form";
import { RehabCharts, type RehabPoint, type WeekPoint } from "@/components/charts/rehab-charts";
import { CadenceChart } from "@/components/charts/cadence-chart";
import { isConfigured, getRehabLogs, getActivities } from "@/lib/data";
import { fmt, fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

function mondayOf(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = (d.getDay() + 6) % 7; // 0 = lunes
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

export default async function RehabPage() {
  if (!isConfigured()) {
    return (
      <Page>
        <SetupNotice title="Falta configurar el entorno" body="Configurá Supabase para el tracking de rehab." />
      </Page>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const [logs, activities] = await Promise.all([getRehabLogs(120), getActivities(500)]);

  // La sobrecarga de cuádriceps viene de la bici (técnica/cadencia), así que el
  // eje del rehab es la carga de bici, no el impacto del running.
  const painByDay = new Map(logs.map((l) => [l.date, l.knee_pain]));
  const bikeMinByDay = new Map<string, number>();
  for (const a of activities) {
    if (a.sport !== "bike") continue;
    const d = a.started_at.slice(0, 10);
    bikeMinByDay.set(d, (bikeMinByDay.get(d) ?? 0) + (a.duration_s ?? 0) / 60);
  }

  // Serie diaria (56 días)
  const daily: RehabPoint[] = [];
  const base = new Date();
  for (let i = 55; i >= 0; i--) {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    daily.push({
      label: d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }),
      pain: painByDay.get(key) ?? null,
      bikeMin: Math.round(bikeMinByDay.get(key) ?? 0),
    });
  }

  // Volumen semanal de bici (8 semanas) + progresión gradual
  const minByWeek = new Map<string, number>();
  for (const [d, m] of bikeMinByDay) minByWeek.set(mondayOf(d), (minByWeek.get(mondayOf(d)) ?? 0) + m);
  const weekStarts: string[] = [];
  const mon = new Date(mondayOf(today));
  for (let i = 7; i >= 0; i--) {
    const w = new Date(mon);
    w.setDate(mon.getDate() - i * 7);
    weekStarts.push(w.toISOString().slice(0, 10));
  }
  const weekly: WeekPoint[] = weekStarts.map((ws, i) => {
    const min = Math.round(minByWeek.get(ws) ?? 0);
    const prev = i > 0 ? minByWeek.get(weekStarts[i - 1]) ?? 0 : 0;
    return {
      label: new Date(ws + "T00:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }),
      min,
      over10: prev > 0 && min > prev * 1.1,
    };
  });

  // Molestia en días con/sin bici
  const withBike: number[] = [];
  const withoutBike: number[] = [];
  for (const l of logs) {
    if (l.knee_pain == null) continue;
    ((bikeMinByDay.get(l.date) ?? 0) > 0 ? withBike : withoutBike).push(l.knee_pain);
  }
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

  // Racha de drills (días consecutivos hasta hoy con al menos un drill)
  const drillDays = new Set(
    logs.filter((l) => l.drills_done && Object.values(l.drills_done as Record<string, boolean>).some(Boolean)).map((l) => l.date),
  );
  let streak = 0;
  for (let i = 0; ; i++) {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() - i);
    if (drillDays.has(d.toISOString().slice(0, 10))) streak++;
    else break;
  }

  const thisWeek = weekly[weekly.length - 1]?.min ?? 0;
  const lastWeek = weekly[weekly.length - 2]?.min ?? 0;
  const bumped = lastWeek > 0 && thisWeek > lastWeek * 1.1;

  // Cadencia de bici: cadencia baja = mucha fuerza por pedalada = sobrecarga del cuádriceps
  const cadencePts = activities
    .filter((a) => a.sport === "bike")
    .filter((a) => typeof (a.metrics as Record<string, number | null> | null)?.avg_cadence === "number")
    .sort((x, y) => x.started_at.localeCompare(y.started_at))
    .slice(-20)
    .map((a) => ({
      label: new Date(a.started_at).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }),
      cadence: Math.round((a.metrics as Record<string, number>).avg_cadence),
    }));
  const avgCad = cadencePts.length ? Math.round(cadencePts.reduce((s, p) => s + p.cadence, 0) / cadencePts.length) : null;

  return (
    <Page>
      {/* Insight de entrenador */}
      <Card className="mb-6">
        <CardContent className="py-4 text-sm">
          {bumped ? (
            <span className="text-yellow-300">
              ⚠️ Subiste la bici de {lastWeek} a {thisWeek} min esta semana (+{Math.round((thisWeek / lastWeek - 1) * 100)}%). Con el cuádriceps sensible, progresá el volumen de a poco y cuidá la cadencia.
            </span>
          ) : (
            <span className="text-muted-foreground">
              Objetivo del rehab: mantener la molestia <b className="text-foreground">por debajo de 4/10</b>. La causa es técnica de pedaleo — <b className="text-foreground">cadencia alta (≥85–90 rpm)</b> para bajar la fuerza por pedalada, más fuerza de glúteo/cadera para no sobrecargar el cuádriceps.
            </span>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <RehabCharts daily={daily} weekly={weekly} />
        <div className="space-y-4">
          <Stat label="Molestia con bici" value={fmt(avg(withBike), 1)} suffix="/10" hint={`${withBike.length} días con bici`} />
          <Stat label="Molestia sin bici" value={fmt(avg(withoutBike), 1)} suffix="/10" hint={`${withoutBike.length} días sin bici`} />
          <Stat label="Racha de drills" value={String(streak)} suffix={streak === 1 ? "día" : "días"} hint="Glúteo/cadera consecutivos" />
        </div>
      </div>

      {/* Cadencia de bici (más cadencia = menos fuerza por pedalada = menos cuádriceps) */}
      {cadencePts.length >= 4 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-foreground">Cadencia de bici</CardTitle>
            <p className="text-xs text-muted-foreground">
              Objetivo ≥85–90 rpm. {avgCad != null && (avgCad < 85 ? `Venís en ${avgCad} rpm — subir la cadencia (piñón más liviano) descarga el cuádriceps. Es la clave de tu rehab.` : `Venís en ${avgCad} rpm — buena cadencia para proteger el cuádriceps.`)}
            </p>
          </CardHeader>
          <CardContent>
            <CadenceChart data={cadencePts} />
          </CardContent>
        </Card>
      )}

      {/* Registro diario */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-foreground">Registro de hoy</CardTitle>
        </CardHeader>
        <CardContent>
          <RehabForm today={today} />
        </CardContent>
      </Card>

      {/* Historial */}
      <section className="mt-6">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Historial</h2>
        {logs.length === 0 ? (
          <EmptyState>Todavía no registraste días de rehab.</EmptyState>
        ) : (
          <Card>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full min-w-[420px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Fecha</th>
                    <th className="px-5 py-3 font-medium">Molestia</th>
                    <th className="px-5 py-3 font-medium">Bici (min)</th>
                    <th className="px-5 py-3 font-medium">Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.slice(0, 20).map((l) => (
                    <tr key={l.id} className="border-b border-border/50 last:border-0">
                      <td className="px-5 py-3">{fmtDate(l.date)}</td>
                      <td className="px-5 py-3 font-medium">{l.knee_pain ?? "—"}/10</td>
                      <td className="px-5 py-3 text-muted-foreground">{Math.round(bikeMinByDay.get(l.date) ?? 0) || "—"}</td>
                      <td className="px-5 py-3 text-muted-foreground">{l.notes ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </section>
    </Page>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Rehab</h1>
        <p className="text-sm text-muted-foreground">Cuádriceps derecho, técnica de pedaleo (cadencia) y fuerza de glúteo/cadera.</p>
      </header>
      {children}
    </>
  );
}
