import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { SportBadge } from "@/components/sport-badge";
import { HrZones } from "@/components/hr-zones";
import { GarminSplits } from "@/components/charts/garmin-splits";
import { FeedbackForm } from "@/components/forms/feedback-form";
import { getActivity, getRecovery, getPlanned, getSettings } from "@/lib/data";
import { getSport } from "@/lib/sports/registry";
import { isIndoorBike } from "@/lib/activities";
import { fmt, fmtDate, fmtDistance, fmtDuration, fmtPace, recoveryColor } from "@/lib/format";

export const dynamic = "force-dynamic";

function fmtMetric(key: string, value: number | null): string {
  if (value == null) return "—";
  if (key === "avg_pace_s_per_km") return fmtPace(value);
  if (key.includes("intensity_factor")) return value.toFixed(2);
  return Math.round(value).toString();
}

export default async function ActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const activity = await getActivity(id);
  if (!activity) notFound();

  const day = activity.started_at.slice(0, 10);
  const [recovery, planned, settings] = await Promise.all([getRecovery(120), getPlanned(300), getSettings()]);
  const rec = recovery.find((r) => r.date === day);
  const plan = planned.find((p) => p.date === day && p.sport === activity.sport);
  const sportCfg = getSport(activity.sport);
  const metrics = (activity.metrics ?? {}) as Record<string, number | null>;
  const indoor = isIndoorBike(activity);

  // Métricas por potencia (bici) usando FTP de configuración.
  let intensity: { if: number; tss: number } | null = null;
  if (activity.sport === "bike" && settings?.ftp) {
    const np = metrics.normalized_power ?? metrics.avg_power;
    if (np && activity.duration_s) {
      const ifv = np / settings.ftp;
      const tss = ((activity.duration_s * np * ifv) / (settings.ftp * 3600)) * 100;
      intensity = { if: Math.round(ifv * 100) / 100, tss: Math.round(tss) };
    }
  }

  return (
    <>
      <Link href="/calendar" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Volver al calendario
      </Link>

      <header className="mb-6 flex items-center gap-3">
        <SportBadge sport={activity.sport} />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {sportCfg?.label ?? activity.sport}
            {indoor && <span className="ml-2 text-sm font-normal text-muted-foreground">· indoor</span>}
          </h1>
          <p className="text-sm text-muted-foreground">{fmtDate(activity.started_at)} · fuente {activity.source}</p>
        </div>
      </header>

      {/* Objetivo vs real */}
      {plan && (
        <Card className="mb-6 border-primary/30">
          <CardContent className="flex items-start gap-3 py-4">
            <Target className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <div className="text-sm font-medium">Plan del día: {plan.type ?? "Sesión"}</div>
              <p className="text-sm text-muted-foreground">
                {(plan.targets as { notas?: string })?.notas ?? "—"}
                {plan.target_duration_s ? ` · objetivo ${fmtDuration(plan.target_duration_s)}` : ""}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Duración" value={fmtDuration(activity.duration_s)} />
        <Stat label="Distancia" value={fmtDistance(activity.distance_m)} />
        <Stat label="FC media" value={fmt(activity.avg_hr)} suffix="bpm" />
        {intensity ? (
          <Stat label="TSS · IF" value={`${intensity.tss} · ${intensity.if}`} hint="por potencia (FTP)" />
        ) : (
          <Stat label="Strain" value={fmt(activity.strain, 1)} />
        )}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Métricas del deporte */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Métricas de {sportCfg?.label ?? "la actividad"}</CardTitle>
          </CardHeader>
          <CardContent>
            {sportCfg ? (
              <dl className="grid grid-cols-2 gap-4">
                {sportCfg.metrics.map((m) => (
                  <div key={m.key}>
                    <dt className="text-xs text-muted-foreground">{m.label}</dt>
                    <dd className="text-lg font-semibold tabular-nums">
                      {fmtMetric(m.key, metrics[m.key] ?? null)}
                      {m.unit && metrics[m.key] != null && <span className="ml-1 text-xs font-normal text-muted-foreground">{m.unit}</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">Deporte sin métricas específicas.</p>
            )}
          </CardContent>
        </Card>

        {/* Whoop de esa mañana */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Recovery de esa mañana (Whoop)</CardTitle>
          </CardHeader>
          <CardContent>
            {rec ? (
              <div className="grid grid-cols-2 gap-4">
                <Metric label="Recovery" value={`${fmt(rec.recovery_score)}%`} className={recoveryColor(rec.recovery_score)} />
                <Metric label="HRV" value={`${fmt(rec.hrv_rmssd)} ms`} />
                <Metric label="FC reposo" value={`${fmt(rec.rhr)} bpm`} />
                <Metric label="SpO₂" value={`${fmt(rec.spo2, 1)}%`} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hay recovery de Whoop para este día.</p>
            )}
          </CardContent>
        </Card>

        {/* Zonas de FC */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-foreground">Distribución de frecuencia cardíaca</CardTitle>
          </CardHeader>
          <CardContent>
            <HrZones zones={activity.hr_zones} />
          </CardContent>
        </Card>

        {/* Efecto del entrenamiento (Garmin) */}
        {(metrics.aerobic_te != null || metrics.vo2max != null || metrics.garmin_load != null) && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-foreground">Efecto del entrenamiento (Garmin)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Metric label="Efecto aeróbico" value={metrics.aerobic_te != null ? metrics.aerobic_te.toFixed(1) : "—"} />
                <Metric label="Efecto anaeróbico" value={metrics.anaerobic_te != null ? metrics.anaerobic_te.toFixed(1) : "—"} />
                <Metric label="Carga (Garmin)" value={metrics.garmin_load != null ? String(Math.round(metrics.garmin_load)) : "—"} />
                <Metric label="VO₂max" value={metrics.vo2max != null ? String(Math.round(metrics.vo2max)) : "—"} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sensaciones (RPE) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-foreground">Sensaciones</CardTitle>
          </CardHeader>
          <CardContent>
            {activity.rpe != null && activity.strain != null && (
              <p className="mb-4 rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
                {activity.rpe * 2.1 > activity.strain * 1.25
                  ? "Lo sentiste más duro de lo que muestra el strain — puede ser fatiga acumulada o mal descanso."
                  : activity.rpe * 2.1 < activity.strain * 0.75
                    ? "Lo sentiste más fácil de lo que muestra el strain — buena señal de forma."
                    : "Tu esfuerzo percibido coincide con el strain fisiológico."}
              </p>
            )}
            <FeedbackForm activityId={activity.id} initialRpe={activity.rpe} initialFeel={activity.feel} initialNotes={activity.user_notes} />
          </CardContent>
        </Card>

        {/* Splits de Garmin (por vuelta) */}
        {activity.source === "garmin" && activity.external_id?.startsWith("garmin:") && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-foreground">
                {activity.sport === "bike" ? "Potencia por vuelta" : "Ritmo por vuelta"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GarminSplits id={activity.external_id.replace("garmin:", "")} sport={activity.sport} />
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}

function Metric({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-lg font-semibold tabular-nums ${className ?? ""}`}>{value}</div>
    </div>
  );
}
