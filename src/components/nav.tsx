"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  TrendingUp,
  HeartPulse,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/calendar", label: "Calendario", icon: CalendarDays },
  { href: "/trends", label: "Tendencias", icon: TrendingUp },
  { href: "/plan", label: "Plan", icon: ClipboardList },
  { href: "/rehab", label: "Rehab", icon: HeartPulse },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
