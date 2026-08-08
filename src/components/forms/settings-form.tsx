"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Settings } from "@/lib/domain/types";

const field = "w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

export function SettingsForm({ initial }: { initial: Settings | null }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(fd)),
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error);
      setMsg("Guardado.");
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "error");
    } finally {
      setSaving(false);
    }
  }

  const F = ({ name, label, unit, def, type = "number" }: { name: string; label: string; unit?: string; def: string | number | null; type?: string }) => (
    <label className="text-sm">
      <span className="mb-1 block text-muted-foreground">{label}{unit ? ` (${unit})` : ""}</span>
      <input name={name} type={type} defaultValue={def ?? ""} className={field} />
    </label>
  );

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-medium">Zonas y potencia</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <F name="ftp" label="FTP" unit="W" def={initial?.ftp ?? null} />
          <F name="lthr" label="FC umbral (LTHR)" unit="bpm" def={initial?.lthr ?? null} />
          <F name="hr_max" label="FC máxima" unit="bpm" def={initial?.hr_max ?? null} />
          <F name="hr_rest" label="FC reposo" unit="bpm" def={initial?.hr_rest ?? null} />
          <F name="weight_kg" label="Peso" unit="kg" def={initial?.weight_kg ?? null} />
        </div>
      </div>
      <div>
        <h3 className="mb-3 text-sm font-medium">Carrera objetivo</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <F name="goal_name" label="Nombre" def={initial?.goal_name ?? null} type="text" />
          <F name="goal_date" label="Fecha" def={initial?.goal_date ?? null} type="date" />
          <F name="goal_distance_km" label="Distancia" unit="km" def={initial?.goal_distance_km ?? null} />
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Deporte</span>
            <select name="goal_sport" defaultValue={initial?.goal_sport ?? "bike"} className={field}>
              <option value="bike">Ciclismo</option>
              <option value="run">Running</option>
            </select>
          </label>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
          {saving ? "Guardando…" : "Guardar"}
        </button>
        {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
      </div>
    </form>
  );
}
