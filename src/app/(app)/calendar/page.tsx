import Link from "next/link";
import { Check, X, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { SetupNotice, EmptyState } from "@/components/ui/setup-notice";
import { SportBadge } from "@/components/sport-badge";
import { isConfigured, getActivities, getPlanned, getDailySummary } from "@/lib/data";
import { isIndoorBike } from "@/lib/activities";
import { fmt, fmtDate, fmtDuration, recoveryColor } from "@/lib/format";
import type { Activity, PlannedSession } from "@/lib/domain/types";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  if (!isConfigured()) {
    return (
      <Page>
        <SetupNotice title="Falta configurar el entorno" body="Configurá Supabase para ver el calendario." />
      </Page>
    );
  }

  const [daily, activities, planned] = await Promise.all([
    getDailySummary(45),
    getActivities(300),
    getPlanned(300),
  ]);
  const today = new Date().toISOString().slice(0, 10);

  const actByDay = new Map<string, Activity[]>();
  for (const a of activities) {
    const d = a.started_at.slice(0, 10);
    (actByDay.get(d) ?? actByDay.set(d, []).get(d)!).push(a);
  }
  const planByDay = new Map<string, PlannedSession[]>();
  for (const p of planned) (planByDay.get(p.date) ?? planByDay.set(p.date, []).get(p.date)!).push(p);

  // ¿Una sesión planificada tiene ejecución que la matchee? (mismo día + deporte)
  const isDone = (p: PlannedSession) =>
    (actByDay.get(p.date) ?? []).some((a) => a.sport === p.sport);

  // Adherencia sobre sesiones pasadas
  const pastPlanned = planned.filter((p) => p.date <= today);
  const doneCount = pastPlanned.filter(isDone).length;
  const adherence = pastPlanned.length ? Math.round((doneCount / pastPlanned.length) * 100) : null;

  if (daily.length === 0 && planned.length === 0) {
    return (
      <Page>
        <EmptyState>Sin días para mostrar todavía.</EmptyState>
      </Page>
    );
  }

  return (
    <Page>
      <div className="mb-6 grid grid-cols-3 gap-4">
        <Stat label="Adherencia al plan" value={adherence == null ? "—" : String(adherence)} suffix="%" hint={`${doneCount}/${pastPlanned.length} sesiones`} />
        <Stat label="Sesiones cumplidas" value={String(doneCount)} hint="hasta hoy" />
        <Stat label="Pendientes" value={String(pastPlanned.length - doneCount)} hint="planificadas sin ejecutar" />
      </div>

      <div className="space-y-3">
        {daily.map((day) => {
          const acts = actByDay.get(day.date) ?? [];
          const plans = planByDay.get(day.date) ?? [];
          return (
            <Card key={day.date}>
              <CardContent className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-[120px_1fr_1fr_1fr]">
                <div className="text-sm font-medium">{fmtDate(day.date)}</div>

                <Column title="Planificado">
                  {plans.length === 0 ? <Dash /> : plans.map((p) => {
                    const done = isDone(p);
                    const past = p.date <= today;
                    return (
                      <div key={p.id} className="flex items-center gap-2">
                        {done ? (
                          <Check className="h-3.5 w-3.5 text-primary" />
                        ) : past ? (
                          <X className="h-3.5 w-3.5 text-red-400/70" />
                        ) : (
                          <Clock className="h-3.5 w-3.5 text-muted-foreground/60" />
                        )}
                        <SportBadge sport={p.sport} showLabel={false} />
                        <span className="text-xs text-muted-foreground">{p.type ?? "Sesión"}</span>
                      </div>
                    );
                  })}
                </Column>

                <Column title="Ejecutado">
                  {acts.length === 0 ? <Dash /> : acts.map((a) => (
                    <Link key={a.id} href={`/activity/${a.id}`} className="flex items-center gap-2 hover:opacity-80">
                      <SportBadge sport={a.sport} showLabel={false} />
                      <span className="text-xs text-muted-foreground">
                        {fmtDuration(a.duration_s)}
                        {isIndoorBike(a) ? " · indoor" : ""}
                      </span>
                    </Link>
                  ))}
                </Column>

                <Column title="Tolerado">
                  {day.recovery_score == null && day.day_strain == null ? <Dash /> : (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      <span className={recoveryColor(day.recovery_score)}>Rec {fmt(day.recovery_score)}%</span>
                      <span className="text-muted-foreground">Strain {fmt(day.day_strain, 1)}</span>
                    </div>
                  )}
                </Column>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </Page>
  );
}

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">{title}</div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}
function Dash() {
  return <span className="text-xs text-muted-foreground/50">—</span>;
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Calendario</h1>
        <p className="text-sm text-muted-foreground">Planificado vs ejecutado vs tolerado, con adherencia al plan.</p>
      </header>
      {children}
    </>
  );
}
