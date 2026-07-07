import Link from "next/link";
import { getAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SyncButton } from "@/components/sync-button";
import type { WhoopRecovery } from "@/lib/domain/types";

// Siempre dinámico: leemos datos frescos de Supabase en cada request.
export const dynamic = "force-dynamic";

interface LoadResult {
  configured: boolean;
  connected: boolean;
  recovery: WhoopRecovery[];
  error?: string;
}

async function loadOverview(): Promise<LoadResult> {
  // Sin env configurado (ej. build sin secrets) no rompemos: mostramos el setup.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return { configured: false, connected: false, recovery: [] };
  }
  try {
    const db = getAdminClient();
    const [{ data: recovery, error }, { count }] = await Promise.all([
      db
        .from("whoop_recovery")
        .select("*")
        .order("date", { ascending: false })
        .limit(14),
      db.from("oauth_tokens").select("provider", { count: "exact", head: true }),
    ]);
    if (error) return { configured: true, connected: false, recovery: [], error: error.message };
    return {
      configured: true,
      connected: (count ?? 0) > 0,
      recovery: (recovery ?? []) as WhoopRecovery[],
    };
  } catch (e) {
    return {
      configured: true,
      connected: false,
      recovery: [],
      error: e instanceof Error ? e.message : "error",
    };
  }
}

function fmt(n: number | null, digits = 0): string {
  return n == null ? "—" : n.toFixed(digits);
}

function recoveryColor(score: number | null): string {
  if (score == null) return "text-muted-foreground";
  if (score >= 67) return "text-primary";
  if (score >= 34) return "text-yellow-400";
  return "text-red-400";
}

export default async function OverviewPage() {
  const { configured, connected, recovery, error } = await loadOverview();
  const latest = recovery[0];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">TrainerIA</h1>
          <p className="text-sm text-muted-foreground">
            Recovery · Sueño · Strain — planificado vs ejecutado vs tolerado
          </p>
        </div>
        {configured && connected && <SyncButton />}
      </header>

      {!configured && (
        <SetupNotice
          title="Falta configurar el entorno"
          body="Definí NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (ver .env.example) y aplicá la migración de supabase/migrations."
        />
      )}

      {configured && !connected && (
        <SetupNotice
          title="Conectá tu cuenta de Whoop"
          body="Autorizá el acceso vía OAuth para empezar a traer tu recovery, sueño, strain y entrenamientos."
          cta={{ href: "/api/whoop/auth", label: "Conectar Whoop" }}
        />
      )}

      {error && (
        <p className="mb-6 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {configured && connected && (
        <>
          <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat
              label="Recovery"
              value={fmt(latest?.recovery_score)}
              suffix="%"
              className={recoveryColor(latest?.recovery_score ?? null)}
            />
            <Stat label="HRV" value={fmt(latest?.hrv_rmssd, 0)} suffix="ms" />
            <Stat label="FC reposo" value={fmt(latest?.rhr, 0)} suffix="bpm" />
            <Stat label="SpO₂" value={fmt(latest?.spo2, 1)} suffix="%" />
          </section>

          <section className="mt-8">
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">
              Últimos 14 días
            </h2>
            <Card>
              <CardContent className="p-0">
                {recovery.length === 0 ? (
                  <p className="p-5 text-sm text-muted-foreground">
                    Sin datos todavía. Tocá “Sincronizar Whoop”.
                  </p>
                ) : (
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
                        <tr key={r.id} className="border-b border-border/50 last:border-0">
                          <td className="px-5 py-3">{r.date}</td>
                          <td className={`px-5 py-3 font-medium ${recoveryColor(r.recovery_score)}`}>
                            {fmt(r.recovery_score)}%
                          </td>
                          <td className="px-5 py-3">{fmt(r.hrv_rmssd)} ms</td>
                          <td className="px-5 py-3">{fmt(r.rhr)} bpm</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </main>
  );
}

function Stat({
  label,
  value,
  suffix,
  className,
}: {
  label: string;
  value: string;
  suffix?: string;
  className?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-semibold tabular-nums ${className ?? ""}`}>
          {value}
          {suffix && value !== "—" && (
            <span className="ml-1 text-base font-normal text-muted-foreground">
              {suffix}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SetupNotice({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta?: { href: string; label: string };
}) {
  return (
    <Card className="mb-6">
      <CardContent className="flex flex-col items-start gap-3 py-6">
        <h2 className="text-lg font-medium">{title}</h2>
        <p className="max-w-prose text-sm text-muted-foreground">{body}</p>
        {cta && (
          <Link
            href={cta.href}
            className="mt-1 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            {cta.label}
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
