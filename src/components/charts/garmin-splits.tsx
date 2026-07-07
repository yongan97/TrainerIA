"use client";

import { useEffect, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Loader2 } from "lucide-react";

interface Split {
  index: number;
  distance_m: number | null;
  duration_s: number | null;
  avg_hr: number | null;
  avg_power: number | null;
  avg_pace_s_per_km: number | null;
  elevation_gain_m: number | null;
}

const axis = { stroke: "hsl(var(--muted-foreground))", fontSize: 11, tickLine: false, axisLine: false };

function pace(s: number | null): string {
  if (s == null) return "—";
  const total = Math.round(s);
  const m = Math.floor(total / 60);
  const sec = total % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function GarminSplits({ id, sport }: { id: string; sport: string }) {
  const [splits, setSplits] = useState<Split[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/garmin/detail?id=${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((j) => { if (alive) setSplits(j.splits ?? []); })
      .catch(() => { if (alive) setError(true); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [id]);

  if (loading)
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Trayendo splits de Garmin…
      </div>
    );
  if (error || !splits || splits.length === 0)
    return <p className="py-4 text-sm text-muted-foreground">No hay splits disponibles para esta actividad.</p>;

  const isBike = sport === "bike";
  const data = splits.map((s) => ({
    label: `${s.index}`,
    power: s.avg_power ?? 0,
    paceMin: s.avg_pace_s_per_km != null ? Math.round((s.avg_pace_s_per_km / 60) * 100) / 100 : 0,
    hr: s.avg_hr,
    km: s.distance_m != null ? Math.round((s.distance_m / 1000) * 100) / 100 : null,
    pace: s.avg_pace_s_per_km,
  }));

  return (
    <div>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
            <XAxis dataKey="label" {...axis} />
            <YAxis {...axis} width={34} />
            <Tooltip
              cursor={{ fill: "hsl(var(--accent))", opacity: 0.3 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as (typeof data)[number];
                return (
                  <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-lg">
                    <div className="mb-1 font-medium">Vuelta {label}</div>
                    {isBike ? <div>Potencia: {d.power} W</div> : <div>Pace: {pace(d.pace)}/km</div>}
                    {d.hr != null && <div className="text-muted-foreground">FC: {d.hr} bpm</div>}
                    {d.km != null && <div className="text-muted-foreground">{d.km} km</div>}
                  </div>
                );
              }}
            />
            <Bar dataKey={isBike ? "power" : "paceMin"} name={isBike ? "Potencia" : "Pace"} fill={isBike ? "#2b93d1" : "#d1691f"} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {isBike ? "Potencia media (W) por vuelta" : "Pace (min/km) por vuelta — más bajo es más rápido"}
      </p>
    </div>
  );
}
