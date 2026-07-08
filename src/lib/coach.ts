/**
 * Motor de recomendación diaria — "el entrenador".
 * Combina las 3 capas (planificado/ejecutado/tolerado) + rehab en una decisión
 * accionable, con reglas priorizadas (la primera que matchea manda).
 */
export interface CoachContext {
  recovery: number | null;
  hrv: number | null;
  hrvBaseline: number | null;
  tsb: number | null; // forma (PMC)
  acwr: number | null; // carga aguda:crónica
  sleepHours: number | null;
  kneePain: number | null; // 0-10 de hoy
  plannedType: string | null; // sesión de hoy
  plannedIsHard: boolean;
  alreadyTrained: boolean;
}

export type CoachLevel = "go" | "modulate" | "rest" | "caution" | "recap";

export interface CoachBrief {
  level: CoachLevel;
  headline: string;
  reasons: string[];
  action: string;
}

const LABELS: Record<CoachLevel, string> = {
  go: "Luz verde",
  modulate: "Modulá",
  rest: "Descanso / suave",
  caution: "Cuidado",
  recap: "Ya entrenaste",
};

export function dailyBrief(c: CoachContext): CoachBrief {
  const reasons: string[] = [];
  if (c.recovery != null) reasons.push(`Recovery ${Math.round(c.recovery)}%`);
  if (c.hrv != null && c.hrvBaseline != null) {
    const diff = c.hrv - c.hrvBaseline;
    reasons.push(`HRV ${Math.round(c.hrv)}ms (${diff >= 0 ? "+" : ""}${Math.round(diff)} vs base)`);
  }
  if (c.tsb != null) reasons.push(`Forma ${c.tsb.toFixed(1)}`);
  if (c.acwr != null) reasons.push(`ACWR ${c.acwr.toFixed(2)}`);
  if (c.sleepHours != null) reasons.push(`Dormiste ${c.sleepHours.toFixed(1)}h`);
  if (c.kneePain != null) reasons.push(`Cuádriceps ${c.kneePain}/10`);

  const mk = (level: CoachLevel, action: string): CoachBrief => ({ level, headline: LABELS[level], reasons, action });

  // 1) Cuádriceps: la sobrecarga viene de la bici (técnica/cadencia baja).
  //    Si molesta y hoy hay bici, cuidá la cadencia o cambiá por fuerza/movilidad.
  if ((c.kneePain ?? 0) >= 5 && c.plannedType && /bici|bike|rodillo|simulador/i.test(c.plannedType)) {
    return mk("caution", "Cuádriceps sensible y toca bici: pedaleá suave y con cadencia alta (≥90 rpm), o cambiala por fuerza de glúteo/cadera + movilidad. Evitá fuerza en piñón pesado.");
  }
  if ((c.kneePain ?? 0) >= 6) {
    return mk("caution", "Cuádriceps con molestia marcada: día suave/fuerza, y ojo con la técnica de pedaleo cuando vuelvas a la bici.");
  }

  // 2) Sobrecarga fisiológica -> descanso.
  if ((c.recovery != null && c.recovery < 34) || (c.tsb != null && c.tsb <= -6)) {
    return mk("rest", "Tu cuerpo pide freno: descanso o movilidad muy suave. Priorizá sueño y comida.");
  }

  // 3) Pico de carga (riesgo).
  if (c.acwr != null && c.acwr > 1.5) {
    return mk("rest", "Carga aguda muy por encima de tu base: bajá el volumen esta semana para no romperte.");
  }

  // 4) Sesión de calidad con recovery bajo -> modular.
  if (c.plannedIsHard && c.recovery != null && c.recovery < 50) {
    return mk("modulate", `Hoy toca calidad (${c.plannedType}) pero venís justo: acortala, bajale la intensidad o movela un día.`);
  }

  // 5) Ya entrenaste.
  if (c.alreadyTrained) {
    return mk("recap", "Sesión hecha. Ahora la mejora se juega en la recuperación: hidratación, proteína y sueño.");
  }

  // 6) Zona amarilla de recovery: modular aunque no haya sesión de calidad.
  if (c.recovery != null && c.recovery < 50) {
    return mk(
      "modulate",
      c.plannedType
        ? `Recovery en amarillo (${Math.round(c.recovery)}%): hacé ${c.plannedType} en fácil/moderado, sin buscar intensidad.`
        : `Recovery en amarillo (${Math.round(c.recovery)}%): mejor un día fácil o descanso activo.`,
    );
  }

  // 7) Verde para calidad.
  if (c.recovery != null && c.recovery >= 67) {
    return mk("go", c.plannedType ? `Estás fresco: dale con ganas a ${c.plannedType}.` : "Estás fresco: buen día para meter calidad.");
  }

  // 7) Default: seguir el plan con cabeza.
  return mk("go", c.plannedType ? `Seguí el plan (${c.plannedType}) escuchando el cuerpo.` : "Día libre de plan: elegí según cómo te sientas.");
}
