import { ShoppingList } from "@/components/kitchen/shopping-list";
import { getKitchenView } from "@/lib/kitchen/store";
import { formatDayLong } from "@/lib/kitchen/targets";

export const dynamic = "force-dynamic";

export default async function ComprasPage() {
  const today = new Date().toISOString().slice(0, 10);
  const view = await getKitchenView(today);
  return (
    <div>
      <h2 className="mb-1 text-2xl font-semibold tracking-tight">Lista de compras</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Semana del {formatDayLong(view.weekStart)}. Lo que tildás queda guardado para esta semana.
      </p>
      <ShoppingList lines={view.shopping} checks={view.checks} weekStart={view.weekStart} />
    </div>
  );
}
