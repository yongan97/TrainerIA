import { Droplets, Sparkles, HeartPulse } from "lucide-react";
import { SetupNotice } from "@/components/ui/setup-notice";
import { RecipeSection } from "@/components/nutrition";
import { isConfigured, getNutritionContext } from "@/lib/data";
import { LIBRARY, decideFocus, type NutritionSlot } from "@/lib/nutrition";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const SLOT_META: Record<NutritionSlot, { title: string; subtitle: string }> = {
  pre: {
    title: "Antes de entrenar",
    subtitle: "Carbohidrato de fácil digestión, poca grasa y fibra. Energía sin caer pesado.",
  },
  post: {
    title: "Después de entrenar",
    subtitle: "Proteína + carbohidrato en los primeros 30-60 min para reparar y reponer.",
  },
  rest: {
    title: "Días sin entrenar",
    subtitle: "Mantené la proteína, aflojá el carbohidrato y sumá antiinflamatorios.",
  },
};

const ACCENT: Record<NutritionSlot, string> = {
  pre: "border-sky-400/30 bg-sky-400/5",
  post: "border-primary/30 bg-primary/5",
  rest: "border-yellow-400/30 bg-yellow-400/5",
};

export default async function NutricionPage() {
  if (!isConfigured()) {
    return (
      <Page>
        <SetupNotice title="Falta configurar el entorno" body="Configurá Supabase para ver la nutrición contextual." />
      </Page>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const ctx = await getNutritionContext(today);
  const focus = decideFocus(ctx);
  const order: NutritionSlot[] = orderSlots(focus.slot);

  return (
    <Page>
      {/* Recomendación contextual del día */}
      <div className={cn("mb-8 rounded-xl border p-5", ACCENT[focus.slot])}>
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4" />
          {focus.title}
        </div>
        <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">
          {focus.headline}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{focus.detail}</p>
        {focus.hydration && (
          <p className="mt-3 flex items-start gap-2 rounded-lg bg-background/40 p-3 text-sm text-foreground/90">
            <Droplets className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
            {focus.hydration}
          </p>
        )}
      </div>

      {/* Secciones, con la del foco de hoy primero y resaltada */}
      <div className="space-y-10">
        {order.map((slot) => (
          <RecipeSection
            key={slot}
            slot={slot}
            title={SLOT_META[slot].title}
            subtitle={SLOT_META[slot].subtitle}
            recipes={LIBRARY[slot]}
            highlight={slot === focus.slot}
          />
        ))}
      </div>

      {/* Nota de rehab / antiinflamatorios */}
      <div className="mt-10 rounded-lg border border-border bg-card/50 p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <HeartPulse className="h-4 w-4 text-primary" />
          Para tu recuperación de cuádriceps y gemelo
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Sumá regularmente <strong className="text-foreground/90">omega-3</strong> (salmón, caballa, sardinas, chía, nueces) y{" "}
          <strong className="text-foreground/90">antioxidantes</strong> (frutos rojos, verduras de hoja, cúrcuma) para bajar la
          inflamación muscular. La <strong className="text-foreground/90">proteína repartida</strong> en el día (0,3-0,4 g/kg por comida)
          es lo que repara el músculo cargado. Y después de sesiones largas o sudadas, no descuides{" "}
          <strong className="text-foreground/90">sodio y potasio</strong> — las sales que ya venís tomando, más una banana.
        </p>
      </div>
    </Page>
  );
}

/** Pone el foco del día primero; el resto en orden natural pre → post → rest. */
function orderSlots(first: NutritionSlot): NutritionSlot[] {
  const all: NutritionSlot[] = ["pre", "post", "rest"];
  return [first, ...all.filter((s) => s !== first)];
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Nutrición</h1>
        <p className="text-sm text-muted-foreground">
          Qué comer antes, después y en los días sin entrenar — adaptado a tu día.
        </p>
      </header>
      {children}
    </>
  );
}
