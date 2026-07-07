export function fmt(n: number | null | undefined, digits = 0): string {
  return n == null ? "—" : n.toFixed(digits);
}

export function fmtDuration(seconds: number | null | undefined): string {
  if (seconds == null) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function fmtPace(secondsPerKm: number | null | undefined): string {
  if (secondsPerKm == null) return "—";
  const m = Math.floor(secondsPerKm / 60);
  const s = Math.round(secondsPerKm % 60);
  return `${m}:${s.toString().padStart(2, "0")}/km`;
}

export function fmtDistance(meters: number | null | undefined): string {
  if (meters == null) return "—";
  return `${(meters / 1000).toFixed(1)} km`;
}

export function fmtDate(iso: string): string {
  const d = new Date(iso.length <= 10 ? iso + "T00:00:00" : iso);
  return d.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

/** "hoy" / "ayer" / "hace N días" / fecha corta. Para estado de sync. */
export function fmtRelativeDay(date: string | null): string {
  if (!date) return "sin datos";
  const d = new Date(date + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((today.getTime() - d.getTime()) / 86_400_000);
  if (days <= 0) return "hoy";
  if (days === 1) return "ayer";
  if (days < 7) return `hace ${days} días`;
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
}

/** Días de antigüedad de un dato (para semáforo de frescura). */
export function daysAgo(date: string | null): number | null {
  if (!date) return null;
  const d = new Date(date + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((today.getTime() - d.getTime()) / 86_400_000);
}

export function recoveryColor(score: number | null | undefined): string {
  if (score == null) return "text-muted-foreground";
  if (score >= 67) return "text-primary";
  if (score >= 34) return "text-yellow-400";
  return "text-red-400";
}
