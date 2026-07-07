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

export function recoveryColor(score: number | null | undefined): string {
  if (score == null) return "text-muted-foreground";
  if (score >= 67) return "text-primary";
  if (score >= 34) return "text-yellow-400";
  return "text-red-400";
}
