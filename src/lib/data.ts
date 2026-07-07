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
