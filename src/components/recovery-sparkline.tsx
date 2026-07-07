import { trendArrow } from "@/lib/analytics";

/** Mini-tendencia de recovery de los últimos 7 días (barras coloreadas por zona). */
function barColor(score: number | null): string {
  if (score == null) return "bg-muted-foreground/25";
  if (score >= 67) return "bg-primary";
  if (score >= 34) return "bg-yellow-400";
  return "bg-red-400";
}

function dayLabel(date: string): string {
  return new Date(date + "T00:00:00").toLocaleDateString("es-AR", { weekday: "narrow" });
}

const TREND: Record<string, { label: string; className: string }> = {
  up: { label: "↗ mejorando", className: "text-primary" },
  down: { label: "↘ bajando", className: "text-red-400" },
  flat: { label: "→ estable", className: "text-muted-foreground" },
};

export function RecoverySparkline({ data }: { data: { date: string; score: number | null }[] }) {
  if (data.length === 0) return null;
  const t = TREND[trendArrow(data.map((d) => d.score), 3)];
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Recuperación · últimos 7 días</span>
        <span className={`text-xs font-medium ${t.className}`}>{t.label}</span>
      </div>
      <div className="flex items-end gap-2">
        {data.map((d) => (
          <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-16 w-full items-end">
              <div
                className={`w-full rounded-t ${barColor(d.score)}`}
                style={{ height: `${Math.max(6, ((d.score ?? 0) / 100) * 100)}%` }}
                title={`${d.date}: ${d.score ?? "—"}%`}
              />
            </div>
            <span className="text-[10px] tabular-nums text-muted-foreground">{d.score ?? "—"}</span>
            <span className="text-[9px] uppercase text-muted-foreground/50">{dayLabel(d.date)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
