import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { SetupNotice, EmptyState } from "@/components/ui/setup-notice";
import { isConfigured, getSettings, getActivities, getCycles } from "@/lib/data";
import { computePmc } from "@/lib/analytics";

export const dynamic = "force-dynamic";

const RIEGEL = 1.06;

function hms(sec: number): string {
  const t = Math.round(sec);
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
  return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}` : `${m}:${s.toString().padStart(2, "0")}`;
}
function pace(sec: number, meters: number): string {
  const t = Math.round(sec / (meters / 1000));
  return `${Math.floor(t / 60)}:${(t % 60).toString().padStart(2, "0")}/km`;
}

export default async function RacePage() {
  if (!isConfigured()) {
    return (
      <Page>
        <SetupNotice title="Falta configurar el entorno" body="Configurá Supabase." />
      </Page>
    );
  }
  const settings = await getSettings();
  if (!settings?.goal_date || !settings?.goal_distance_km) {
    return (
      <Page>
        <EmptyState>
          Cargá tu carrera objetivo (nombre, fecha y distancia) en{" "}
          <Link href="/settings" className="text-primary hover:underline">Configuración</Link>.
        </EmptyState>
      </Page>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const daysToRace = Math.ceil((new Date(settings.goal_date + "T00:00:00").getTime() - new Date(today + "T00:00:00").getTime()) / 86_400_000);
  const goalMeters = settings.goal_distance_km * 1000;

  const [activities, cycles] = await Promise.all([getActivities(500), getCycles(90)]);
  const since = new Date(Date.now() - 60 * 86_400_000).toISOString();
  const runs = activities.filter((a) => a.sport === "run" && a.started_at >= since && (a.distance_m ?? 0) >= 3000 && (a.duration_s ?? 0) > 0);

  let predicted: number | null = null;
  if (runs.length) {
    let best = Infinity;
    for (const r of runs) {
      const eq = (r.duration_s as number) * Math.pow(goalMeters / (r.distance_m as number), RIEGEL);
      if (eq < best) best = eq;
    }
    predicted = best;
  }

  // Forma actual (TSB)
  const byDay = new Map(cycles.map((c) => [c.date, c.day_strain ?? 0]));
  const dates: string[] = [];
  const start = new Date(Date.now() - 89 * 86_400_000);
  for (let d = new Date(start); d <= new Date(); d.setUTCDate(d.getUTCDate() + 1)) dates.push(d.toISOString().slice(0, 10));
  const pmc = computePmc(dates.map((d) => byDay.get(d) ?? 0));
  const tsb = pmc.length ? pmc[pmc.length - 1].tsb : null;

  // Consejo de taper
  let advice: string;
  if (daysToRace <= 0) advice = "¡Es hoy! Confiá en el trabajo hecho. Calentá bien y salí a disfrutar.";
  else if (daysToRace <= 7) advice = `Semana de afinamiento: bajá el volumen ~40-50%, mantené algo de intensidad corta. ${tsb != null && tsb < -3 ? "Venís cargado — prioridad total al descanso." : "Buscá llegar fresco (forma positiva)."}`;
  else if (daysToRace <= 21) advice = "Fase de pico: sostené la intensidad, empezá a recortar el volumen las últimas 2 semanas.";
  else advice = "Fase de construcción: seguí sumando fitness de forma progresiva; el afinamiento viene después.";

  return (
    <Page>
      <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-6 text-center">
        <div className="text-sm text-muted-foreground">🎯 {settings.goal_name ?? "Carrera objetivo"} · {settings.goal_distance_km} km</div>
        <div className="mt-2 text-4xl font-bold text-primary sm:text-5xl">{daysToRace <= 0 ? "¡Hoy!" : daysToRace}</div>
        {daysToRace > 0 && <div className="text-sm text-muted-foreground">días para la carrera · {new Date(settings.goal_date + "T00:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "2-digit", month: "long" })}</div>}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="Tiempo estimado" value={predicted != null ? hms(predicted) : "—"} hint={predicted != null ? pace(predicted, goalMeters) : "sin datos de running"} />
        <Stat label="Forma actual (TSB)" value={tsb != null ? tsb.toFixed(1) : "—"} className={tsb != null && tsb >= 0 ? "text-primary" : "text-yellow-400"} />
        <Stat label="Distancia" value={String(settings.goal_distance_km)} suffix="km" />
      </div>

      <Card>
        <CardContent className="py-5">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">Plan hacia la carrera</div>
          <p className="text-[15px] leading-relaxed">{advice}</p>
        </CardContent>
      </Card>
    </Page>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Carrera objetivo</h1>
        <p className="text-sm text-muted-foreground">Cuenta regresiva, tiempo estimado y plan de afinamiento.</p>
      </header>
      {children}
    </>
  );
}
