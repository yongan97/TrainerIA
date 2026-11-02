import { SaucesView } from "@/components/kitchen/sauces-view";

export const dynamic = "force-dynamic";

export default function SalsasPage() {
  return (
    <div>
      <h2 className="mb-3 text-2xl font-semibold tracking-tight">Salsas</h2>
      <SaucesView />
    </div>
  );
}
