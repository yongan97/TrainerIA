"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function SyncButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [loading, setLoading] = useState(false);
  const busy = pending || loading;

  async function onClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/whoop/sync", { method: "POST" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "sync falló");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    } finally {
      setLoading(false);
      start(() => router.refresh());
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={cn(
        "inline-flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-sm font-medium",
        "hover:bg-accent transition-colors disabled:opacity-50",
      )}
    >
      <RefreshCw className={cn("h-4 w-4", busy && "animate-spin")} />
      {busy ? "Sincronizando…" : "Sincronizar Whoop"}
    </button>
  );
}
