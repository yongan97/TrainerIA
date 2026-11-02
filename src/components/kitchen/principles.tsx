import { MEDITERRANEAN_PRINCIPLES, NOT_MEDICAL } from "@/lib/kitchen/principles";

export function MediterraneanPrinciples() {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h2 className="text-xl font-semibold tracking-tight">Principios mediterráneos</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        Desayuno, almuerzo y cena son el plan de tu entrenador. Estas reglas no lo reemplazan: sacan lo que no podés comer y ordenan la semana.
      </p>
      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-foreground/90">
        {MEDITERRANEAN_PRINCIPLES.map((line) => (
          <li key={line} className="flex gap-2">
            <span className="text-primary">·</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-muted-foreground">{NOT_MEDICAL}</p>
    </section>
  );
}
