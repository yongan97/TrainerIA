"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Colores validados (dataviz, dark). Consistentes con el registry de deportes.
const COLORS = {
  recovery: "#2ba86a",
  hrv: "#8a6fe0",
  bike: "#2b93d1",
  run: "#d1691f",
};

export interface TrendPoint {
  date: string; // etiqueta corta
  recovery: number | null;
  hrv: number | null;
  bike_min: number;
  run_min: number;
}

const axis = {
  stroke: "hsl(var(--muted-foreground))",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};

function TooltipBox({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  unit?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 font-medium">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: p.color }}
          />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium tabular-nums">
            {p.value ?? "—"}
            {unit}
          </span>
        </div>
      ))}
    </div>
  );
}

export function TrendsCharts({ data }: { data: TrendPoint[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ChartCard title="Recovery (%)">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
          <XAxis dataKey="date" {...axis} minTickGap={24} />
          <YAxis domain={[0, 100]} {...axis} width={40} />
          <Tooltip content={<TooltipBox unit="%" />} />
          <Line
            type="monotone"
            dataKey="recovery"
            name="Recovery"
            stroke={COLORS.recovery}
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        </LineChart>
      </ChartCard>

      <ChartCard title="HRV (ms)">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
          <XAxis dataKey="date" {...axis} minTickGap={24} />
          <YAxis {...axis} width={40} />
          <Tooltip content={<TooltipBox unit=" ms" />} />
          <Line
            type="monotone"
            dataKey="hrv"
            name="HRV"
            stroke={COLORS.hrv}
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        </LineChart>
      </ChartCard>

      <ChartCard
        title="Volumen por deporte (min)"
        subtitle="Barras apiladas = carga combinada; cada color, un deporte"
        full
      >
        <BarChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
          <XAxis dataKey="date" {...axis} minTickGap={24} />
          <YAxis {...axis} width={40} />
          <Tooltip content={<TooltipBox unit=" min" />} cursor={{ fill: "hsl(var(--accent))", opacity: 0.3 }} />
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }}
          />
          <Bar dataKey="bike_min" name="Ciclismo" stackId="v" fill={COLORS.bike} radius={[0, 0, 0, 0]} />
          <Bar dataKey="run_min" name="Running" stackId="v" fill={COLORS.run} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartCard>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  full,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactElement;
  full?: boolean;
}) {
  return (
    <Card className={full ? "lg:col-span-2" : undefined}>
      <CardHeader>
        <CardTitle className="text-foreground">{title}</CardTitle>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
