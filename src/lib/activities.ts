import type { Activity } from "@/lib/domain/types";

/** Detecta si una actividad de bici fue indoor (rodillo/Rouvy/spin). */
export function isIndoorBike(a: Pick<Activity, "sport" | "source" | "raw">): boolean {
  if (a.sport !== "bike") return false;
  const raw = a.raw as Record<string, unknown> | null;
  if (!raw) return false;
  // Garmin: activityType.typeKey (virtual_ride, indoor_cycling, ...)
  const at = raw.activityType as { typeKey?: string } | undefined;
  const key = (at?.typeKey ?? "").toLowerCase();
  if (/virtual|indoor|trainer|rouvy|zwift/.test(key)) return true;
  // Whoop: sport_name (spin)
  const sn = (raw.sport_name as string | undefined)?.toLowerCase() ?? "";
  if (/spin|indoor/.test(sn)) return true;
  return false;
}

/** Minutos de una actividad. */
export function minutesOf(a: Pick<Activity, "duration_s">): number {
  return (a.duration_s ?? 0) / 60;
}
