import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SetupNotice, EmptyState } from "@/components/ui/setup-notice";
import { SportBadge } from "@/components/sport-badge";
import { PlannedForm } from "@/components/forms/planned-form";
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
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">
              Cargar sesión del entrenador
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

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Sesiones planificadas
        </h2>
        {planned.length === 0 ? (
          <EmptyState>Todavía no cargaste sesiones del plan.</EmptyState>
        ) : (
          <div className="space-y-2">
            {planned.map((p) => (
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
