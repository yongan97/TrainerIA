import { Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SetupNotice, EmptyState } from "@/components/ui/setup-notice";
import { SportBadge } from "@/components/sport-badge";
import { isConfigured, getActivities } from "@/lib/data";
import { fmtDate, fmtDuration, fmtPace } from "@/lib/format";
import type { Activity } from "@/lib/domain/types";

export const dynamic = "force-dynamic";

interface Rec {
  label: string;
  value: string;
  when: string | null;
}

function metric(a: Activity, key: string): number | null {
  const v = (a.metrics as Record<string, number | null> | null)?.[key];
  return typeof v === "number" ? v : null;
}

function best<T>(arr: Activity[], pick: (a: Activity) => number | null, cmp: (x: number, y: number) => boolean) {
  let bestA: Activity | null = null;
  let bestV: number | null = null;
  for (const a of arr) {
    const v = pick(a);
    if (v == null) continue;
    if (bestV == null || cmp(v, bestV)) {
      bestV = v;
      bestA = a;
    }
  }
  return bestA && bestV != null ? { a: bestA, v: bestV } : null;
}

export default async function RecordsPage() {
  if (!isConfigured()) {
    return (
      <Page>
        <SetupNotice title="Falta configurar el entorno" body="Configurá Supabase para ver tus marcas." />
      </Page>
    );
  }
  const activities = await getActivities(1000);
  if (activities.length === 0) {
    return (
      <Page>
        <EmptyState>Todavía no hay actividades para calcular marcas.</EmptyState>
      </Page>
    );
  }

  const bikes = activities.filter((a) => a.sport === "bike");
  const runs = activities.filter((a) => a.sport === "run");
  const gt = (x: number, y: number) => x > y;
  const lt = (x: number, y: number) => x < y;

  const bikeRecs: Rec[] = [];
  const longestBike = best(bikes, (a) => a.distance_m, gt);
  if (longestBike) bikeRecs.push({ label: "Salida más larga", value: `${(longestBike.v / 1000).toFixed(1)} km`, when: longestBike.a.started_at });
  const maxPower = best(bikes, (a) => metric(a, "avg_power"), gt);
  if (maxPower) bikeRecs.push({ label: "Mayor potencia media", value: `${Math.round(maxPower.v)} W`, when: maxPower.a.started_at });
  const maxElev = best(bikes, (a) => a.elevation_gain_m, gt);
  if (maxElev) bikeRecs.push({ label: "Más desnivel", value: `${Math.round(maxElev.v)} m`, when: maxElev.a.started_at });
  const longestBikeTime = best(bikes, (a) => a.duration_s, gt);
  if (longestBikeTime) bikeRecs.push({ label: "Más tiempo en bici", value: fmtDuration(longestBikeTime.v), when: longestBikeTime.a.started_at });

  const runRecs: Rec[] = [];
  const longestRun = best(runs, (a) => a.distance_m, gt);
  if (longestRun) runRecs.push({ label: "Corrida más larga", value: `${(longestRun.v / 1000).toFixed(1)} km`, when: longestRun.a.started_at });
  const fastestPace = best(runs.filter((a) => (a.distance_m ?? 0) >= 3000), (a) => metric(a, "avg_pace_s_per_km"), lt);
  if (fastestPace) runRecs.push({ label: "Pace más rápido (≥3 km)", value: fmtPace(fastestPace.v), when: fastestPace.a.started_at });
  const maxCadence = best(runs, (a) => metric(a, "avg_cadence_spm"), gt);
  if (maxCadence) runRecs.push({ label: "Mayor cadencia", value: `${Math.round(maxCadence.v)} spm`, when: maxCadence.a.started_at });
  const longestRunTime = best(runs, (a) => a.duration_s, gt);
  if (longestRunTime) runRecs.push({ label: "Más tiempo corriendo", value: fmtDuration(longestRunTime.v), when: longestRunTime.a.started_at });

  return (
    <Page>
      <div className="space-y-8">
        <Section sport="bike" title="Ciclismo" recs={bikeRecs} />
        <Section sport="run" title="Running" recs={runRecs} />
      </div>
    </Page>
  );
}

function Section({ sport, title, recs }: { sport: string; title: string; recs: Rec[] }) {
  if (recs.length === 0) return null;
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <SportBadge sport={sport} />
        <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {recs.map((r) => (
          <Card key={r.label}>
            <CardContent className="py-4">
              <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Trophy className="h-3.5 w-3.5 text-yellow-400" />
                {r.label}
              </div>
              <div className="text-2xl font-semibold tabular-nums">{r.value}</div>
              {r.when && <div className="mt-1 text-[11px] text-muted-foreground/70">{fmtDate(r.when)}</div>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Marcas</h1>
        <p className="text-sm text-muted-foreground">Tus mejores registros por deporte.</p>
      </header>
      {children}
    </>
  );
}
