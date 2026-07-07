import Link from "next/link";
import { ArrowRight, Moon, HeartPulse, Activity as ActivityIcon, Flame, CalendarClock, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SetupNotice } from "@/components/ui/setup-notice";
import { SportBadge } from "@/components/sport-badge";
import { isConfigured, isWhoopConnected, getHomeData, getCoachContext } from "@/lib/data";
import { dailyBrief } from "@/lib/coach";
import { CoachCard } from "@/components/coach-card";
import { fmt, fmtDuration, fmtDistance, recoveryColor } from "@/lib/format";
import type { PlannedSession } from "@/lib/domain/types";

export const dynamic = "force-dynamic";

function readiness(score: number | null | undefined) {
  if (score == null) return { label: "Sin dato", advice: "Sincronizá Whoop para ver tu estado.", tone: "muted" as const };
  if (score >= 67) return { label: "Recuperado", advice: "Buen día para meter calidad.", tone: "good" as const };
  if (score >= 34) return { label: "Precaución", advice: "Modulá la intensidad, escuchá el cuerpo.", tone: "warn" as const };
  return { label: "Recovery bajo", advice: "Priorizá recuperar: suave o descanso.", tone: "bad" as const };
}

function isHardSession(p: PlannedSession): boolean {
  const codigo = (p.targets as { codigo?: string })?.codigo;
  return codigo === "T1" || /t1|series|pasada|calidad|interval/i.test(p.type ?? "");
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "Buenas noches";
  if (h < 13) return "Buen día";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}

export default async function OverviewPage() {
  if (!isConfigured()) {
    return (
      <Page>
        <SetupNotice
          title="Falta configurar el entorno"
          body="Definí las variables de Supabase (ver .env.example) y aplicá la migración."
        />
      </Page>
    );
  }
  const connected = await isWhoopConnected();
  const today = new Date().toISOString().slice(0, 10);
  const [home, coachCtx] = await Promise.all([getHomeData(today), getCoachContext(today)]);
  const brief = dailyBrief(coachCtx);
  const r = home.recovery;
  const rd = readiness(r?.recovery_score);
  const trained = home.trained.filter((a) => a.sport !== "increase_relaxation");
  const hardToday = home.next && home.nextIsToday && isHardSession(home.next);
  const conflict = hardToday && (r?.recovery_score ?? 100) < 50;

  const toneRing: Record<string, string> = {
    good: "ring-primary/40",
    warn: "ring-yellow-400/40",
    bad: "ring-red-400/40",
    muted: "ring-border",
  };

  return (
    <Page>
      {!connected && (
        <SetupNotice
          title="Conectá tu cuenta de Whoop"
          body="Autorizá el acceso para traer recovery, sueño, strain y entrenamientos."
          cta={{ href: "/api/whoop/auth", label: "Conectar Whoop" }}
        />
      )}

      {/* RECOMENDACIÓN DEL COACH */}
      {connected && <CoachCard brief={brief} />}

      {/* CÓMO ESTOY — hero */}
      <Card className={`ring-1 ${toneRing[rd.tone]}`}>
        <CardContent className="flex flex-col gap-6 py-6 sm:flex-row sm:items-center">
          <div className="flex items-baseline gap-3">
            <div className={`text-6xl font-bold tabular-nums ${recoveryColor(r?.recovery_score)}`}>
              {fmt(r?.recovery_score)}
              <span className="text-2xl font-normal text-muted-foreground">%</span>
            </div>
            <div>
              <div className={`text-lg font-semibold ${recoveryColor(r?.recovery_score)}`}>{rd.label}</div>
              <div className="max-w-[16rem] text-sm text-muted-foreground">{rd.advice}</div>
            </div>
          </div>
          <div className="grid flex-1 grid-cols-3 gap-4 sm:border-l sm:border-border sm:pl-6">
            <Mini icon={HeartPulse} label="HRV" value={fmt(r?.hrv_rmssd)} unit="ms" />
            <Mini icon={ActivityIcon} label="FC reposo" value={fmt(r?.rhr)} unit="bpm" />
            <Mini icon={Moon} label="Sueño" value={fmtDuration(home.sleepDurationS)} unit="" />
          </div>
        </CardContent>
      </Card>

      {/* aviso inteligente plan vs recovery */}
      {conflict && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Hoy toca <b>{home.next?.type}</b> (sesión de calidad) pero tu recovery está en{" "}
            {fmt(r?.recovery_score)}%. Considerá moverla, acortarla o bajarle intensidad.
          </span>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* PRÓXIMO ENTRENAMIENTO */}
        <Card>
          <CardContent className="py-5">
            <SectionTitle icon={CalendarClock}>
              {home.nextIsToday ? "Qué toca hoy" : "Próximo entrenamiento"}
            </SectionTitle>
            {home.next ? (
              <div className="mt-3">
                <div className="flex items-center gap-3">
                  <SportBadge sport={home.next.sport} />
                  <span className="font-medium">{home.next.type ?? "Sesión"}</span>
                  {!home.nextIsToday && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {new Date(home.next.date + "T00:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "2-digit", month: "short" })}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {(home.next.targets as { notas?: string })?.notas ??
                    fmtDuration(home.next.target_duration_s)}
                </p>
                <Link href="/plan" className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline">
                  Ver plan <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <div className="mt-3 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">No hay nada planificado.</p>
                <Link href="/plan" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                  Cargar plan <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ¿YA ENTRENÉ? + STRAIN */}
        <Card>
          <CardContent className="py-5">
            <SectionTitle icon={Flame}>Hoy · entrenamiento y strain</SectionTitle>
            <div className="mt-3">
              <div className="mb-3 flex items-baseline gap-2">
                <span className="text-3xl font-semibold tabular-nums">{fmt(home.todayStrain, 1)}</span>
                <span className="text-sm text-muted-foreground">strain del día (Whoop)</span>
              </div>
              {trained.length === 0 ? (
                <p className="text-sm text-muted-foreground">Todavía no entrenaste hoy.</p>
              ) : (
                <ul className="space-y-2">
                  {trained.map((a) => (
                    <li key={a.id} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <SportBadge sport={a.sport} showLabel={false} />
                      <span>{fmtDuration(a.duration_s)}</span>
                      {a.distance_m && <span className="text-muted-foreground">· {fmtDistance(a.distance_m)}</span>}
                      {a.avg_hr && <span className="text-muted-foreground">· {a.avg_hr} bpm</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}

function Mini({ icon: Icon, label, value, unit }: { icon: typeof Moon; label: string; value: string; unit: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 text-xl font-semibold tabular-nums">
        {value}
        {unit && value !== "—" && <span className="ml-1 text-xs font-normal text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, children }: { icon: typeof Moon; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
      <Icon className="h-4 w-4" />
      {children}
    </div>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{greeting()}, Juan</h1>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("es-AR", { weekday: "long", day: "2-digit", month: "long" })}
        </p>
      </header>
      {children}
    </>
  );
}
