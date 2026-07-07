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
