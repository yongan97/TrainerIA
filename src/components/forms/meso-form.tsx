"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { SPORT_IDS, SPORTS } from "@/lib/sports/registry";

const field = "rounded-md border border-input bg-secondary px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring";
const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

interface Row {
  sport: string;
  weekday: number;
  type: string;
  progression: string;
  unit: string;
}
const emptyRow = (): Row => ({ sport: "run", weekday: 1, type: "", progression: "", unit: "km" });

export function MesoForm() {
  const router = useRouter();
  const [meso, setMeso] = useState("");
  const [start, setStart] = useState("");
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function update(i: number, patch: Partial<Row>) {
    setRows((r) => r.map((row, j) => (j === i ? { ...row, ...patch } : row)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const sessions = rows.map((r) => ({
        sport: r.sport,
        weekday: r.weekday,
        type: r.type,
        unit: r.unit,
        values: r.progression.split(/[,.]+/).map((v) => v.trim()).filter(Boolean),
      }));
      const res = await fetch("/api/planned/meso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meso, start, sessions }),
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error);
      setMsg(`✓ ${j.created} sesiones generadas`);
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">Nombre del meso</span>
          <input value={meso} onChange={(e) => setMeso(e.target.value)} placeholder="John Meso 6" className={`${field} w-full`} required />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">Inicio (semana 1)</span>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={`${field} w-full`} required />
        </label>
      </div>

      <div className="space-y-2">
        <div className="hidden gap-2 px-1 text-[10px] uppercase text-muted-foreground/60 sm:grid sm:grid-cols-[1fr_1fr_1.2fr_1.6fr_0.8fr_auto]">
          <span>Deporte</span><span>Día</span><span>Tipo</span><span>Progresión (por semana)</span><span>Unidad</span><span />
        </div>
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_1.2fr_1.6fr_0.8fr_auto]">
            <select value={r.sport} onChange={(e) => update(i, { sport: e.target.value })} className={field}>
              {SPORT_IDS.map((s) => <option key={s} value={s}>{SPORTS[s].label}</option>)}
            </select>
            <select value={r.weekday} onChange={(e) => update(i, { weekday: Number(e.target.value) })} className={field}>
              {DAYS.map((d, j) => <option key={j} value={j}>{d}</option>)}
            </select>
            <input value={r.type} onChange={(e) => update(i, { type: e.target.value })} placeholder="T2" className={field} />
            <input value={r.progression} onChange={(e) => update(i, { progression: e.target.value })} placeholder="8, 9, 10" className={field} />
            <input value={r.unit} onChange={(e) => update(i, { unit: e.target.value })} placeholder="km" className={field} />
            <button type="button" onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))} className="flex items-center justify-center rounded-md border border-border px-2 text-muted-foreground hover:text-red-400">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => setRows((r) => [...r, emptyRow()])} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
          <Plus className="h-3.5 w-3.5" /> Agregar sesión
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
          {saving ? "Generando…" : "Generar mesociclo"}
        </button>
        {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
      </div>
      <p className="text-xs text-muted-foreground">
        Ej: progresión “8, 9, 10” con unidad “km” = 3 semanas (8 km, 9 km, 10 km) en el día elegido. Podés usá comas o puntos suspensivos.
      </p>
    </form>
  );
}
