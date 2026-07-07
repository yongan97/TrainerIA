import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { SetupNotice, EmptyState } from "@/components/ui/setup-notice";
import { RehabForm } from "@/components/forms/rehab-form";
import { isConfigured, getRehabLogs, getActivities } from "@/lib/data";
import { fmt, fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function RehabPage() {
  if (!isConfigured()) {
    return (
      <Page>
        <SetupNotice
          title="Falta configurar el entorno"
          body="Configurá Supabase (ver .env.example) para el tracking de rehab."
        />
      </Page>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const [logs, activities] = await Promise.all([
    getRehabLogs(90),
    getActivities(400),
  ]);

  // Minutos de running vs bici por día (impacto vs no-impacto).
  const runMin = new Map<string, number>();
  const bikeMin = new Map<string, number>();
  for (const a of activities) {
    const d = a.started_at.slice(0, 10);
    const min = (a.duration_s ?? 0) / 60;
    if (a.sport === "run") runMin.set(d, (runMin.get(d) ?? 0) + min);
    else if (a.sport === "bike") bikeMin.set(d, (bikeMin.get(d) ?? 0) + min);
  }

  // Correlación simple: dolor promedio en días con running vs sin running.
  const withRun: number[] = [];
  const withoutRun: number[] = [];
  for (const log of logs) {
    if (log.knee_pain == null) continue;
    if ((runMin.get(log.date) ?? 0) > 0) withRun.push(log.knee_pain);
    else withoutRun.push(log.knee_pain);
  }
  const avg = (xs: number[]) =>
    xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;

  return (
    <Page>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Registro diario</CardTitle>
          </CardHeader>
          <CardContent>
            <RehabForm today={today} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Stat
            label="Dolor con running"
            value={fmt(avg(withRun), 1)}
            suffix="/10"
            hint={`${withRun.length} días con impacto`}
          />
          <Stat
            label="Dolor sin running"
            value={fmt(avg(withoutRun), 1)}
            suffix="/10"
            hint={`${withoutRun.length} días sin impacto`}
          />
          <p className="px-1 text-xs text-muted-foreground">
            Comparación empírica del dolor de rodilla según haya o no volumen de
            running (impacto) ese día. Con más datos, se vuelve accionable.
          </p>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Historial
        </h2>
        {logs.length === 0 ? (
          <EmptyState>Todavía no registraste días de rehab.</EmptyState>
        ) : (
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Fecha</th>
                    <th className="px-5 py-3 font-medium">Dolor</th>
                    <th className="px-5 py-3 font-medium">Run (min)</th>
                    <th className="px-5 py-3 font-medium">Bici (min)</th>
                    <th className="px-5 py-3 font-medium">Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr
                      key={l.id}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="px-5 py-3">{fmtDate(l.date)}</td>
                      <td className="px-5 py-3 font-medium">
                        {l.knee_pain ?? "—"}/10
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {Math.round(runMin.get(l.date) ?? 0) || "—"}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {Math.round(bikeMin.get(l.date) ?? 0) || "—"}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {l.notes ?? "—"}
                      </td>
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
        <p className="text-sm text-muted-foreground">
          Rodilla, drills de glúteo/cadera y su relación con el impacto del running.
        </p>
      </header>
      {children}
    </>
  );
}
