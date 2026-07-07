"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceArea,
  Area,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = {
  recovery: "#2ba86a",
  hrv: "#8a6fe0",
  hrvBase: "#c4b5fd",
  strain: "#64748b",
  acute: "#d1691f",
  chronic: "#2b93d1",
  bike: "#2b93d1",
  run: "#d1691f",
};

export interface TrendPoint {
  date: string;
  label: string;
  recovery: number | null;
  hrv: number | null;
  hrvBaseline: number | null;
  strain: number | null;
  acute: number | null;
  chronic: number | null;
  run: number;
  bike: number;
}

const axis = {
  stroke: "hsl(var(--muted-foreground))",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};

interface TP {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string; unit?: string }>;
  label?: string;
}
function TipBox({ active, payload, label, unit }: TP & { unit?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 font-medium">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium tabular-nums">
            {p.value == null ? "—" : Math.round(p.value * 10) / 10}
            {unit}
          </span>
        </div>
      ))}
    </div>
  );
}

function ChartCard({ title, subtitle, children, full }: { title: string; subtitle?: string; children: React.ReactElement; full?: boolean }) {
  return (
    <Card className={full ? "lg:col-span-2" : undefined}>
      <CardHeader>
        <CardTitle className="text-foreground">{title}</CardTitle>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </CardHeader>
      <CardContent>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function TrendsCharts({ data }: { data: TrendPoint[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Recovery con zonas */}
      <ChartCard title="Recovery (%)" subtitle="Verde ≥67 · amarillo 34–66 · rojo <34">
        <ComposedChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
          <ReferenceArea y1={67} y2={100} fill={COLORS.recovery} fillOpacity={0.06} />
          <ReferenceArea y1={34} y2={67} fill="#eab308" fillOpacity={0.05} />
          <ReferenceArea y1={0} y2={34} fill="#ef4444" fillOpacity={0.05} />
          <XAxis dataKey="label" {...axis} minTickGap={24} />
          <YAxis domain={[0, 100]} {...axis} width={38} />
          <Tooltip content={<TipBox unit="%" />} />
          <Area type="monotone" dataKey="recovery" stroke={COLORS.recovery} strokeWidth={2} fill={COLORS.recovery} fillOpacity={0.12} dot={false} connectNulls name="Recovery" />
        </ComposedChart>
      </ChartCard>

      {/* HRV vs baseline */}
      <ChartCard title="HRV vs línea base" subtitle="Línea base = media móvil 7 días">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
          <XAxis dataKey="label" {...axis} minTickGap={24} />
          <YAxis {...axis} width={38} />
          <Tooltip content={<TipBox unit=" ms" />} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="hrv" name="HRV" stroke={COLORS.hrv} strokeWidth={1.5} dot={false} connectNulls />
          <Line type="monotone" dataKey="hrvBaseline" name="Línea base 7d" stroke={COLORS.hrvBase} strokeWidth={2.5} dot={false} connectNulls strokeDasharray="4 3" />
        </LineChart>
      </ChartCard>

      {/* Carga aguda vs crónica */}
      <ChartCard title="Carga: aguda vs crónica" subtitle="Barras = strain diario · líneas = medias 7d y 28d" full>
        <ComposedChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
          <XAxis dataKey="label" {...axis} minTickGap={24} />
          <YAxis {...axis} width={38} />
          <Tooltip content={<TipBox />} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="strain" name="Strain diario" fill={COLORS.strain} fillOpacity={0.35} radius={[3, 3, 0, 0]} />
          <Line type="monotone" dataKey="acute" name="Aguda 7d" stroke={COLORS.acute} strokeWidth={2.5} dot={false} connectNulls />
          <Line type="monotone" dataKey="chronic" name="Crónica 28d" stroke={COLORS.chronic} strokeWidth={2.5} dot={false} connectNulls />
        </ComposedChart>
      </ChartCard>

      {/* Volumen por deporte */}
      <ChartCard title="Volumen por deporte (min)" subtitle="Apilado = carga combinada">
        <BarChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
          <XAxis dataKey="label" {...axis} minTickGap={24} />
          <YAxis {...axis} width={38} />
          <Tooltip content={<TipBox unit=" min" />} cursor={{ fill: "hsl(var(--accent))", opacity: 0.3 }} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="bike" name="Ciclismo" stackId="v" fill={COLORS.bike} />
          <Bar dataKey="run" name="Running" stackId="v" fill={COLORS.run} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartCard>

      {/* Tolerancia: recovery vs strain */}
      <ChartCard title="Tolerancia: recovery vs strain" subtitle="Cada punto = un día. Abajo-derecha (mucho strain, poco recovery) = te costó" full>
        <ScatterChart margin={{ top: 8, right: 12, left: -18, bottom: 4 }}>
          <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.4} />
          <XAxis type="number" dataKey="strain" name="Strain" {...axis} domain={[0, (max: number) => Math.ceil(max)]} allowDecimals={false} tickFormatter={(v: number) => String(Math.round(v))} label={{ value: "Strain del día", position: "insideBottom", offset: -2, fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
          <YAxis type="number" dataKey="recovery" name="Recovery" domain={[0, 100]} {...axis} width={38} />
          <ZAxis range={[50, 50]} />
          <Tooltip content={<TipBox />} cursor={{ strokeDasharray: "3 3" }} />
          <Scatter data={data.filter((d) => d.strain != null && d.recovery != null)} fill={COLORS.recovery} fillOpacity={0.7} />
        </ScatterChart>
      </ChartCard>
    </div>
  );
}
