"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Programa de fuerza glúteo/cadera + drills.
const DRILLS = [
  { key: "puente_gluteo", label: "Puente de glúteo" },
  { key: "abduccion_cadera", label: "Abducción de cadera" },
  { key: "sentadilla_monopodal", label: "Sentadilla monopodal" },
  { key: "clamshell", label: "Clamshell" },
  { key: "peso_muerto_rumano", label: "Peso muerto rumano" },
  { key: "movilidad_cadera", label: "Movilidad de cadera" },
];

const field =
  "w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

export function RehabForm({ today }: { today: string }) {
  const router = useRouter();
  const [pain, setPain] = useState(0);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/rehab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: fd.get("date"),
          knee_pain: pain,
          drills_done: done,
          notes: fd.get("notes") || null,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      setMsg("Guardado.");
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">Fecha</span>
        <input type="date" name="date" defaultValue={today} className={field} required />
      </label>

      <div className="text-sm">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-muted-foreground">Molestia de cuádriceps (der.)</span>
          <span className="font-medium tabular-nums">{pain}/10</span>
        </div>
        <input
          type="range"
          min={0}
          max={10}
          value={pain}
          onChange={(e) => setPain(Number(e.target.value))}
          className="w-full accent-primary"
        />
      </div>

      <fieldset className="text-sm">
        <legend className="mb-2 text-muted-foreground">Drills de hoy</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {DRILLS.map((d) => (
            <label
              key={d.key}
              className="flex items-center gap-2 rounded-md border border-border px-3 py-2"
            >
              <input
                type="checkbox"
                checked={!!done[d.key]}
                onChange={(e) =>
                  setDone((prev) => ({ ...prev, [d.key]: e.target.checked }))
                }
                className="accent-primary"
              />
              {d.label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">Notas</span>
        <input name="notes" className={field} />
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Guardar día"}
        </button>
        {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
      </div>
    </form>
  );
}
