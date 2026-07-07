import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SetupNotice, EmptyState } from "@/components/ui/setup-notice";
import { SportBadge } from "@/components/sport-badge";
import { PlannedForm } from "@/components/forms/planned-form";
import { MesoForm } from "@/components/forms/meso-form";
import { GarminImport } from "@/components/forms/garmin-import";
import { isConfigured, getPlanned } from "@/lib/data";
import { fmtDate, fmtDuration } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PlanPage() {
  if (!isConfigured()) {
    return (
      <Page>
        <SetupNotice
          title="Falta configurar el entorno"
          body="Configurá Supabase (ver .env.example) para cargar el plan."
        />
      </Page>
    );
  }

  const planned = await getPlanned(60);

  return (
    <Page>
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
            <CardTitle className="text-foreground">
              Cargar sesión suelta
            </CardTitle>
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
              Exportá el entreno desde Garmin Connect como <code>.tcx</code> y
              subilo. Detecta el deporte y guarda las métricas correctas.
            </p>
            <GarminImport />
          </CardContent>
        </Card>
      </div>

      <MesoMatrices planned={planned} />

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Sesiones sueltas
        </h2>
        {planned.filter((p) => !(p.targets as { meso?: string })?.meso).length === 0 ? (
          <EmptyState>Sin sesiones sueltas (todas pertenecen a un meso).</EmptyState>
        ) : (
          <div className="space-y-2">
            {planned.filter((p) => !(p.targets as { meso?: string })?.meso).map((p) => (
              <Card key={p.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div className="flex items-center gap-3">
                    <SportBadge sport={p.sport} />
                    <div>
                      <div className="text-sm font-medium">
                        {p.type ?? "Sesión"}
                      </div>
                      {p.targets &&
                        typeof p.targets === "object" &&
                        "notas" in p.targets &&
                        (p.targets as { notas?: string }).notas && (
                          <div className="text-xs text-muted-foreground">
                            {(p.targets as { notas?: string }).notas}
                          </div>
                        )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <div>{fmtDate(p.date)}</div>
                    <div>{fmtDuration(p.target_duration_s)}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </Page>
  );
}

function MesoMatrices({ planned }: { planned: import("@/lib/domain/types").PlannedSession[] }) {
  type T = { meso?: string; semana?: number; codigo?: string; notas?: string };
  const byMeso = new Map<string, typeof planned>();
  for (const p of planned) {
    const meso = (p.targets as T)?.meso;
    if (!meso) continue;
    (byMeso.get(meso) ?? byMeso.set(meso, []).get(meso)!).push(p);
  }
  if (byMeso.size === 0) return null;

  return (
    <section className="mt-8 space-y-6">
      <h2 className="text-sm font-medium text-muted-foreground">Mesociclos</h2>
      {[...byMeso.entries()].map(([meso, sessions]) => {
        const semanas = [...new Set(sessions.map((s) => (s.targets as T)?.semana ?? 0))].sort((a, b) => a - b);
        const codigos = [...new Set(sessions.map((s) => (s.targets as T)?.codigo ?? s.type ?? "—"))];
        const cell = (sem: number, cod: string) =>
          sessions.find((s) => ((s.targets as T)?.semana ?? 0) === sem && ((s.targets as T)?.codigo ?? s.type) === cod);
        return (
          <Card key={meso}>
            <CardHeader>
              <CardTitle className="text-foreground">{meso}</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="px-4 py-2 font-medium">Semana</th>
                    {codigos.map((c) => <th key={c} className="px-4 py-2 font-medium">{c}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {semanas.map((sem) => (
                    <tr key={sem} className="border-b border-border/50 last:border-0">
                      <td className="px-4 py-2 font-medium">S{sem}</td>
                      {codigos.map((c) => {
                        const s = cell(sem, c);
                        let disp = "—";
                        if (s) {
                          const tt = s.targets as T & { valor?: string; unidad?: string; distancia_km?: number; reps?: number; duracion_min?: number };
                          if (tt.valor != null) disp = `${tt.valor} ${tt.unidad ?? ""}`.trim();
                          else if (tt.distancia_km != null) disp = `${tt.distancia_km} km`;
                          else if (tt.reps != null) disp = `${tt.reps}×`;
                          else if (tt.duracion_min != null) disp = `${tt.duracion_min} min`;
                          else disp = "✓";
                        }
                        return <td key={c} className="px-4 py-2 text-muted-foreground">{disp}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Plan</h1>
        <p className="text-sm text-muted-foreground">
          Cargá lo planificado por el entrenador e importá lo ejecutado.
        </p>
      </header>
      {children}
    </>
  );
}
