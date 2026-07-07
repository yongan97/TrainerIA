/**
 * Mapa de calor de consistencia (estilo GitHub). Columnas = semanas, filas =
 * días (lun→dom). Intensidad de verde según minutos entrenados ese día.
 */
export interface HeatDay {
  date: string;
  minutes: number;
}

function shade(min: number): string {
  if (min <= 0) return "bg-secondary/40";
  if (min < 20) return "bg-primary/25";
  if (min < 45) return "bg-primary/45";
  if (min < 75) return "bg-primary/70";
  return "bg-primary";
}

export function ConsistencyHeatmap({ days }: { days: HeatDay[] }) {
  // Agrupar en columnas por semana (lun-dom). days debe venir ordenado asc.
  const cols: HeatDay[][] = [];
  let week: HeatDay[] = [];
  for (const d of days) {
    const dow = (new Date(d.date + "T00:00:00").getDay() + 6) % 7; // 0=lun
    if (dow === 0 && week.length) {
      cols.push(week);
      week = [];
    }
    week.push(d);
  }
  if (week.length) cols.push(week);

  const rows = ["L", "M", "M", "J", "V", "S", "D"];

  return (
    <div className="flex gap-2">
      <div className="flex flex-col justify-between pt-0.5 text-[9px] text-muted-foreground/60">
        {rows.map((r, i) => (
          <span key={i} className="h-3 leading-3">{r}</span>
        ))}
      </div>
      <div className="flex gap-1 overflow-x-auto">
        {cols.map((col, ci) => {
          // completar el mapa por día de la semana
          const byDow = new Map(col.map((d) => [(new Date(d.date + "T00:00:00").getDay() + 6) % 7, d]));
          return (
            <div key={ci} className="flex flex-col gap-1">
              {Array.from({ length: 7 }).map((_, dow) => {
                const d = byDow.get(dow);
                return (
                  <div
                    key={dow}
                    className={`h-3 w-3 rounded-sm ${d ? shade(d.minutes) : "bg-secondary/20"}`}
                    title={d ? `${d.date}: ${Math.round(d.minutes)} min` : ""}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
