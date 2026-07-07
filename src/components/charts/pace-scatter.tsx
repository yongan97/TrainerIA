"use client";

import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip } from "recharts";

const axis = { stroke: "hsl(var(--muted-foreground))", fontSize: 11, tickLine: false, axisLine: false };

export interface PacePoint {
  km: number;
  pace: number; // s/km
  date: string;
}

function mmss(s: number): string {
  const t = Math.round(s);
  return `${Math.floor(t / 60)}:${(t % 60).toString().padStart(2, "0")}`;
}

export function PaceScatter({ data }: { data: PacePoint[] }) {
  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 8, right: 16, left: 4, bottom: 8 }}>
          <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.4} />
          <XAxis type="number" dataKey="km" name="Distancia" {...axis} domain={[0, "dataMax + 1"]} unit=" km" label={{ value: "Distancia (km)", position: "insideBottom", offset: -4, fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
          <YAxis type="number" dataKey="pace" name="Pace" {...axis} width={44} domain={["dataMin - 15", "dataMax + 15"]} tickFormatter={mmss} reversed />
          <ZAxis range={[50, 50]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={({ active, payload }) =>
              active && payload?.length ? (
                <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-lg">
                  <div className="font-medium">{Number(payload[0].payload.km).toFixed(1)} km</div>
                  <div className="text-muted-foreground">{mmss(payload[0].payload.pace)}/km</div>
                  <div className="text-muted-foreground/70">{payload[0].payload.date}</div>
                </div>
              ) : null
            }
          />
          <Scatter data={data} fill="#d1691f" fillOpacity={0.75} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
