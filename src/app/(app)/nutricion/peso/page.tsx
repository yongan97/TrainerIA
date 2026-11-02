import { WeightPanel } from "@/components/kitchen/weight-panel";
import { getKitchenView } from "@/lib/kitchen/store";

export const dynamic = "force-dynamic";

export default async function PesoPage() {
  const today = new Date().toISOString().slice(0, 10);
  const view = await getKitchenView(today);
  return (
    <div>
      <h2 className="mb-1 text-2xl font-semibold tracking-tight">Peso</h2>
      <p className="mb-4 text-base text-muted-foreground">
        De {view.weightKg.toLocaleString("es-AR")} kg hacia 100, y después 90–95. No es indicación médica.
      </p>
      <WeightPanel
        today={today}
        weightKg={view.weightKg}
        weightSource={view.weightSource}
        whoopKg={view.whoopKg}
        goalKg={view.goalKg}
        goalDate={view.goalDate ?? today}
        goalDateSuggested={view.goalDateSuggested}
        weights={view.weights}
        cutAllowed={view.cutAllowed}
        cutReason={view.cutReason}
      />
    </div>
  );
}
