import { NextRequest, NextResponse } from "next/server";
import { fetchGarminSplits } from "@/lib/garmin/connect";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Devuelve los splits por vuelta de una actividad de Garmin. */
export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "falta id" }, { status: 400 });
  const splits = await fetchGarminSplits(id);
  return NextResponse.json({ ok: true, splits });
}
