"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  TrendingUp,
  HeartPulse,
  ClipboardList,
  Gauge,
  Moon,
  Trophy,
  CalendarRange,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SECTIONS: { title: string | null; links: { href: string; label: string; icon: typeof LayoutDashboard }[] }[] = [
  { title: null, links: [{ href: "/overview", label: "Hoy", icon: LayoutDashboard }] },
  {
    title: "Entrenamiento",
    links: [
      { href: "/calendar", label: "Calendario", icon: CalendarDays },
      { href: "/week", label: "Semana", icon: CalendarRange },
      { href: "/plan", label: "Plan", icon: ClipboardList },
    ],
  },
  {
    title: "Análisis",
    links: [
      { href: "/trends", label: "Tendencias", icon: TrendingUp },
      { href: "/forma", label: "Forma", icon: Gauge },
      { href: "/records", label: "Marcas", icon: Trophy },
    ],
  },
  {
    title: "Salud",
    links: [
      { href: "/sleep", label: "Sueño", icon: Moon },
      { href: "/rehab", label: "Rehab", icon: HeartPulse },
    ],
  },
  { title: null, links: [{ href: "/settings", label: "Configuración", icon: Settings }] },
];

const FLAT = SECTIONS.flatMap((s) => s.links);

/** Nav horizontal para mobile (scrollable). */
export function NavMobile() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto pb-1">
      {FLAT.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              active ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-4">
      {SECTIONS.map((section, i) => (
        <div key={i} className="flex flex-col gap-1">
          {section.title && (
            <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
              {section.title}
            </div>
          )}
          {section.links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
