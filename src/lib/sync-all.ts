import { getAdminClient } from "@/lib/supabase/admin";
import { syncWhoop } from "@/lib/whoop/sync";
import { garminConfigured, fetchGarminActivities } from "@/lib/garmin/connect";
import { reconcileActivities } from "@/lib/reconcile";

/** Sync de Garmin best-effort: nunca tira el proceso si Garmin falla. */
async function syncGarminBestEffort() {
  if (!garminConfigured().ok) return { skipped: true };
  try {
    const rows = await fetchGarminActivities(30);
    if (rows.length) {
      const db = getAdminClient();
      await db.from("activities").upsert(rows, { onConflict: "external_id" });
    }
    return { imported: rows.length };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

/** Corre todo el pipeline: Whoop + Garmin + reconciliación.
 *  sinceISO opcional para backfill de historia más profunda de Whoop. */
export async function runAllSync(sinceISO?: string) {
  const [whoop, garmin] = await Promise.all([syncWhoop(sinceISO), syncGarminBestEffort()]);
  const reconciled = await reconcileActivities();
  return { whoop, garmin, reconciled };
}
