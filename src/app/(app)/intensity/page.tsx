import { Card, CardContent } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { SetupNotice, EmptyState } from "@/components/ui/setup-notice";
import { isConfigured, getActivities } from "@/lib/data";

export const dynamic = "force-dynamic";

const DAYS = 28;

export default async function IntensityPage() {
  if (!isConfigured()) {
    return (
      <Page>
        <SetupNotice title="Falta configurar el entorno" body="Configurá Supabase para ver la intensidad." />
      </Page>
    );
  }

  const activities = await getActivities(500);
  const since = new Date(Date.now() - DAYS * 86_400_000).toISOString();
  const recent = activities.filter((a) => a.started_at >= since && a.hr_zones);

  let easy = 0, mod = 0, hard = 0;
  for (const a of recent) {
    const z = a.hr_zones as Record<string, number>;
    easy += (Number(z.zone_1_ms) || 0) + (Number(z.zone_2_ms) || 0);
    mod += Number(z.zone_3_ms) || 0;
    hard += (Number(z.zone_4_ms) || 0) + (Number(z.zone_5_ms) || 0);
  }
  const total = easy + mod + hard;

  if (total === 0) {
    return (
      <Page>
        <EmptyState>Sin datos de zonas de FC en los últimos {DAYS} días.</EmptyState>
      </Page>
    );
  }

  const pEasy = Math.round((easy / total) * 100);
  const pMod = Math.round((mod / total) * 100);
  const pHard = 100 - pEasy - pMod;

  // 80/20: idealmente ~80% fácil, ~20% moderado+fuerte
  const hardShare = pMod + pHard;
  const assessment =
    pEasy >= 75
      ? { label: "Bien polarizado", advice: "Buena base aeróbica: la mayoría del volumen es fácil. Seguí así.", color: "text-primary" }
      : pEasy >= 60
        ? { label: "Zona gris", advice: "Estás corriendo demasiado 'moderado'. Hacé lo fácil más fácil y lo fuerte más fuerte.", color: "text-yellow-400" }
        : { label: "Demasiada intensidad", advice: "Mucho tiempo en zonas altas: riesgo de fatiga. Sumá más volumen fácil (Z1-Z2).", color: "text-red-400" };

  const fmtH = (ms: number) => `${(ms / 3600000).toFixed(1)} h`;

  return (
    <Page>
      <div className="mb-6 grid grid-cols-3 gap-4">
        <Stat label="Fácil (Z1-Z2)" value={`${pEasy}%`} hint={fmtH(easy)} className="text-primary" />
        <Stat label="Moderado (Z3)" value={`${pMod}%`} hint={fmtH(mod)} className="text-yellow-400" />
        <Stat label="Fuerte (Z4-Z5)" value={`${pHard}%`} hint={fmtH(hard)} className="text-red-400" />
      </div>

      <Card className="mb-6">
        <CardContent className="py-5">
          <div className="mb-3 flex h-4 w-full overflow-hidden rounded-full">
            <div style={{ width: `${pEasy}%`, backgroundColor: "#2ba86a" }} />
            <div style={{ width: `${pMod}%`, backgroundColor: "#eab308" }} />
            <div style={{ width: `${pHard}%`, backgroundColor: "#e0555f" }} />
          </div>
          <p className="text-sm">
            <span className={`font-medium ${assessment.color}`}>{assessment.label}.</span>{" "}
            <span className="text-muted-foreground">{assessment.advice}</span>
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Referencia polarizada: ~80% fácil / ~20% moderado+fuerte. Vos: {pEasy}% / {hardShare}%. Últimos {DAYS} días · {recent.length} sesiones con FC.
          </p>
        </CardContent>
      </Card>
    </Page>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Intensidad</h1>
        <p className="text-sm text-muted-foreground">Distribución por zonas de FC y chequeo de entrenamiento polarizado (80/20).</p>
      </header>
      {children}
    </>
  );
}
