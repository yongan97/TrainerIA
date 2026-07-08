import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRunZones, formatZoneRange } from "@/lib/zones";
import type { Settings } from "@/lib/domain/types";

/** Tabla de zonas de FC personalizadas según el LTHR del atleta. */
export function ZonesReference({ settings }: { settings: Settings | null }) {
  const zones = getRunZones(settings);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-foreground">Tus zonas de FC (running)</CardTitle>
        <p className="text-xs text-muted-foreground">
          {zones
            ? `Calculadas desde tu umbral de lactato (${settings?.lthr} bpm)`
            : "Cargá tu FC umbral (LTHR) para ver tus zonas personalizadas."}
        </p>
      </CardHeader>
      <CardContent>
        {zones ? (
          <div className="space-y-2">
            {zones.map((z) => (
              <div key={z.z} className="flex items-center gap-3">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: z.color }} />
                <span className="w-8 text-sm font-medium">Z{z.z}</span>
                <span className="w-28 text-sm">{z.name}</span>
                <span className="w-24 text-sm tabular-nums text-muted-foreground">{formatZoneRange(z)} bpm</span>
                <span className="hidden flex-1 text-xs text-muted-foreground sm:block">{z.desc}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Sin LTHR configurado.</p>
        )}
      </CardContent>
    </Card>
  );
}
