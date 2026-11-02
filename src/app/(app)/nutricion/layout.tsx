import { KitchenIntro, KitchenNav } from "@/components/kitchen/nav";

export default function NutricionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <KitchenIntro />
      <KitchenNav />
      {children}
    </div>
  );
}
