import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SetupNotice, EmptyState } from "@/components/ui/setup-notice";
import { isConfigured, getActivities } from "@/lib/data";
import { PaceScatter, type PacePoint } from "@/components/charts/pace-scatter";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const RIEGEL = 1.06;
const TARGETS = [
  { name: "5K", d: 5000 },
  { name: "10K", d: 10000 },
  { name: "21K", d: 21097 },
  { name: "42K", d: 42195 },
];

function hms(sec: number): string {
  const total = Math.round(sec);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}` : `${m}:${s.toString().padStart(2, "0")}`;
}
function pacePerKm(sec: number, meters: number): string {
  const total = Math.round(sec / (meters / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}/km`;
}

export default async function PredictorPage() {
  if (!isConfigured()) {
    return (
      <Page>
        <SetupNotice title="Falta configurar el entorno" body="Configurá Supabase." />
      </Page>
    );
  }
  const activities = await getActivities(500);
  const since = new Date(Date.now() - 60 * 86_400_000).toISOString();
  const runs = activities.filter(
    (a) => a.sport === "run" && a.started_at >= since && (a.distance_m ?? 0) >= 3000 && (a.duration_s ?? 0) > 0,
  );

  if (runs.length === 0) {
    return (
      <Page>
        <EmptyState>Necesito al menos una corrida de 3 km o más (últimos 60 días) para predecir.</EmptyState>
      </Page>
    );
  }

  // Mejor esfuerzo: la corrida cuyo equivalente a 10K es más rápido.
  let ref = runs[0];
  let bestEq = Infinity;
  for (const r of runs) {
    const eq = (r.duration_s as number) * Math.pow(10000 / (r.distance_m as number), RIEGEL);
    if (eq < bestEq) { bestEq = eq; ref = r; }
  }

  const predictions = TARGETS.map((t) => {
    const sec = (ref.duration_s as number) * Math.pow(t.d / (ref.distance_m as number), RIEGEL);
    return { ...t, sec };
  });

  const pacePts: PacePoint[] = runs.map((r) => ({
    km: Math.round((r.distance_m! / 1000) * 10) / 10,
    pace: r.duration_s! / (r.distance_m! / 1000),
    date: fmtDate(r.started_at),
  }));

  return (
    <Page>
      <Card className="mb-6">
        <CardContent className="py-4 text-sm text-muted-foreground">
          Basado en tu mejor esfuerzo reciente: <span className="text-foreground">{(ref.distance_m! / 1000).toFixed(1)} km en {hms(ref.duration_s!)}</span> ({pacePerKm(ref.duration_s!, ref.distance_m!)}) del {fmtDate(ref.started_at)}. Proyección con fórmula de Riegel.
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {predictions.map((p) => (
          <Card key={p.name}>
            <CardContent className="py-5 text-center">
              <div className="text-xs text-muted-foreground">{p.name}</div>
              <div className="mt-1 text-3xl font-bold tabular-nums">{hms(p.sec)}</div>
              <div className="mt-1 text-xs text-muted-foreground">{pacePerKm(p.sec, p.d)}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        La predicción asume entrenamiento específico para la distancia. A mayor distancia respecto a tu esfuerzo de referencia, mayor la incertidumbre.
      </p>

      {pacePts.length >= 4 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-foreground">Tu perfil pace–distancia</CardTitle>
            <p className="text-xs text-muted-foreground">Cada punto es una salida. Más arriba = más rápido. Muestra cómo aguantás el ritmo a más distancia.</p>
          </CardHeader>
          <CardContent>
            <PaceScatter data={pacePts} />
          </CardContent>
        </Card>
      )}
    </Page>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Predictor de carreras</h1>
        <p className="text-sm text-muted-foreground">Tiempos estimados por distancia según tus salidas recientes.</p>
      </header>
      {children}
    </>
  );
}
