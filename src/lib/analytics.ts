/**
 * Funciones de análisis de entrenador: medias móviles, línea base de HRV,
 * y carga aguda/crónica (ACWR). Puras, testeables, sin dependencias.
 */

/** Media móvil (ventana hacia atrás, ignora nulls). */
export function rollingAvg(
  values: (number | null)[],
  window: number,
): (number | null)[] {
  return values.map((_, i) => {
    const slice = values.slice(Math.max(0, i - window + 1), i + 1).filter((v): v is number => v != null);
    if (!slice.length) return null;
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}

export interface AcwrStatus {
  acute: number | null; // carga aguda (media 7d)
  chronic: number | null; // carga crónica (media 28d)
  ratio: number | null;
  zone: "detrain" | "optimo" | "precaucion" | "riesgo" | "sin_dato";
  label: string;
  advice: string;
}

/**
 * ACWR = carga aguda (7d) / carga crónica (28d).
 * Sweet spot 0.8–1.3; >1.5 dispara riesgo de lesión/fatiga.
 */
export function acwr(acute: number | null, chronic: number | null): AcwrStatus {
  if (acute == null || chronic == null || chronic === 0) {
    return { acute, chronic, ratio: null, zone: "sin_dato", label: "Sin datos suficientes", advice: "Necesito ~4 semanas de carga para calcular esto." };
  }
  const ratio = acute / chronic;
  if (ratio < 0.8)
    return { acute, chronic, ratio, zone: "detrain", label: "Carga baja", advice: "Venís bajando el volumen: hay margen para construir." };
  if (ratio <= 1.3)
    return { acute, chronic, ratio, zone: "optimo", label: "Zona óptima", advice: "Progresión saludable. Seguí así." };
  if (ratio <= 1.5)
    return { acute, chronic, ratio, zone: "precaucion", label: "Precaución", advice: "Subiste rápido la carga: cuidá la recuperación." };
  return { acute, chronic, ratio, zone: "riesgo", label: "Riesgo alto", advice: "Pico de carga: alto riesgo de fatiga/lesión. Aflojá." };
}

export interface PmcPoint {
  ctl: number; // Fitness (fondo, EMA 42d)
  atl: number; // Fatiga (EMA 7d)
  tsb: number; // Forma (CTL de ayer - ATL de ayer)
}

/**
 * Performance Management Chart (TrainingPeaks). Carga diaria -> Fitness (CTL,
 * EMA 42d), Fatiga (ATL, EMA 7d) y Forma (TSB = CTL_ayer - ATL_ayer).
 * Días sin carga cuentan como 0 (descanso: la fatiga baja rápido).
 */
export function computePmc(dailyLoad: number[]): PmcPoint[] {
  const out: PmcPoint[] = [];
  let ctl = dailyLoad[0] ?? 0;
  let atl = dailyLoad[0] ?? 0;
  for (let i = 0; i < dailyLoad.length; i++) {
    const load = dailyLoad[i] ?? 0;
    const tsb = ctl - atl; // forma = fitness - fatiga de AYER
    ctl = ctl + (load - ctl) / 42;
    atl = atl + (load - atl) / 7;
    out.push({ ctl, atl, tsb });
  }
  return out;
}

export interface FormStatus {
  label: string;
  advice: string;
  tone: "fresh" | "neutral" | "productive" | "loaded" | "overreached";
}

/** Interpreta la Forma (TSB) en unidades de strain (Whoop). */
export function formStatus(tsb: number | null): FormStatus {
  if (tsb == null) return { label: "—", advice: "Sin datos.", tone: "neutral" };
  if (tsb >= 3) return { label: "Fresco / a punto", advice: "Buen momento para un test o competir.", tone: "fresh" };
  if (tsb >= 0) return { label: "Fresco leve", advice: "Recuperado; podés meter calidad.", tone: "neutral" };
  if (tsb >= -3) return { label: "Entrenando (productivo)", advice: "Zona ideal para construir forma.", tone: "productive" };
  if (tsb >= -6) return { label: "Cargado", advice: "Fatiga acumulada: cuidá la recuperación.", tone: "loaded" };
  return { label: "Sobrecargado", advice: "Mucha fatiga: meté descanso o descarga.", tone: "overreached" };
}

export interface TrainingStatus {
  label: string;
  advice: string;
  tone: "productive" | "maintaining" | "peaking" | "overreach" | "detrain";
}

/** Estado de entrenamiento a partir de la tendencia del fitness (CTL) y la forma (TSB). */
export function trainingStatus(ctlNow: number, ctlPrev: number, tsb: number): TrainingStatus {
  const slope = ctlNow - ctlPrev; // cambio de fitness en la ventana
  if (tsb <= -6) return { label: "Sobrecarga", advice: "Fatiga alta: sumá recuperación antes de seguir cargando.", tone: "overreach" };
  if (tsb >= 4 && slope <= 0.2) return { label: "En pico / afinando", advice: "Fresco y con fitness: buen momento para rendir.", tone: "peaking" };
  if (slope > 0.3) return { label: "Productivo", advice: "Estás construyendo fitness de forma sostenible. Seguí.", tone: "productive" };
  if (slope < -0.3) return { label: "Desentrenando", advice: "El fitness baja: si no es descarga intencional, subí un poco el volumen.", tone: "detrain" };
  return { label: "Manteniendo", advice: "Fitness estable. Para progresar, aumentá la carga gradualmente.", tone: "maintaining" };
}

/** Tendencia de una serie: pendiente simple (últimos n vs previos). */
export function trendArrow(values: (number | null)[], window = 7): "up" | "down" | "flat" {
  const clean = values.filter((v): v is number => v != null);
  if (clean.length < window) return "flat";
  const recent = clean.slice(-window);
  const prev = clean.slice(-window * 2, -window);
  if (!prev.length) return "flat";
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const diff = avg(recent) - avg(prev);
  const base = avg(prev) || 1;
  if (diff / base > 0.03) return "up";
  if (diff / base < -0.03) return "down";
  return "flat";
}
