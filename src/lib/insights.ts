/**
 * Motor de alertas: escanea los datos y devuelve señales que merecen atención,
 * con base en marcadores reconocidos (RHR elevado, HRV suprimida, deuda de
 * sueño, ACWR, dolor, adherencia).
 */
export type InsightLevel = "alert" | "warn" | "info" | "good";

export interface Insight {
  level: InsightLevel;
  title: string;
  detail: string;
}

interface RecoveryRow { date: string; recovery_score: number | null; hrv_rmssd: number | null; rhr: number | null }
interface CycleRow { date: string; day_strain: number | null }

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export interface InsightData {
  recovery: RecoveryRow[]; // date desc
  cycles: CycleRow[]; // date desc
  sleepHours7: number[]; // últimas noches (horas)
  kneePainRecent: number[]; // últimos 7 días
  acwr: number | null;
  adherencePct: number | null;
}

export function computeInsights(d: InsightData): Insight[] {
  const out: Insight[] = [];
  const rec = d.recovery;

  // HRV suprimida: media 3d vs base 30d
  const hrvAll = rec.map((r) => r.hrv_rmssd).filter((v): v is number => v != null);
  const hrv3 = avg(rec.slice(0, 3).map((r) => r.hrv_rmssd).filter((v): v is number => v != null));
  const hrvBase = avg(hrvAll);
  if (hrv3 != null && hrvBase != null && hrv3 < hrvBase * 0.9) {
    out.push({ level: "warn", title: "HRV por debajo de tu base", detail: `Tu HRV de los últimos días (${Math.round(hrv3)}ms) está bajo tu media (${Math.round(hrvBase)}ms). Señal de fatiga o estrés: priorizá recuperar.` });
  }

  // RHR elevada: media 3d vs base 30d
  const rhrAll = rec.map((r) => r.rhr).filter((v): v is number => v != null);
  const rhr3 = avg(rec.slice(0, 3).map((r) => r.rhr).filter((v): v is number => v != null));
  const rhrBase = avg(rhrAll);
  if (rhr3 != null && rhrBase != null && rhr3 > rhrBase + 3) {
    out.push({ level: "alert", title: "FC en reposo elevada", detail: `Tu FC de reposo reciente (${Math.round(rhr3)} bpm) está por encima de tu base (${Math.round(rhrBase)}). Puede ser fatiga acumulada o el inicio de algo: cuidado.` });
  }

  // Racha de recovery bajo
  let redStreak = 0;
  for (const r of rec) {
    if (r.recovery_score != null && r.recovery_score < 34) redStreak++;
    else break;
  }
  if (redStreak >= 2) {
    out.push({ level: "alert", title: `${redStreak} días de recovery en rojo`, detail: "Recuperación insuficiente sostenida. Meté un día de descanso o descarga." });
  }

  // Deuda de sueño
  const meanSleep = avg(d.sleepHours7);
  if (meanSleep != null && meanSleep < 7) {
    out.push({ level: "warn", title: "Poco sueño esta semana", detail: `Dormís ${meanSleep.toFixed(1)} h de media. El sueño es donde adaptás el entrenamiento: apuntá a 7.5–8 h.` });
  }

  // ACWR
  if (d.acwr != null && d.acwr > 1.5) {
    out.push({ level: "alert", title: "Pico de carga (ACWR alto)", detail: `Tu carga aguda está ${d.acwr.toFixed(2)}× tu base. Alto riesgo de lesión/fatiga: bajá el volumen.` });
  } else if (d.acwr != null && d.acwr > 1.3) {
    out.push({ level: "warn", title: "Carga subiendo rápido", detail: `ACWR ${d.acwr.toFixed(2)}. Vas bien pero cuidá la progresión.` });
  }

  // Dolor de rodilla
  const maxPain = d.kneePainRecent.length ? Math.max(...d.kneePainRecent) : 0;
  if (maxPain >= 4) {
    out.push({ level: "warn", title: "Dolor de rodilla por encima del umbral", detail: `Registraste dolor de ${maxPain}/10. Sobre 4/10, modulá el impacto y reforzá glúteo/cadera.` });
  }

  // Adherencia
  if (d.adherencePct != null && d.adherencePct < 60) {
    out.push({ level: "info", title: "Adherencia baja al plan", detail: `Cumpliste el ${d.adherencePct}% de lo planificado. Si el plan no encaja, vale ajustarlo con tu entrenador.` });
  }

  if (out.length === 0) {
    out.push({ level: "good", title: "Todo en orden", detail: "No hay señales de alerta: recuperación, carga y salud dentro de rango. Seguí ejecutando." });
  }
  return out;
}
