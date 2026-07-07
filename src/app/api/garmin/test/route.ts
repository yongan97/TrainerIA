import { NextResponse } from "next/server";
import { testGarminLogin } from "@/lib/garmin/connect";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Prueba el login de Garmin en el server (sin bajar datos). */
export async function GET() {
  const result = await testGarminLogin();
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
