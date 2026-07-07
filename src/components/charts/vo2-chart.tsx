"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const axis = { stroke: "hsl(var(--muted-foreground))", fontSize: 11, tickLine: false, axisLine: false };

export interface Vo2Point {
  label: string;
  vo2: number;
}

export function Vo2Chart({ data }: { data: Vo2Point[] }) {
  const vals = data.map((d) => d.vo2);
  const min = Math.floor(Math.min(...vals) - 1);
  const max = Math.ceil(Math.max(...vals) + 1);
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
          <XAxis dataKey="label" {...axis} minTickGap={24} />
          <YAxis domain={[min, max]} {...axis} width={30} />
          <Tooltip
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-lg">
                  <div className="font-medium">{label}</div>
                  <div className="text-muted-foreground">VO₂max: {payload[0].value}</div>
                </div>
              ) : null
            }
          />
          <Line type="monotone" dataKey="vo2" stroke="#2ba86a" strokeWidth={2.5} dot={{ r: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
