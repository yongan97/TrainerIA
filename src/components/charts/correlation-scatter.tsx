"use client";

import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";

const axis = { stroke: "hsl(var(--muted-foreground))", fontSize: 11, tickLine: false, axisLine: false };

export interface CorrPoint {
  x: number;
  y: number;
}

export function CorrelationScatter({
  data,
  xLabel,
  yLabel,
  line,
  xUnit,
  yUnit,
}: {
  data: CorrPoint[];
  xLabel: string;
  yLabel: string;
  line?: { slope: number; intercept: number } | null;
  xUnit?: string;
  yUnit?: string;
}) {
  const xs = data.map((d) => d.x);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const linePts = line ? [{ x: xMin, y: line.slope * xMin + line.intercept }, { x: xMax, y: line.slope * xMax + line.intercept }] : null;

  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 8, right: 16, left: -14, bottom: 8 }}>
          <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.4} />
          <XAxis type="number" dataKey="x" name={xLabel} {...axis} domain={["dataMin - 0.3", "dataMax + 0.3"]} tickFormatter={(v: number) => v.toFixed(1)} label={{ value: xLabel, position: "insideBottom", offset: -4, fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
          <YAxis type="number" dataKey="y" name={yLabel} {...axis} width={34} />
          <ZAxis range={[45, 45]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={({ active, payload }) =>
              active && payload?.length ? (
                <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-lg">
                  <div>{xLabel}: {Number(payload[0].payload.x).toFixed(1)}{xUnit}</div>
                  <div>{yLabel}: {Math.round(Number(payload[0].payload.y))}{yUnit}</div>
                </div>
              ) : null
            }
          />
          {linePts && <ReferenceLine ifOverflow="extendDomain" segment={linePts} stroke="#8a6fe0" strokeWidth={2} strokeDasharray="5 4" />}
          <Scatter data={data} fill="#2b93d1" fillOpacity={0.7} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
