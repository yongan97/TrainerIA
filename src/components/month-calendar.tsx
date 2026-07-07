import Link from "next/link";
import { getSport } from "@/lib/sports/registry";
import type { Activity, PlannedSession } from "@/lib/domain/types";

export interface DayCell {
  date: string;
  dayNum: number;
  planned: PlannedSession[];
  executed: Activity[];
  recovery: number | null;
  isToday: boolean;
}

const DOW = ["L", "M", "M", "J", "V", "S", "D"];

function recoveryTint(score: number | null): string {
  if (score == null) return "";
  if (score >= 67) return "border-l-2 border-l-primary/60";
  if (score >= 34) return "border-l-2 border-l-yellow-400/60";
  return "border-l-2 border-l-red-400/60";
}

function Dot({ sport, filled }: { sport: string; filled: boolean }) {
  const color = getSport(sport)?.colorVar ?? "hsl(var(--muted-foreground))";
  return (
    <span
      className="inline-block h-2 w-2 rounded-full"
      style={filled ? { backgroundColor: color } : { border: `1.5px solid ${color}` }}
    />
  );
}

export function MonthCalendar({ weeks, label }: { weeks: (DayCell | null)[][]; label: string }) {
  return (
    <div>
      <div className="mb-2 text-sm font-medium capitalize">{label}</div>
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {DOW.map((d, i) => (
          <div key={i} className="pb-1 text-center text-[10px] font-medium uppercase text-muted-foreground/60">{d}</div>
        ))}
        {weeks.flat().map((cell, i) =>
          cell == null ? (
            <div key={i} />
          ) : (
            <div
              key={i}
              className={`min-h-[54px] rounded-lg border border-border bg-card/40 p-1 sm:min-h-[68px] sm:p-1.5 ${recoveryTint(cell.recovery)} ${cell.isToday ? "ring-1 ring-primary/50" : ""}`}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className={`text-xs ${cell.isToday ? "font-bold text-primary" : "text-muted-foreground"}`}>{cell.dayNum}</span>
                {cell.recovery != null && <span className="text-[9px] text-muted-foreground/70">{Math.round(cell.recovery)}</span>}
              </div>
              <div className="flex flex-wrap gap-1">
                {cell.planned.map((p) => <Dot key={p.id} sport={p.sport} filled={false} />)}
                {cell.executed.map((a) =>
                  a.external_id ? (
                    <Link key={a.id} href={`/activity/${a.id}`}><Dot sport={a.sport} filled /></Link>
                  ) : (
                    <Dot key={a.id} sport={a.sport} filled />
                  ),
                )}
              </div>
            </div>
          ),
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1"><Dot sport="run" filled={false} /> planificado</span>
        <span className="flex items-center gap-1"><Dot sport="run" filled /> ejecutado</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-1 rounded bg-primary/60" /> borde = recovery</span>
      </div>
    </div>
  );
}
