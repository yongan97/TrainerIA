"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

const KEY = "traineria:lastAutoSync";
const MIN_INTERVAL_MS = 30 * 60 * 1000; // no más de 1 auto-sync cada 30 min

/**
 * Al abrir la app: si los datos están viejos (stale) y no sincronizamos hace
 * poco, dispara un sync en segundo plano y refresca. Así al despertarte y abrir,
 * ya se actualiza solo.
 */
export function AutoSync({ stale }: { stale: boolean }) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!stale) return;
    const last = Number(localStorage.getItem(KEY) ?? 0);
    if (Date.now() - last < MIN_INTERVAL_MS) return;
    localStorage.setItem(KEY, String(Date.now()));

    let alive = true;
    setSyncing(true);
    fetch("/api/sync", { method: "POST" })
      .then((r) => r.json())
      .then(() => { if (alive) router.refresh(); })
      .catch(() => {})
      .finally(() => { if (alive) setSyncing(false); });
    return () => { alive = false; };
  }, [stale, router]);

  if (!syncing) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-lg">
      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
      Actualizando datos…
    </div>
  );
}
