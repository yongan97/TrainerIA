import { Activity, Watch } from "lucide-react";
import type { SyncStatus } from "@/lib/data";
import { fmtRelativeDay, daysAgo } from "@/lib/format";
import { SyncButton } from "@/components/sync-button";

function dotColor(date: string | null): string {
  const d = daysAgo(date);
  if (d == null) return "bg-muted-foreground/40"; // sin datos
  if (d <= 1) return "bg-primary"; // fresco (hoy/ayer)
  if (d <= 2) return "bg-yellow-400";
  return "bg-red-400"; // atrasado
}

function Row({
  icon: Icon,
  label,
  date,
}: {
  icon: typeof Activity;
  label: string;
  date: string | null;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor(date)}`} />
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-foreground">{label}</span>
      <span className="ml-auto text-muted-foreground">{fmtRelativeDay(date)}</span>
    </div>
  );
}

/** Estado de actualización de las fuentes (sync automático diario). */
export function SyncStatusPanel({ status }: { status: SyncStatus }) {
  return (
    <div className="space-y-2 rounded-lg border border-border bg-card/50 p-3">
      <Row icon={Watch} label="Whoop" date={status.whoopLast} />
      <Row icon={Activity} label="Garmin" date={status.garminLast} />
      <div className="pt-1">
        <SyncButton variant="full" />
      </div>
      <p className="pt-0.5 text-[10px] text-muted-foreground/70">
        Sincronización automática diaria
      </p>
    </div>
  );
}

/** Versión compacta en una fila (para la barra mobile). */
export function SyncStatusInline({ status }: { status: SyncStatus }) {
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="flex items-center gap-1.5">
        <span className={`h-2 w-2 rounded-full ${dotColor(status.whoopLast)}`} />
        Whoop
      </span>
      <span className="flex items-center gap-1.5">
        <span className={`h-2 w-2 rounded-full ${dotColor(status.garminLast)}`} />
        Garmin
      </span>
      <SyncButton variant="icon" />
    </div>
  );
}
