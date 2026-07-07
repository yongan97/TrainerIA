"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const axis = { stroke: "hsl(var(--muted-foreground))", fontSize: 11, tickLine: false, axisLine: false };

export interface WeeklyLoadPoint {
  label: string;
  run: number;
  bike: number;
}

function Tip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value ?? 0), 0);
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 font-medium">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium tabular-nums">{Math.round(p.value)} min</span>
        </div>
      ))}
      <div className="mt-1 border-t border-border pt-1 text-muted-foreground">Total: {Math.round(total)} min</div>
    </div>
  );
}

export function WeeklyLoad({ data }: { data: WeeklyLoadPoint[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, left: -22, bottom: 0 }}>
          <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
          <XAxis dataKey="label" {...axis} />
          <YAxis {...axis} width={34} />
          <Tooltip content={<Tip />} cursor={{ fill: "hsl(var(--accent))", opacity: 0.3 }} />
          <Bar dataKey="bike" name="Ciclismo" stackId="v" fill="#2b93d1" />
          <Bar dataKey="run" name="Running" stackId="v" fill="#d1691f" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
