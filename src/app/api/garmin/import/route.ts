import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { parseTcx } from "@/lib/garmin/tcx";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Import de entrenos de Garmin. Acepta uno o más archivos .tcx en multipart.
 * Detecta el deporte y hace upsert idempotente en `activities` por external_id.
 * .fit (binario) todavía no: exportar como .tcx desde Garmin Connect.
 */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const files = form.getAll("files").filter((f): f is File => f instanceof File);
    if (files.length === 0) {
      return NextResponse.json({ error: "no se subieron archivos" }, { status: 400 });
    }

    const db = getAdminClient();
    const results: Array<{ name: string; sport?: string; ok: boolean; error?: string }> = [];

    for (const file of files) {
      try {
        if (file.name.toLowerCase().endsWith(".fit")) {
          results.push({
            name: file.name,
            ok: false,
            error: "FIT aún no soportado — exportá como TCX.",
          });
          continue;
        }
        const text = await file.text();
        const parsed = parseTcx(text);
        const { error } = await db
          .from("activities")
          .upsert(parsed, { onConflict: "external_id" });
        if (error) throw new Error(error.message);
        results.push({ name: file.name, sport: parsed.sport, ok: true });
      } catch (e) {
        results.push({
          name: file.name,
          ok: false,
          error: e instanceof Error ? e.message : "error",
        });
      }
    }

    return NextResponse.json({ ok: true, results });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "error" },
      { status: 500 },
    );
  }
}
