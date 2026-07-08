import Link from "next/link";
import { Activity } from "lucide-react";
import { Nav, NavMobile } from "@/components/nav";
import { SyncStatusPanel, SyncStatusInline } from "@/components/sync-status";
import { AutoSync } from "@/components/auto-sync";
import { isWhoopConnected, getSyncStatus } from "@/lib/data";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [connected, status] = await Promise.all([
    isWhoopConnected(),
    getSyncStatus(),
  ]);
  const today = new Date().toISOString().slice(0, 10);
  // Datos "viejos" si no hay recovery de hoy todavía (Whoop lo calcula al despertar).
  const stale = connected && status.whoopLast !== today;
  return (
    <div className="flex min-h-screen">
      {stale && <AutoSync stale={stale} />}
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card/40 p-4 md:flex">
        <Link href="/overview" className="mb-6 flex items-center gap-2 px-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Activity className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">TrainerIA</span>
        </Link>
        <Nav />
        <div className="mt-auto pt-4">
          {connected ? (
            <SyncStatusPanel status={status} />
          ) : (
            <Link
              href="/api/whoop/auth"
              className="inline-flex w-full items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Conectar Whoop
            </Link>
          )}
        </div>
      </aside>

      {/* Contenido */}
      <div className="min-w-0 flex-1">
        {/* Barra mobile (sticky para tener el nav siempre a mano) */}
        <div className="sticky top-0 z-20 border-b border-border bg-background/95 px-4 py-3 backdrop-blur md:hidden">
          <div className="mb-2 flex items-center justify-between">
            <Link href="/overview" className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-primary">
                <Activity className="h-4 w-4" />
              </span>
              <span className="font-semibold">TrainerIA</span>
            </Link>
            {connected && <SyncStatusInline status={status} />}
          </div>
          <NavMobile />
        </div>
        <main className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
