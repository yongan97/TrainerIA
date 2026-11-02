import { WeekBoard } from "@/components/kitchen/week-board";
import { getKitchenView } from "@/lib/kitchen/store";

export const dynamic = "force-dynamic";

export default async function SemanaPage() {
  const today = new Date().toISOString().slice(0, 10);
  const view = await getKitchenView(today);
  return (
    <div>
      <h2 className="mb-1 text-2xl font-semibold tracking-tight">La semana</h2>
      <p className="mb-4 text-base text-muted-foreground">
        Base del plan del entrenador, adaptada: sin tomate crudo, sin berenjena, sin atún de lata.
        Carne magra tres veces (una es milanesa al horno), pollo dos, pescado tres, legumbres de lata dos.
        Cambiar solo ofrece un equivalente: un bife no se vuelve pollo.
      </p>
      <WeekBoard days={view.days} today={today} weightKg={view.weightKg} />
    </div>
  );
}
