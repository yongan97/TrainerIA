/**
 * Barra de distribución de zonas de FC. Lee el formato de Whoop
 * (zone_0_ms ... zone_5_ms). Z0 = reposo (se omite del reparto visible).
 */
const ZONES = [
  { key: "zone_1_ms", label: "Z1", color: "#2b93d1", desc: "Recuperación" },
  { key: "zone_2_ms", label: "Z2", color: "#2ba86a", desc: "Aeróbico" },
  { key: "zone_3_ms", label: "Z3", color: "#eab308", desc: "Tempo" },
  { key: "zone_4_ms", label: "Z4", color: "#d1691f", desc: "Umbral" },
  { key: "zone_5_ms", label: "Z5", color: "#e0555f", desc: "VO2máx" },
];

function fmtMin(ms: number): string {
  const m = Math.round(ms / 60000);
  return `${m}m`;
}

export function HrZones({ zones }: { zones: Record<string, number> | null }) {
  if (!zones) {
    return <p className="text-sm text-muted-foreground">Sin datos de zonas de FC.</p>;
  }
  const vals = ZONES.map((z) => ({ ...z, ms: Number(zones[z.key] ?? 0) }));
  const total = vals.reduce((s, z) => s + z.ms, 0);
  if (total === 0) {
    return <p className="text-sm text-muted-foreground">Sin datos de zonas de FC.</p>;
  }
  return (
    <div className="space-y-3">
      <div className="flex h-3 w-full overflow-hidden rounded-full">
        {vals.map((z) => (
          <div
            key={z.key}
            style={{ width: `${(z.ms / total) * 100}%`, backgroundColor: z.color }}
            title={`${z.label} · ${fmtMin(z.ms)}`}
          />
        ))}
      </div>
      <div className="grid grid-cols-5 gap-2">
        {vals.map((z) => (
          <div key={z.key} className="text-center">
            <div className="mx-auto mb-1 h-2 w-2 rounded-full" style={{ backgroundColor: z.color }} />
            <div className="text-xs font-medium">{z.label}</div>
            <div className="text-[11px] tabular-nums text-muted-foreground">
              {total ? Math.round((z.ms / total) * 100) : 0}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
