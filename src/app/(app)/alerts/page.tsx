import { AlertTriangle, ShieldAlert, Info, CheckCircle2 } from "lucide-react";
import { SetupNotice } from "@/components/ui/setup-notice";
import { isConfigured, getRecovery, getCycles, getSleep, getRehabLogs, getPlanned, getActivities } from "@/lib/data";
import { computeInsights, type Insight, type InsightLevel } from "@/lib/insights";

export const dynamic = "force-dynamic";

const STYLE: Record<InsightLevel, { ring: string; text: string; icon: typeof Info }> = {
  alert: { ring: "ring-red-400/40 bg-red-400/5", text: "text-red-300", icon: ShieldAlert },
  warn: { ring: "ring-yellow-400/40 bg-yellow-400/5", text: "text-yellow-300", icon: AlertTriangle },
  info: { ring: "ring-sky-400/40 bg-sky-400/5", text: "text-sky-300", icon: Info },
  good: { ring: "ring-primary/40 bg-primary/5", text: "text-primary", icon: CheckCircle2 },
};

export default async function AlertsPage() {
  if (!isConfigured()) {
    return (
      <Page>
        <SetupNotice title="Falta configurar el entorno" body="Configurá Supabase para ver alertas." />
      </Page>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const since14 = new Date(Date.now() - 14 * 86_400_000).toISOString().slice(0, 10);
  const since7 = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);
  const [recovery, cycles, sleep, rehab, planned, activities] = await Promise.all([
    getRecovery(30), getCycles(30), getSleep(7), getRehabLogs(14), getPlanned(200), getActivities(300),
  ]);

  const strainsDesc = cycles.map((c) => c.day_strain ?? 0);
  const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
  const acute = mean(strainsDesc.slice(0, 7));
  const chronic = mean(strainsDesc.slice(0, 28));
  const acwr = acute != null && chronic != null && chronic > 0 ? acute / chronic : null;

  const pastPlanned = planned.filter((p) => p.date >= since14 && p.date <= today);
  const done = pastPlanned.filter((p) => activities.some((a) => a.started_at.slice(0, 10) === p.date && a.sport === p.sport)).length;
  const adherencePct = pastPlanned.length ? Math.round((done / pastPlanned.length) * 100) : null;

  const insights = computeInsights({
    recovery,
    cycles,
    sleepHours7: sleep.map((s) => (s.duration_s ?? 0) / 3600).filter((h) => h > 0),
    kneePainRecent: rehab.filter((r) => r.date >= since7 && r.knee_pain != null).map((r) => r.knee_pain as number),
    acwr,
    adherencePct,
  });

  return (
    <Page>
      <div className="space-y-3">
        {insights.map((ins: Insight, i) => {
          const s = STYLE[ins.level];
          const Icon = s.icon;
          return (
            <div key={i} className={`flex items-start gap-3 rounded-xl border border-border p-4 ring-1 ${s.ring}`}>
              <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-card ${s.text}`}>
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <div className={`text-sm font-semibold ${s.text}`}>{ins.title}</div>
                <p className="mt-0.5 text-sm text-muted-foreground">{ins.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Page>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Alertas</h1>
        <p className="text-sm text-muted-foreground">Qué necesita atención: fatiga, carga, sueño y salud.</p>
      </header>
      {children}
    </>
  );
}
