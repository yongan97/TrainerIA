import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SetupNotice } from "@/components/ui/setup-notice";
import { WeeklyLoad, type WeeklyLoadPoint } from "@/components/charts/weekly-load";
import { ConsistencyHeatmap, type HeatDay } from "@/components/consistency-heatmap";
import { isConfigured, getActivities, getRecovery, getCycles, getSleep, getPlanned } from "@/lib/data";
import { minutesOf } from "@/lib/activities";

export const dynamic = "force-dynamic";

function mondayOf(d: Date): Date {
  const x = new Date(d);
  const day = (x.getUTCDay() + 6) % 7;
  x.setUTCDate(x.getUTCDate() - day);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

export default async function WeekPage() {
  if (!isConfigured()) {
    return (
      <Page>
        <SetupNotice title="Falta configurar el entorno" body="Configurá Supabase para el resumen semanal." />
      </Page>
    );
  }

  const [activities, recovery, cycles, sleep, planned] = await Promise.all([
    getActivities(600),
    getRecovery(90),
    getCycles(90),
    getSleep(90),
    getPlanned(300),
  ]);

  const thisMon = mondayOf(new Date());
  const weekStart = (offset: number) => {
    const d = new Date(thisMon);
    d.setUTCDate(thisMon.getUTCDate() - offset * 7);
    return d;
  };
  const inWeek = (dateStr: string, monday: Date) => {
    const d = new Date(dateStr.length <= 10 ? dateStr + "T00:00:00Z" : dateStr);
    const end = new Date(monday);
    end.setUTCDate(monday.getUTCDate() + 7);
    return d >= monday && d < end;
  };

  function aggregate(monday: Date) {
    const acts = activities.filter((a) => inWeek(a.started_at, monday));
    const run = acts.filter((a) => a.sport === "run").reduce((s, a) => s + minutesOf(a), 0);
    const bike = acts.filter((a) => a.sport === "bike").reduce((s, a) => s + minutesOf(a), 0);
    const recs = recovery.filter((r) => inWeek(r.date, monday)).map((r) => r.recovery_score).filter((v): v is number => v != null);
    const sleeps = sleep.filter((s) => inWeek(s.date, monday)).map((s) => s.duration_s).filter((v): v is number => v != null);
    const strain = cycles.filter((c) => inWeek(c.date, monday)).reduce((s, c) => s + (c.day_strain ?? 0), 0);
    const plans = planned.filter((p) => inWeek(p.date, monday));
    const done = plans.filter((p) => acts.some((a) => a.sport === p.sport)).length;
    return {
      sessions: acts.length,
      runMin: Math.round(run),
      bikeMin: Math.round(bike),
      totalMin: Math.round(run + bike),
      avgRec: recs.length ? Math.round(recs.reduce((a, b) => a + b, 0) / recs.length) : null,
      avgSleepH: sleeps.length ? sleeps.reduce((a, b) => a + b, 0) / sleeps.length / 3600 : null,
      strain: Math.round(strain),
      adherence: plans.length ? Math.round((done / plans.length) * 100) : null,
    };
  }

  const cur = aggregate(weekStart(0));
  const prev = aggregate(weekStart(1));

  // Narrativa del entrenador
  const parts: string[] = [];
  const volDelta = prev.totalMin > 0 ? Math.round((cur.totalMin / prev.totalMin - 1) * 100) : null;
  if (cur.totalMin > 0) {
    parts.push(
      volDelta == null
        ? `Llevás ${cur.totalMin} min de entrenamiento en ${cur.sessions} sesiones.`
        : `Entrenaste ${cur.totalMin} min (${volDelta >= 0 ? "+" : ""}${volDelta}% vs la semana pasada) en ${cur.sessions} sesiones.`,
    );
  } else {
    parts.push("Semana tranquila: todavía sin volumen registrado.");
  }
  if (cur.runMin && cur.bikeMin) parts.push(`Repartido entre ${cur.runMin} min de running y ${cur.bikeMin} de bici.`);
  if (cur.avgRec != null) parts.push(`Recovery promedio ${cur.avgRec}%${prev.avgRec != null ? (cur.avgRec >= prev.avgRec ? ", mejor que la semana previa" : ", algo por debajo de la previa") : ""}.`);
  if (cur.avgSleepH != null) parts.push(`Dormiste ${cur.avgSleepH.toFixed(1)} h de media${cur.avgSleepH < 7.5 ? " — hay margen para descansar más" : ""}.`);
  if (cur.adherence != null) parts.push(`Cumpliste el ${cur.adherence}% del plan.`);
  if (volDelta != null && volDelta > 15) parts.push("Ojo con el salto de carga: subí de a poco para cuidar la rodilla.");
  else if (cur.totalMin > 0 && cur.avgRec != null && cur.avgRec >= 60) parts.push("Buen equilibrio carga/recuperación: seguí así.");
  const narrative = parts.join(" ");

  const chart: WeeklyLoadPoint[] = [];
  for (let i = 7; i >= 0; i--) {
    const m = weekStart(i);
    const a = aggregate(m);
    chart.push({ label: m.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }), run: a.runMin, bike: a.bikeMin });
  }

  // Mapa de calor de consistencia (últimos ~112 días)
  const minByDay = new Map<string, number>();
  for (const a of activities) {
    if (a.sport !== "run" && a.sport !== "bike") continue;
    const d = a.started_at.slice(0, 10);
    minByDay.set(d, (minByDay.get(d) ?? 0) + minutesOf(a));
  }
  const heat: HeatDay[] = [];
  const base = new Date();
  for (let i = 111; i >= 0; i--) {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    heat.push({ date: key, minutes: minByDay.get(key) ?? 0 });
  }

  return (
    <Page>
      <div className="mb-6 rounded-xl border border-border bg-card/60 p-5">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">Resumen del entrenador</div>
        <p className="text-[15px] leading-relaxed">{narrative}</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Delta label="Volumen" value={`${cur.totalMin} min`} cur={cur.totalMin} prev={prev.totalMin} />
        <Delta label="Sesiones" value={String(cur.sessions)} cur={cur.sessions} prev={prev.sessions} />
        <Delta label="Recovery medio" value={cur.avgRec != null ? `${cur.avgRec}%` : "—"} cur={cur.avgRec ?? 0} prev={prev.avgRec ?? 0} />
        <Delta label="Sueño medio" value={cur.avgSleepH != null ? `${cur.avgSleepH.toFixed(1)} h` : "—"} cur={cur.avgSleepH ?? 0} prev={prev.avgSleepH ?? 0} />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Simple label="Running" value={`${cur.runMin} min`} />
        <Simple label="Ciclismo" value={`${cur.bikeMin} min`} />
        <Simple label="Adherencia" value={cur.adherence != null ? `${cur.adherence}%` : "—"} />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-foreground">Volumen por semana (8 semanas)</CardTitle>
          <p className="text-xs text-muted-foreground">Minutos por deporte, apilado</p>
        </CardHeader>
        <CardContent>
          <WeeklyLoad data={chart} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Consistencia (16 semanas)</CardTitle>
          <p className="text-xs text-muted-foreground">Cada celda es un día; más verde = más minutos</p>
        </CardHeader>
        <CardContent>
          <ConsistencyHeatmap days={heat} />
        </CardContent>
      </Card>
    </Page>
  );
}

function Delta({ label, value, cur, prev }: { label: string; value: string; cur: number; prev: number }) {
  const diff = cur - prev;
  const pct = prev > 0 ? Math.round((diff / prev) * 100) : null;
  const up = diff > 0;
  const flat = Math.abs(diff) < 0.01 || pct === 0;
  const Icon = flat ? Minus : up ? ArrowUp : ArrowDown;
  const color = flat ? "text-muted-foreground" : up ? "text-primary" : "text-red-400";
  return (
    <Card>
      <CardContent className="py-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
        <div className={`mt-1 flex items-center gap-1 text-[11px] ${color}`}>
          <Icon className="h-3 w-3" />
          {pct != null ? `${pct > 0 ? "+" : ""}${pct}% vs sem. previa` : "vs sem. previa"}
        </div>
      </CardContent>
    </Card>
  );
}
function Simple({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Semana</h1>
        <p className="text-sm text-muted-foreground">Resumen semanal con comparación vs la semana previa.</p>
      </header>
      {children}
    </>
  );
}
