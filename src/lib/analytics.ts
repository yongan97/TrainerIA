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
