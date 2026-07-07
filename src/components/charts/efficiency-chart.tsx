"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const axis = { stroke: "hsl(var(--muted-foreground))", fontSize: 11, tickLine: false, axisLine: false };

export interface EffPoint {
  label: string;
  ef: number;
}

export function EfficiencyChart({ data }: { data: EffPoint[] }) {
  const vals = data.map((d) => d.ef);
  const min = Math.floor(Math.min(...vals) * 10) / 10 - 0.1;
  const max = Math.ceil(Math.max(...vals) * 10) / 10 + 0.1;
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -14, bottom: 0 }}>
          <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
          <XAxis dataKey="label" {...axis} minTickGap={24} />
          <YAxis domain={[min, max]} {...axis} width={38} tickFormatter={(v: number) => v.toFixed(1)} />
          <Tooltip
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-lg">
                  <div className="font-medium">{label}</div>
                  <div className="text-muted-foreground">Eficiencia: {Number(payload[0].value).toFixed(2)} m/min/lat</div>
                </div>
              ) : null
            }
          />
          <Line type="monotone" dataKey="ef" stroke="#8a6fe0" strokeWidth={2.5} dot={{ r: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
