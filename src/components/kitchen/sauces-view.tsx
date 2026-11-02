import Link from "next/link";
import { ChefHat } from "lucide-react";
import { SAUCES } from "@/lib/kitchen/sauces";

export function SaucesView() {
  return (
    <div className="space-y-3">
      <p className="text-base text-muted-foreground">
        Las que pediste. El aderezo de todos los días es oliva, sal y limón. Chimichurri no: no te gusta.
      </p>
      {SAUCES.map((s) => (
        <article key={s.id} className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-2xl font-semibold tracking-tight">{s.title}</h2>
          <p className="mt-1 text-base text-foreground/90">{s.use}</p>
          <p className="mt-1 text-sm text-muted-foreground">{s.keeps} · {s.minutes} min</p>
          <Link
            href={`/nutricion/cocina/${s.id}`}
            className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary px-4 text-base font-semibold text-primary-foreground"
          >
            <ChefHat className="h-5 w-5" />
            Preparar
          </Link>
        </article>
      ))}
    </div>
  );
}
