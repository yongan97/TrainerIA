/**
 * ¿Hoy se entrena, y cuánto hidrato corresponde?
 * Lee sesiones planificadas (y, si ya entrenó, lo ejecutado).
 * Nunca recorta en semana de carrera. "Carga lenta" es un ejercicio del
 * entrenador (cadencia baja), no una semana de carga: no matchea eso.
 */

import type { CarbBand, DayFuel, SessionLite } from "@/lib/kitchen/types";
import { addDays, mondayOf, weekdayIndex, WEEKDAY_LABELS } from "@/lib/kitchen/targets";

export interface TypicalSlot {
  dow: number;
  sport: string;
  type: string;
  minutes: number;
  codigo: string;
}

/**
 * Semana tipo según la disponibilidad que ya le funciona, para cuando
 * el mesociclo de esta semana todavía no está cargado.
 * Jueves no entrena.
 */
export const SEMANA_TIPO: TypicalSlot[] = [
  { dow: 0, sport: "run", type: "Trote suave", minutes: 40, codigo: "TR1" },
  { dow: 1, sport: "run", type: "Trote corto", minutes: 35, codigo: "TR2" },
  { dow: 2, sport: "bike", type: "T1 · Progresivo 5/4/3", minutes: 75, codigo: "T1" },
  { dow: 4, sport: "bike", type: "T2 · 1 min carga lenta + 4 min FTP", minutes: 70, codigo: "T2" },
  { dow: 6, sport: "bike", type: "Fondo Z2", minutes: 180, codigo: "T3" },
];

export function bandForSession(type: string | null, codigo: string | null, minutes: number, sport: string | null): CarbBand {
  const text = `${type ?? ""} ${codigo ?? ""}`.toLowerCase();
  const bike = sport === "bike" || /bici|bike|rodillo|fondo/.test(text);

  if (/fondo|carrera|race/.test(text) || codigo === "T3" || minutes >= 120) return "long";
  if (codigo === "T1" || /umbral|vo2|series|interval/.test(text)) return "quality";
  if (codigo === "T2" && bike) return "quality";
  if (codigo === "T2" && minutes >= 50) return "quality";
  if (minutes >= 90) return "long";
  if (minutes > 0) return "easy";
  return "rest";
}

const RANK: Record<CarbBand, number> = { rest: 0, easy: 1, quality: 2, long: 3, load: 4 };

function higher(a: CarbBand, b: CarbBand): CarbBand {
  return RANK[a] >= RANK[b] ? a : b;
}

/** Días hasta la carrera. Negativo si ya pasó. */
export function daysToGoal(date: string, goalDate: string | null): number | null {
  if (!goalDate) return null;
  const ms = new Date(goalDate + "T12:00:00Z").getTime() - new Date(date + "T12:00:00Z").getTime();
  return Math.round(ms / 86_400_000);
}

/**
 * Semana de carrera = los 7 días que terminan el día de la carrera.
 * Ahí no se recorta, aunque el resto del mes sí.
 */
export function raceWeek(weekStart: string, goalDate: string | null): boolean {
  if (!goalDate) return false;
  const start = new Date(weekStart + "T12:00:00Z").getTime();
  const end = start + 6 * 86_400_000;
  const goal = new Date(goalDate + "T12:00:00Z").getTime();
  const raceWeekStart = goal - 6 * 86_400_000;
  return start <= goal && end >= raceWeekStart && goal >= start - 6 * 86_400_000;
}

