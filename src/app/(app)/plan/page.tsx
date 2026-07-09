import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SetupNotice, EmptyState } from "@/components/ui/setup-notice";
import { SportBadge } from "@/components/sport-badge";
import { PlannedForm } from "@/components/forms/planned-form";
import { MesoForm } from "@/components/forms/meso-form";
import { GarminImport } from "@/components/forms/garmin-import";
import { isConfigured, getPlanned, getActivities } from "@/lib/data";
import { fmtDate, fmtDuration } from "@/lib/format";
import type { PlannedSession } from "@/lib/domain/types";

export const dynamic = "force-dynamic";

export default async function PlanPage() {
  if (!isConfigured()) {
    return (
      <Page>
        <SetupNotice title="Falta configurar el entorno" body="Configurá Supabase (ver .env.example) para cargar el plan." />
      </Page>
    );
  }

  const [planned, activities] = await Promise.all([getPlanned(400), getActivities(600)]);

  // Set "fecha|deporte" de lo ejecutado, para marcar cada sesión como cumplida.
  const doneSet = new Set(activities.map((a) => `${a.started_at.slice(0, 10)}|${a.sport}`));
  const isDone = (p: PlannedSession) => doneSet.has(`${p.date}|${p.sport}`);

  // Agrupar por meso
  const mesos = new Map<string, PlannedSession[]>();
  const loose: PlannedSession[] = [];
  for (const p of planned) {
    const meso = (p.targets as { meso?: string })?.meso;
    if (meso) (mesos.get(meso) ?? mesos.set(meso, []).get(meso)!).push(p);
    else loose.push(p);
  }
  const mesoList = [...mesos.entries()].sort((a, b) => (a[1][0]?.date ?? "").localeCompare(b[1][0]?.date ?? ""));

  return (
    <Page>
      {/* MESOCICLOS con completitud */}
      {mesoList.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">Mesociclos</h2>
          <div className="space-y-3">
            {mesoList.map(([meso, sessions]) => {
              const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
              const done = sorted.filter(isDone).length;
              const pct = Math.round((done / sorted.length) * 100);
              const complete = pct === 100;
              const today = new Date().toISOString().slice(0, 10);
              const isPast = sorted[sorted.length - 1].date < today;
              return (
                <Card key={meso} className={complete && isPast ? "border-primary/40" : undefined}>
                  <CardContent className="py-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {complete && isPast && <CheckCircle2 className="h-5 w-5 text-primary" />}
                        <span className="font-medium">{meso}</span>
                        <span className="text-xs text-muted-foreground">
                          {fmtDate(sorted[0].date)} – {fmtDate(sorted[sorted.length - 1].date)}
                        </span>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          complete ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {complete ? (isPast ? "✓ Completado 100%" : "En curso") : `${done}/${sorted.length} · ${pct}%`}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {sorted.map((p) => (
                        <span
                          key={p.id}
                          title={`${p.type ?? "Sesión"} · ${fmtDate(p.date)}`}
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs ${
                            isDone(p) ? "border-primary/30 bg-primary/5 text-foreground" : "border-border text-muted-foreground"
                          }`}
                        >
                          <SportBadge sport={p.sport} showLabel={false} />
                          {(p.targets as { codigo?: string })?.codigo ?? p.type ?? "Sesión"}
                          {isDone(p) && <CheckCircle2 className="h-3 w-3 text-primary" />}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-foreground">Generar mesociclo</CardTitle>
          <p className="text-xs text-muted-foreground">Cargá la progresión por semana (como el plan de John) y se expanden todas las sesiones.</p>
        </CardHeader>
        <CardContent>
          <MesoForm />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Cargar sesión suelta</CardTitle>
          </CardHeader>
          <CardContent>
            <PlannedForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Importar ejecutado (Garmin)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">
              Exportá el entreno desde Garmin Connect como <code>.tcx</code> y subilo. Detecta el deporte y guarda las métricas correctas.
            </p>
            <GarminImport />
          </CardContent>
        </Card>
      </div>

      {loose.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">Sesiones sueltas</h2>
          <div className="space-y-2">
            {loose.map((p) => (
              <Card key={p.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div className="flex items-center gap-3">
                    <SportBadge sport={p.sport} />
                    <div className="text-sm font-medium">{p.type ?? "Sesión"}</div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <div>{fmtDate(p.date)}</div>
                    <div>{fmtDuration(p.target_duration_s)}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {mesoList.length === 0 && loose.length === 0 && (
        <EmptyState>Todavía no cargaste sesiones del plan.</EmptyState>
      )}
    </Page>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Plan</h1>
        <p className="text-sm text-muted-foreground">Cargá lo planificado por el entrenador e importá lo ejecutado.</p>
      </header>
      {children}
    </>
  );
}
