import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { SetupNotice, EmptyState } from "@/components/ui/setup-notice";
import { SportBadge } from "@/components/sport-badge";
import {
  isConfigured,
  isWhoopConnected,
  getRecovery,
  getDailySummary,
  getPlanned,
} from "@/lib/data";
import { fmt, fmtDate, fmtDuration, recoveryColor } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const configured = isConfigured();
  const connected = await isWhoopConnected();

  if (!configured) {
    return (
      <Page>
        <SetupNotice
          title="Falta configurar el entorno"
          body="Definí NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (ver .env.example) y aplicá la migración de supabase/migrations."
        />
      </Page>
    );
  }

  const [recovery, daily, planned] = await Promise.all([
    getRecovery(14),
    getDailySummary(1),
    getPlanned(30),
  ]);
  const latest = recovery[0];
  const today = new Date().toISOString().slice(0, 10);
  const plannedToday = planned.filter((p) => p.date === today);

  return (
    <Page>
      {!connected && (
        <SetupNotice
          title="Conectá tu cuenta de Whoop"
          body="Autorizá el acceso vía OAuth para traer recovery, sueño, strain y entrenamientos."
          cta={{ href: "/api/whoop/auth", label: "Conectar Whoop" }}
        />
      )}

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat
          label="Recovery"
          value={fmt(latest?.recovery_score)}
          suffix="%"
          className={recoveryColor(latest?.recovery_score)}
        />
        <Stat label="HRV" value={fmt(latest?.hrv_rmssd)} suffix="ms" />
        <Stat label="FC reposo" value={fmt(latest?.rhr)} suffix="bpm" />
        <Stat
          label="Strain de ayer"
          value={fmt(daily[0]?.day_strain, 1)}
        />
      </section>

      {/* Qué toca hoy según el plan */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Qué toca hoy
        </h2>
        <Card>
          <CardContent className="py-5">
            {plannedToday.length === 0 ? (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  No hay nada planificado para hoy.
                </p>
                <Link
                  href="/plan"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  Cargar plan <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {plannedToday.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <SportBadge sport={p.sport} />
                      <span className="text-sm">{p.type ?? "Sesión"}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {fmtDuration(p.target_duration_s)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Recovery reciente */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Recovery — últimos 14 días
        </h2>
        {recovery.length === 0 ? (
          <EmptyState>
            Sin datos todavía. {connected ? "Sincronizá Whoop." : "Conectá Whoop para empezar."}
          </EmptyState>
        ) : (
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Fecha</th>
                    <th className="px-5 py-3 font-medium">Recovery</th>
                    <th className="px-5 py-3 font-medium">HRV</th>
                    <th className="px-5 py-3 font-medium">FC reposo</th>
                  </tr>
                </thead>
                <tbody>
                  {recovery.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="px-5 py-3">{fmtDate(r.date)}</td>
                      <td
                        className={`px-5 py-3 font-medium ${recoveryColor(r.recovery_score)}`}
                      >
                        {fmt(r.recovery_score)}%
                      </td>
                      <td className="px-5 py-3">{fmt(r.hrv_rmssd)} ms</td>
                      <td className="px-5 py-3">{fmt(r.rhr)} bpm</td>
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
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Recovery, sueño y strain — y qué toca según el plan.
        </p>
      </header>
      {children}
    </>
  );
}
