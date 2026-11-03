"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/nutricion", label: "Hoy" },
  { href: "/nutricion/semana", label: "Semana" },
  { href: "/nutricion/salsas", label: "Salsas" },
  { href: "/nutricion/compras", label: "Compras" },
  { href: "/nutricion/peso", label: "Peso" },
];

export function KitchenNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/nutricion/cocina")) return null;
  return (
    <nav className="mb-6 flex gap-2 overflow-x-auto pb-1">
      {LINKS.map((l) => {
        const active = l.href === "/nutricion" ? pathname === "/nutricion" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl px-4 text-base font-medium transition-colors",
              active ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/80",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function KitchenIntro() {
  const pathname = usePathname();
  if (pathname.startsWith("/nutricion/cocina")) return null;
  return (
    <header className="mb-4">
      <h1 className="text-3xl font-semibold tracking-tight">Cocina</h1>
      <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        El menú es el plan semanal de tu entrenador, con plato de Harvard y principios mediterráneos.
        Proteína 1,8 g/kg e hidratos según la carga son la cuenta de entreno, no un menú de otra persona.
        No es consejo médico. Confirmalo con un nutricionista.
      </p>
    </header>
  );
}
