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
        Plan del entrenador, de lunes a domingo. Cítrico en cada desayuno. Carne roja dos veces
        (corte magro y milanesas al horno), pescado tres (merluza, atún rojo, salmón), legumbres de lata dos.
        Sin tomate crudo, sin berenjena, sin atún de lata y sin mariscos. La merienda no está en el papel:
        es fruta, yogur o pan integral según la carga. Cambiar solo ofrece un equivalente del mismo tipo.
      </p>
      <WeekBoard days={view.days} today={today} weightKg={view.weightKg} />
    </div>
  );
}
