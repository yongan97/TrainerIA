"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

/**
 * Botón de actualización manual: dispara el mismo pipeline de sync
 * (Whoop + Garmin + reconciliación) y refresca la vista al terminar.
 * `variant="icon"` para la barra mobile compacta; `"full"` para el panel.
 */
export function SyncButton({ variant = "full" }: { variant?: "full" | "icon" }) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);

  async function run() {
    if (syncing) return;
    setSyncing(true);
    try {
      await fetch("/api/sync", { method: "POST" });
      router.refresh();
    } catch {
      // Silencioso: el semáforo de frescura ya refleja el estado real.
    } finally {
      setSyncing(false);
    }
  }

  if (variant === "icon") {
    return (
      <button
        onClick={run}
        disabled={syncing}
        aria-label="Actualizar datos"
        title="Actualizar"
        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
      >
        <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
      </button>
    );
  }

  return (
    <button
      onClick={run}
      disabled={syncing}
      className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
      {syncing ? "Actualizando…" : "Actualizar ahora"}
    </button>
  );
}
