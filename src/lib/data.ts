import { getAdminClient } from "@/lib/supabase/admin";
import type {
  WhoopRecovery,
  Activity,
  PlannedSession,
  RehabLog,
} from "@/lib/domain/types";

/** ¿Están las env de Supabase presentes? (build sin secrets no debe romper). */
export function isConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export async function isWhoopConnected(): Promise<boolean> {
  if (!isConfigured()) return false;
  try {
    const db = getAdminClient();
    const { count } = await db
      .from("oauth_tokens")
      .select("provider", { count: "exact", head: true });
    return (count ?? 0) > 0;
  } catch {
    return false;
  }
}

export interface DailyRow {
  date: string;
  recovery_score: number | null;
  hrv_rmssd: number | null;
  rhr: number | null;
  sleep_duration_s: number | null;
  sleep_efficiency: number | null;
  day_strain: number | null;
  activity_count: number;
  total_duration_s: number | null;
  total_load: number | null;
  sports: string[] | null;
  planned_count: number;
  planned_sports: string[] | null;
}

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (!isConfigured()) return fallback;
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export function getRecovery(limit = 30): Promise<WhoopRecovery[]> {
  return safe(async () => {
    const db = getAdminClient();
    const { data } = await db
      .from("whoop_recovery")
      .select("*")
      .order("date", { ascending: false })
      .limit(limit);
    return (data ?? []) as WhoopRecovery[];
  }, []);
}

export function getDailySummary(limit = 30): Promise<DailyRow[]> {
  return safe(async () => {
    const db = getAdminClient();
    const { data } = await db
      .from("daily_summary")
      .select("*")
      .limit(limit);
    return (data ?? []) as DailyRow[];
  }, []);
}

export function getActivities(limit = 50): Promise<Activity[]> {
  return safe(async () => {
    const db = getAdminClient();
    const { data } = await db
      .from("activities")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(limit);
    return (data ?? []) as Activity[];
  }, []);
}

export function getActivity(id: string): Promise<Activity | null> {
  return safe(async () => {
    const db = getAdminClient();
    const { data } = await db
      .from("activities")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    return (data as Activity) ?? null;
  }, null);
}

export function getPlanned(limit = 60): Promise<PlannedSession[]> {
  return safe(async () => {
    const db = getAdminClient();
    const { data } = await db
      .from("planned_sessions")
      .select("*")
      .order("date", { ascending: false })
      .limit(limit);
    return (data ?? []) as PlannedSession[];
  }, []);
}

export interface HomeData {
  recovery: WhoopRecovery | null;
  sleepDurationS: number | null;
  todayStrain: number | null;
  trained: Activity[]; // ejecutado de hoy
  next: PlannedSession | null; // sesión de hoy o la próxima
  nextIsToday: boolean;
}

/** Datos "de hoy" para el home: cómo estoy, qué toca, si ya entrené. */
export function getHomeData(today: string): Promise<HomeData> {
  const tomorrow = new Date(new Date(today + "T00:00:00").getTime() + 86_400_000)
    .toISOString()
    .slice(0, 10);
  return safe<HomeData>(
    async () => {
      const db = getAdminClient();
      const [rec, sleep, cycle, acts, planned] = await Promise.all([
        db.from("whoop_recovery").select("*").order("date", { ascending: false }).limit(1),
        db.from("whoop_sleep").select("duration_s").order("date", { ascending: false }).limit(1),
        db.from("whoop_cycles").select("day_strain").eq("date", today).limit(1),
        db
          .from("activities")
          .select("*")
          .gte("started_at", today)
          .lt("started_at", tomorrow)
          .order("started_at", { ascending: false }),
        db
          .from("planned_sessions")
          .select("*")
          .gte("date", today)
          .order("date", { ascending: true })
          .limit(1),
      ]);
      const next = (planned.data?.[0] as PlannedSession) ?? null;
      return {
        recovery: (rec.data?.[0] as WhoopRecovery) ?? null,
        sleepDurationS: (sleep.data?.[0]?.duration_s as number) ?? null,
        todayStrain: (cycle.data?.[0]?.day_strain as number) ?? null,
        trained: (acts.data ?? []) as Activity[],
        next,
        nextIsToday: next?.date === today,
      };
    },
    {
      recovery: null,
      sleepDurationS: null,
      todayStrain: null,
      trained: [],
      next: null,
      nextIsToday: false,
    },
  );
}

import { computePmc, rollingAvg } from "@/lib/analytics";
import type { CoachContext } from "@/lib/coach";

