import { Bike, Footprints, HelpCircle } from "lucide-react";
import { getSport } from "@/lib/sports/registry";
import { cn } from "@/lib/utils";

const ICONS = { bike: Bike, footprints: Footprints } as const;

export function SportBadge({
  sport,
  className,
  showLabel = true,
}: {
  sport: string;
  className?: string;
  showLabel?: boolean;
}) {
  const cfg = getSport(sport);
  const Icon = cfg ? ICONS[cfg.icon] : HelpCircle;
  const color = cfg ? cfg.colorVar : "hsl(var(--muted-foreground))";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        className,
      )}
      style={{
        color,
        backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
      }}
    >
      <Icon className="h-3.5 w-3.5" />
      {showLabel && (cfg?.label ?? sport)}
    </span>
  );
}

/** Punto de color por deporte (para leyendas/calendario). */
export function SportDot({ sport }: { sport: string }) {
  const cfg = getSport(sport);
  const color = cfg ? cfg.colorVar : "hsl(var(--muted-foreground))";
  return (
    <span
      className="inline-block h-2.5 w-2.5 rounded-full"
      style={{ backgroundColor: color }}
      title={cfg?.label ?? sport}
    />
  );
}
