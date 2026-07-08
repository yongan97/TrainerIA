"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const axis = { stroke: "hsl(var(--muted-foreground))", fontSize: 11, tickLine: false, axisLine: false };
const PAIN = "#e0555f";
const BIKE = "#2b93d1";

export interface RehabPoint {
  label: string;
  pain: number | null;
  bikeMin: number; // carga de bici (min)
}
export interface WeekPoint {
  label: string;
  min: number; // min de bici en la semana
  over10: boolean;
}

function Tip({ active, payload, label, unit }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string; unit?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 font-medium">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium tabular-nums">{p.value == null ? "—" : Math.round(p.value * 10) / 10}{unit}</span>
        </div>
      ))}
    </div>
  );
}

export function RehabCharts({ daily, weekly }: { daily: RehabPoint[]; weekly: WeekPoint[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Molestia de cuádriceps vs carga de bici</CardTitle>
          <p className="text-xs text-muted-foreground">Línea = molestia (0–10, umbral 4) · barras = min de bici</p>
        </CardHeader>
        <CardContent>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={daily} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
                <XAxis dataKey="label" {...axis} minTickGap={24} />
                <YAxis domain={[0, 10]} {...axis} width={28} />
                <Tooltip content={<Tip />} />
                <ReferenceLine y={4} stroke={PAIN} strokeOpacity={0.5} strokeDasharray="4 3" />
                <Bar dataKey="bikeMin" name="Bici (min)" fill={BIKE} fillOpacity={0.5} radius={[3, 3, 0, 0]} />
                <Line type="monotone" dataKey="pain" name="Molestia" stroke={PAIN} strokeWidth={2.5} dot={{ r: 2 }} connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Volumen semanal de bici</CardTitle>
          <p className="text-xs text-muted-foreground">Rojo = subiste &gt;10% vs la semana previa (progresá gradual)</p>
        </CardHeader>
        <CardContent>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
                <XAxis dataKey="label" {...axis} />
                <YAxis {...axis} width={34} />
                <Tooltip content={<Tip unit=" min" />} cursor={{ fill: "hsl(var(--accent))", opacity: 0.3 }} />
                <Bar dataKey="min" name="min" radius={[4, 4, 0, 0]}>
                  {weekly.map((w, i) => (
                    <Cell key={i} fill={w.over10 ? PAIN : BIKE} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
