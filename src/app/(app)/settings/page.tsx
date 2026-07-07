import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SetupNotice } from "@/components/ui/setup-notice";
import { SettingsForm } from "@/components/forms/settings-form";
import { isConfigured, getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  if (!isConfigured()) {
    return (
      <Page>
        <SetupNotice title="Falta configurar el entorno" body="Configurá Supabase primero." />
      </Page>
    );
  }
  const settings = await getSettings();
  return (
    <Page>
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Tus datos</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsForm initial={settings} />
        </CardContent>
      </Card>
      <p className="mt-4 text-xs text-muted-foreground">
        El FTP habilita métricas por potencia (IF, TSS) en la bici. La FC umbral y máxima afinan las zonas. La carrera objetivo muestra la cuenta regresiva en el inicio.
      </p>
    </Page>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>
        <p className="text-sm text-muted-foreground">Zonas, FTP y carrera objetivo.</p>
      </header>
      {children}
    </>
  );
}