export function buildWeekFuel(input: {
  today: string;
  goalDate: string | null;
  planned: SessionLite[];
  /** Minutos ya entrenados hoy, si los hay. */
  trainedMinutesToday: number | null;
  trainedLabelToday: string | null;
}): { days: DayFuel[]; usingTypicalWeek: boolean; cutAllowed: boolean; cutReason: string } {
  const weekStart = mondayOf(input.today);
  const inWeek = input.planned.filter((s) => s.date >= weekStart && s.date <= addDays(weekStart, 6));
  const usingTypicalWeek = inWeek.length === 0;
  const noCut = raceWeek(weekStart, input.goalDate);

  const days: DayFuel[] = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(weekStart, i);
    const plannedToday = (usingTypicalWeek ? [] : inWeek).filter((s) => s.date === date);
    const typical = SEMANA_TIPO.find((s) => s.dow === i) ?? null;

    let minutes = 0;
    let sessionLabel: string | null = null;
    let sport: string | null = null;
    let codigo: string | null = null;
    let source: DayFuel["source"] = "descanso";

    if (!usingTypicalWeek && plannedToday.length) {
      const main = [...plannedToday].sort((a, b) => b.minutes - a.minutes)[0];
      minutes = plannedToday.reduce((s, x) => s + x.minutes, 0);
      sessionLabel = plannedToday.map((s) => s.type || "Sesión").join(" + ");
      sport = main.sport;
      codigo = main.codigo;
      source = "plan";
    } else if (usingTypicalWeek && typical) {
      minutes = typical.minutes;
      sessionLabel = typical.type;
      sport = typical.sport;
      codigo = typical.codigo;
      source = "tipica";
    }

    if (date === input.today && (input.trainedMinutesToday ?? 0) > minutes) {
      minutes = input.trainedMinutesToday ?? minutes;
      sessionLabel = input.trainedLabelToday || sessionLabel || "Ya entrenaste";
      source = "entrenado";
    }

    let band: CarbBand = minutes > 0 ? bandForSession(sessionLabel, codigo, minutes, sport) : "rest";
    const toGoal = daysToGoal(date, input.goalDate);
    // 0 a 3 días antes (y el mismo día): carga escandinava. No se recorta esa ventana.
    if (toGoal != null && toGoal >= 0 && toGoal <= 3) band = higher(band, "load");

    days.push({
      date,
      weekday: weekdayIndex(date),
      label: WEEKDAY_LABELS[i],
      training: band !== "rest",
      band,
      minutes,
      sessionLabel,
      sport,
      source,
      cutNote: noCut || band === "load" ? "Hoy no se recorta." : null,
    });
  }

  const cutAllowed = !noCut && !days.some((d) => d.band === "load");
  const cutReason = !cutAllowed
    ? "Semana de carrera o de carga de glucógeno: comé para rendir. El descenso espera."
    : "Esta semana se puede bajar, con tope de 0,5 kg. El día de fondo no se recorta: ahí van los hidratos.";

  return { days, usingTypicalWeek, cutAllowed, cutReason };
}

/** Minutos de una fila de planned_sessions, con los campos que ya usa el plan. */
export function minutesFromPlanned(row: {
  sport?: string | null;
  type?: string | null;
  target_duration_s?: number | null;
  targets?: Record<string, unknown> | null;
}): { minutes: number; codigo: string | null } {
  const t = row.targets ?? {};
  const codigo = typeof t.codigo === "string" ? t.codigo : null;
  if (row.target_duration_s && row.target_duration_s > 0) {
    return { minutes: Math.round(row.target_duration_s / 60), codigo };
  }
  if (typeof t.duracion_min === "number" && t.duracion_min > 0) {
    return { minutes: t.duracion_min, codigo };
  }
  if (typeof t.distancia_km === "number" && t.distancia_km > 0) {
    const bike = row.sport === "bike" || /bici|bike/i.test(row.type ?? "");
    const min = bike ? (t.distancia_km / 32) * 60 : (t.distancia_km / 10) * 60;
    return { minutes: Math.round(min), codigo };
  }
  if (codigo === "T3" || /fondo/i.test(row.type ?? "")) return { minutes: 150, codigo };
  if (codigo === "T1" || codigo === "T2") return { minutes: 70, codigo };
  if (/suave|trote/i.test(row.type ?? "")) return { minutes: 35, codigo };
  return { minutes: 0, codigo };
}
