"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const axis = { stroke: "hsl(var(--muted-foreground))", fontSize: 11, tickLine: false, axisLine: false };

export interface SleepPoint {
  label: string;
  hours: number | null;
  avg: number | null;
}

function Tip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 font-medium">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium tabular-nums">{p.value == null ? "—" : `${Math.round(p.value * 10) / 10} h`}</span>
        </div>
      ))}
    </div>
  );
}

export function SleepTrend({ data }: { data: SleepPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-foreground">Horas de sueño</CardTitle>
        <p className="text-xs text-muted-foreground">Barras = por noche · línea = media 7d · referencia 8 h</p>
      </CardHeader>
      <CardContent>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 12, left: -22, bottom: 0 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
              <XAxis dataKey="label" {...axis} minTickGap={20} />
              <YAxis {...axis} width={30} domain={[0, 10]} />
              <Tooltip content={<Tip />} />
              <ReferenceLine y={8} stroke="hsl(var(--primary))" strokeOpacity={0.4} strokeDasharray="4 3" />
              <Bar dataKey="hours" name="Sueño" fill="#748ffc" fillOpacity={0.6} radius={[3, 3, 0, 0]} />
              <Line type="monotone" dataKey="avg" name="Media 7d" stroke="#9775fa" strokeWidth={2.5} dot={false} connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

const STAGES = [
  { key: "deep_ms", label: "Profundo", color: "#3b5bdb" },
  { key: "rem_ms", label: "REM", color: "#9775fa" },
  { key: "light_ms", label: "Ligero", color: "#748ffc" },
  { key: "awake_ms", label: "Despierto", color: "#495057" },
];

export function SleepStages({ stages }: { stages: Record<string, number> | null }) {
  if (!stages) return <p className="text-sm text-muted-foreground">Sin datos de fases.</p>;
  const vals = STAGES.map((s) => ({ ...s, ms: Number(stages[s.key] ?? 0) }));
  const total = vals.reduce((a, b) => a + b.ms, 0);
  if (!total) return <p className="text-sm text-muted-foreground">Sin datos de fases.</p>;
  return (
    <div className="space-y-3">
      <div className="flex h-3 w-full overflow-hidden rounded-full">
        {vals.map((s) => (
          <div key={s.key} style={{ width: `${(s.ms / total) * 100}%`, backgroundColor: s.color }} title={s.label} />
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {vals.map((s) => (
          <div key={s.key} className="text-center">
            <div className="mx-auto mb-1 h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
            <div className="text-xs font-medium">{s.label}</div>
            <div className="text-[11px] tabular-nums text-muted-foreground">
              {Math.round((s.ms / total) * 100)}% · {Math.round(s.ms / 60000)}m
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
