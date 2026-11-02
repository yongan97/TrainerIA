import type { CarbBand } from "@/lib/kitchen/types";
import { CARB_RANGES, plateSplit, type PlateSplit } from "@/lib/kitchen/targets";

const COLORS = {
  veg: "#3d9a62",
  protein: "#d06a4f",
  carb: "#d4b15a",
};

export function HarvardPlate({
  band,
  grams,
}: {
  band: CarbBand;
  grams: { protein: number; carbMin: number; carbMax: number };
}) {
  const split = plateSplit(band);
  const range = CARB_RANGES[band];
  const bg = `conic-gradient(${COLORS.veg} 0% ${split.veg}%, ${COLORS.protein} ${split.veg}% ${split.veg + split.protein}%, ${COLORS.carb} ${split.veg + split.protein}% 100%)`;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
      <div
        className="relative h-56 w-56 shrink-0 rounded-full"
        style={{ background: bg }}
        role="img"
        aria-label={`Plato de Harvard: ${split.veg}% verdura, ${split.protein}% proteína, ${split.carb}% hidrato`}
      >
        <div className="absolute inset-[24%] flex items-center justify-center rounded-full bg-card px-3 text-center">
          <span className="text-sm font-medium leading-tight text-foreground">Plato de Harvard</span>
        </div>
      </div>
      <ul className="w-full space-y-3">
        <Slice color={COLORS.veg} label="Verdura" pct={split.veg} note="Hojas, zapallito, pepino, zanahoria. Sin tomate crudo." />
        <Slice color={COLORS.protein} label="Proteína" pct={split.protein} note={`${grams.protein} g en el día, ~${Math.round(grams.protein / 4)} g por comida.`} />
        <Slice color={COLORS.carb} label="Hidrato" pct={split.carb} note={`${grams.carbMin}–${grams.carbMax} g · ${range.minGPerKg}–${range.maxGPerKg} g/kg.`} />
        <li className="text-sm text-muted-foreground">{range.hint}</li>
      </ul>
    </div>
  );
}

function Slice({ color, label, pct, note }: { color: string; label: string; pct: number; note: string }) {
  return (
    <li className="flex gap-3">
      <span className="mt-1 h-4 w-4 shrink-0 rounded-sm" style={{ background: color }} />
      <span>
        <span className="text-lg font-semibold text-foreground">{label} {pct}%</span>
        <span className="mt-0.5 block text-sm text-muted-foreground">{note}</span>
      </span>
    </li>
  );
}

export type { PlateSplit };
