import { getAdminClient } from "@/lib/supabase/admin";

/**
 * Reconcilia actividades duplicadas entre fuentes.
 *
 * Regla acordada: Garmin (y las manuales) son la fuente de verdad del EJECUTADO
 * porque traen el detalle por deporte (watts/pace/cadencia). Whoop aporta el
 * `strain`, que Garmin no tiene. Cuando la MISMA sesión llega por ambas fuentes
 * (mismo deporte y arranque dentro de una ventana de tiempo), copiamos el strain
 * de Whoop sobre la fila de Garmin y borramos la fila duplicada de Whoop.
 *
 * Los días con solo Whoop (no se usó el Garmin) quedan intactos. Los spins/
 * sesiones múltiples del mismo día se respetan porque el match es por horario,
 * no por día.
 */
const MATCH_WINDOW_MS = 30 * 60 * 1000; // 30 min

interface Row {
  id: string;
  sport: string;
  started_at: string;
  strain: number | null;
  hr_zones: Record<string, number> | null;
}

export async function reconcileActivities(): Promise<{
  merged: number;
  strainCopied: number;
}> {
  const db = getAdminClient();

  const [{ data: primaries }, { data: whoops }] = await Promise.all([
    db
      .from("activities")
      .select("id,sport,started_at,strain,hr_zones")
      .in("source", ["garmin", "manual"]),
    db.from("activities").select("id,sport,started_at,strain,hr_zones").eq("source", "whoop"),
  ]);

  const prim = (primaries ?? []) as Row[];
  const wh = (whoops ?? []) as Row[];

  const usedPrimary = new Set<string>();
  const toDelete: string[] = [];
  const updates: Array<{ id: string; strain?: number; hr_zones?: Record<string, number> }> = [];

  for (const w of wh) {
    const wt = new Date(w.started_at).getTime();
    const match = prim.find(
      (p) =>
        !usedPrimary.has(p.id) &&
        p.sport === w.sport &&
        Math.abs(new Date(p.started_at).getTime() - wt) <= MATCH_WINDOW_MS,
    );
    if (!match) continue;
    usedPrimary.add(match.id);
    toDelete.push(w.id);
    // Copiamos de Whoop lo que Garmin no tiene: strain y zonas de FC.
    const patch: { id: string; strain?: number; hr_zones?: Record<string, number> } = { id: match.id };
    if (w.strain != null && match.strain == null) patch.strain = w.strain;
    if (w.hr_zones != null && match.hr_zones == null) patch.hr_zones = w.hr_zones;
    if (patch.strain != null || patch.hr_zones != null) updates.push(patch);
  }

  const strainUpdates = updates; // (compat de nombre de retorno)
  for (const u of updates) {
    const { id, ...fields } = u;
    await db.from("activities").update(fields).eq("id", id);
  }
  if (toDelete.length) {
    await db.from("activities").delete().in("id", toDelete);
  }

  return { merged: toDelete.length, strainCopied: strainUpdates.length };
}
