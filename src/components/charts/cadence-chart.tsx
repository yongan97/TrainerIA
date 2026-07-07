"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceArea } from "recharts";

const axis = { stroke: "hsl(var(--muted-foreground))", fontSize: 11, tickLine: false, axisLine: false };

export interface CadencePoint {
  label: string;
  cadence: number;
}

export function CadenceChart({ data }: { data: CadencePoint[] }) {
  const vals = data.map((d) => d.cadence);
  const min = Math.min(150, Math.floor(Math.min(...vals) - 3));
  const max = Math.max(185, Math.ceil(Math.max(...vals) + 3));
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
          <ReferenceArea y1={170} y2={185} fill="#2ba86a" fillOpacity={0.07} />
          <XAxis dataKey="label" {...axis} minTickGap={24} />
          <YAxis domain={[min, max]} {...axis} width={30} />
          <Tooltip
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-lg">
                  <div className="font-medium">{label}</div>
                  <div className="text-muted-foreground">{payload[0].value} spm</div>
                </div>
              ) : null
            }
          />
          <Line type="monotone" dataKey="cadence" stroke="#d1691f" strokeWidth={2.5} dot={{ r: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