/** Junta todo el contexto de hoy para el motor de coaching. */
export function getCoachContext(today: string): Promise<CoachContext> {
  const tomorrow = new Date(new Date(today + "T00:00:00").getTime() + 86_400_000).toISOString().slice(0, 10);
  const empty: CoachContext = {
    recovery: null, hrv: null, hrvBaseline: null, tsb: null, acwr: null,
    sleepHours: null, kneePain: null, plannedType: null, plannedIsHard: false, alreadyTrained: false,
  };
  return safe<CoachContext>(async () => {
    const db = getAdminClient();
    const [recR, cycR, slpR, rhbR, plnR, actR] = await Promise.all([
      db.from("whoop_recovery").select("date, recovery_score, hrv_rmssd").order("date", { ascending: false }).limit(30),
      db.from("whoop_cycles").select("date, day_strain").order("date", { ascending: false }).limit(90),
      db.from("whoop_sleep").select("duration_s").order("date", { ascending: false }).limit(1),
      db.from("rehab_logs").select("knee_pain").eq("date", today).limit(1),
      db.from("planned_sessions").select("type, targets").eq("date", today),
      db.from("activities").select("id").gte("started_at", today).lt("started_at", tomorrow).limit(1),
    ]);

    const recs = (recR.data ?? []) as Array<{ date: string; recovery_score: number | null; hrv_rmssd: number | null }>;
    const latest = recs[0];
    const hrvAsc = [...recs].reverse().map((r) => r.hrv_rmssd);
    const hrvBase = rollingAvg(hrvAsc, 7);

    // Serie de carga continua para PMC/ACWR
    const cyc = (cycR.data ?? []) as Array<{ date: string; day_strain: number | null }>;
    const byDay = new Map(cyc.map((c) => [c.date, c.day_strain ?? 0]));
    const dates: string[] = [];
    const start = new Date(new Date(today + "T00:00:00").getTime() - 89 * 86_400_000);
    for (let d = new Date(start); d <= new Date(today + "T00:00:00"); d.setUTCDate(d.getUTCDate() + 1)) {
      dates.push(d.toISOString().slice(0, 10));
    }
    const load = dates.map((d) => byDay.get(d) ?? 0);
    const pmc = computePmc(load);
    const tsb = pmc.length ? pmc[pmc.length - 1].tsb : null;
    const acuteArr = rollingAvg(load, 7);
    const chronicArr = rollingAvg(load, 28);
    const acute = acuteArr[acuteArr.length - 1];
    const chronic = chronicArr[chronicArr.length - 1];
    const acwrRatio = acute != null && chronic != null && chronic > 0 ? acute / chronic : null;

    const plans = (plnR.data ?? []) as Array<{ type: string | null; targets: unknown }>;
    const plannedType = plans[0]?.type ?? null;
    const plannedIsHard = plans.some((p) => {
      const codigo = (p.targets as { codigo?: string })?.codigo;
      return codigo === "T1" || /t1|series|pasada|calidad|interval/i.test(p.type ?? "");
    });

    return {
      recovery: latest?.recovery_score ?? null,
      hrv: latest?.hrv_rmssd ?? null,
      hrvBaseline: hrvBase.length ? hrvBase[hrvBase.length - 1] : null,
      tsb,
      acwr: acwrRatio,
      sleepHours: slpR.data?.[0]?.duration_s != null ? (slpR.data[0].duration_s as number) / 3600 : null,
      kneePain: (rhbR.data?.[0]?.knee_pain as number) ?? null,
      plannedType,
      plannedIsHard,
      alreadyTrained: (actR.data?.length ?? 0) > 0,
    };
  }, empty);
}

export interface SyncStatus {
  whoopLast: string | null; // YYYY-MM-DD
  garminLast: string | null; // YYYY-MM-DD
}

/** Última fecha de dato de cada fuente, para mostrar el estado de actualización. */
export function getSyncStatus(): Promise<SyncStatus> {
  return safe<SyncStatus>(async () => {
    const db = getAdminClient();
    const [w, g] = await Promise.all([
      db.from("whoop_recovery").select("date").order("date", { ascending: false }).limit(1),
      db
        .from("activities")
        .select("started_at")
        .eq("source", "garmin")
        .order("started_at", { ascending: false })
        .limit(1),
    ]);
    return {
      whoopLast: (w.data?.[0]?.date as string) ?? null,
      garminLast: (g.data?.[0]?.started_at as string)?.slice(0, 10) ?? null,
    };
  }, { whoopLast: null, garminLast: null });
}

export function getSleep(limit = 30): Promise<import("@/lib/domain/types").WhoopSleep[]> {
  return safe(async () => {
    const db = getAdminClient();
    const { data } = await db
      .from("whoop_sleep")
      .select("*")
      .order("date", { ascending: false })
      .limit(limit);
    return (data ?? []) as import("@/lib/domain/types").WhoopSleep[];
  }, []);
}

export interface CycleRow {
  date: string;
  day_strain: number | null;
}

export function getCycles(limit = 60): Promise<CycleRow[]> {
  return safe(async () => {
    const db = getAdminClient();
    const { data } = await db
      .from("whoop_cycles")
      .select("date, day_strain")
      .order("date", { ascending: false })
      .limit(limit);
    return (data ?? []) as CycleRow[];
  }, []);
}

export function getRehabLogs(limit = 60): Promise<RehabLog[]> {
  return safe(async () => {
    const db = getAdminClient();
    const { data } = await db
      .from("rehab_logs")
      .select("*")
      .order("date", { ascending: false })
      .limit(limit);
    return (data ?? []) as RehabLog[];
  }, []);
}
