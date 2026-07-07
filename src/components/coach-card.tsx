import { Zap, AlertTriangle, Moon, ShieldAlert, CheckCircle2 } from "lucide-react";
import type { CoachBrief, CoachLevel } from "@/lib/coach";

const STYLE: Record<CoachLevel, { ring: string; text: string; icon: typeof Zap }> = {
  go: { ring: "ring-primary/40 bg-primary/5", text: "text-primary", icon: Zap },
  modulate: { ring: "ring-yellow-400/40 bg-yellow-400/5", text: "text-yellow-300", icon: AlertTriangle },
  rest: { ring: "ring-red-400/40 bg-red-400/5", text: "text-red-300", icon: Moon },
  caution: { ring: "ring-orange-400/40 bg-orange-400/5", text: "text-orange-300", icon: ShieldAlert },
  recap: { ring: "ring-sky-400/40 bg-sky-400/5", text: "text-sky-300", icon: CheckCircle2 },
};

export function CoachCard({ brief }: { brief: CoachBrief }) {
  const s = STYLE[brief.level];
  const Icon = s.icon;
  return (
    <div className={`mb-6 rounded-xl border border-border p-5 ring-1 ${s.ring}`}>
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-card ${s.text}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold uppercase tracking-wide ${s.text}`}>Coach · {brief.headline}</span>
          </div>
          <p className="mt-1 text-[15px] font-medium leading-snug">{brief.action}</p>
          {brief.reasons.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {brief.reasons.map((r) => (
                <span key={r} className="rounded-full border border-border bg-card px-2 py-0.5 text-[11px] text-muted-foreground">
                  {r}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
