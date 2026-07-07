import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { SportBadge } from "@/components/sport-badge";
import { getActivity, getRecovery } from "@/lib/data";
import { getSport } from "@/lib/sports/registry";
import {
  fmt,
  fmtDate,
  fmtDistance,
  fmtDuration,
  fmtPace,
  recoveryColor,
} from "@/lib/format";

export const dynamic = "force-dynamic";

function fmtMetric(key: string, value: number | null): string {
  if (value == null) return "—";
  if (key === "avg_pace_s_per_km") return fmtPace(value);
  if (key.includes("intensity_factor")) return value.toFixed(2);
  return Math.round(value).toString();
}

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const activity = await getActivity(id);
  if (!activity) notFound();

  const day = activity.started_at.slice(0, 10);
  const recovery = await getRecovery(90);
  const rec = recovery.find((r) => r.date === day);
  const sportCfg = getSport(activity.sport);
  const metrics = (activity.metrics ?? {}) as Record<string, number | null>;

  return (
    <>
      <Link
        href="/calendar"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al calendario
      </Link>

      <header className="mb-6 flex items-center gap-3">
        <SportBadge sport={activity.sport} />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {sportCfg?.label ?? activity.sport}
          </h1>
          <p className="text-sm text-muted-foreground">
            {fmtDate(activity.started_at)} · fuente {activity.source}
          </p>
        </div>
      </header>

      {/* Métricas comunes */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Duración" value={fmtDuration(activity.duration_s)} />
        <Stat label="Distancia" value={fmtDistance(activity.distance_m)} />
        <Stat label="FC media" value={fmt(activity.avg_hr)} suffix="bpm" />
        <Stat label="Desnivel+" value={fmt(activity.elevation_gain_m)} suffix="m" />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Métricas específicas del deporte */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">
              Métricas de {sportCfg?.label ?? "la actividad"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sportCfg ? (
              <dl className="grid grid-cols-2 gap-4">
                {sportCfg.metrics.map((m) => (
                  <div key={m.key}>
                    <dt className="text-xs text-muted-foreground">{m.label}</dt>
                    <dd className="text-lg font-semibold tabular-nums">
                      {fmtMetric(m.key, metrics[m.key] ?? null)}
                      {m.unit && metrics[m.key] != null && (
                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                          {m.unit}
                        </span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">
                Deporte sin métricas específicas configuradas.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Whoop de esa mañana (TOLERADO) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">
              Recovery de esa mañana (Whoop)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rec ? (
              <div className="grid grid-cols-2 gap-4">
                <Metric
                  label="Recovery"
                  value={`${fmt(rec.recovery_score)}%`}
                  className={recoveryColor(rec.recovery_score)}
                />
                <Metric label="HRV" value={`${fmt(rec.hrv_rmssd)} ms`} />
                <Metric label="FC reposo" value={`${fmt(rec.rhr)} bpm`} />
                <Metric label="SpO₂" value={`${fmt(rec.spo2, 1)}%`} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay recovery de Whoop para este día.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Metric({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-lg font-semibold tabular-nums ${className ?? ""}`}>
        {value}
      </div>
    </div>
  );
}
