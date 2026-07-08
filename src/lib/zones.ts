import type { Settings } from "@/lib/domain/types";

export interface HrZone {
  z: number;
  name: string;
  min: number | null; // bpm (null = sin límite inferior)
  max: number | null; // bpm (null = sin límite superior)
  color: string;
  desc: string;
}

/**
 * Zonas de FC para correr derivadas del umbral de lactato (LTHR), método Friel.
 * Boundaries como % del LTHR: 84 / 91 / 96 / 100.
 */
export function runHrZonesFromLTHR(lthr: number): HrZone[] {
  const b = (p: number) => Math.round((p / 100) * lthr);
  const z2 = b(84), z3 = b(91), z4 = b(96), z5 = b(100);
  return [
    { z: 1, name: "Recuperación", min: null, max: z2 - 1, color: "#2b93d1", desc: "Regenerativo, muy fácil" },
    { z: 2, name: "Aeróbico", min: z2, max: z3 - 1, color: "#2ba86a", desc: "Fondos, base — podés conversar" },
    { z: 3, name: "Tempo", min: z3, max: z4 - 1, color: "#eab308", desc: "Ritmo controlado, algo incómodo" },
    { z: 4, name: "Umbral", min: z4, max: z5, color: "#d1691f", desc: "Tus pasadas / T1" },
    { z: 5, name: "VO₂máx", min: z5 + 1, max: null, color: "#e0555f", desc: "Intervalos cortos, máximo" },
  ];
}

/** Devuelve las zonas configuradas del atleta, o null si no hay LTHR. */
export function getRunZones(settings: Settings | null): HrZone[] | null {
  if (!settings?.lthr) return null;
  return runHrZonesFromLTHR(settings.lthr);
}

/** Clasifica una FC media en su zona (según LTHR). */
export function classifyHr(bpm: number, zones: HrZone[]): HrZone | null {
  return zones.find((z) => (z.min == null || bpm >= z.min) && (z.max == null || bpm <= z.max)) ?? null;
}

export function formatZoneRange(z: HrZone): string {
  if (z.min == null) return `< ${(z.max ?? 0) + 1}`;
  if (z.max == null) return `${z.min}+`;
  return `${z.min}–${z.max}`;
}
