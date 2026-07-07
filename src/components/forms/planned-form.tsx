"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SPORT_IDS, SPORTS } from "@/lib/sports/registry";

const field =
  "w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

export function PlannedForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      sport: fd.get("sport"),
      date: fd.get("date"),
      type: fd.get("type"),
      target_minutes: fd.get("target_minutes") || null,
      targets: { notas: fd.get("targets") || null },
      rehab_notes: fd.get("rehab_notes") || null,
    };
    try {
      const res = await fetch("/api/planned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      (e.target as HTMLFormElement).reset();
      setMsg("Sesión cargada.");
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm">
        <span className="mb-1 block text-muted-foreground">Deporte</span>
        <select name="sport" className={field} defaultValue="bike" required>
          {SPORT_IDS.map((s) => (
            <option key={s} value={s}>
              {SPORTS[s].label}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-muted-foreground">Fecha</span>
        <input type="date" name="date" className={field} required />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-muted-foreground">Tipo de sesión</span>
        <input
          name="type"
          placeholder="Ej: Series Z4, Fondo, Rehab"
          className={field}
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-muted-foreground">Duración objetivo (min)</span>
        <input type="number" name="target_minutes" min={0} className={field} />
      </label>
      <label className="text-sm sm:col-span-2">
        <span className="mb-1 block text-muted-foreground">
          Objetivos (zonas / pace / potencia)
        </span>
        <input
          name="targets"
          placeholder="Ej: 4x5' @ 280W / Z4, rec 3'"
          className={field}
        />
      </label>
      <label className="text-sm sm:col-span-2">
        <span className="mb-1 block text-muted-foreground">Notas de rehab</span>
        <input name="rehab_notes" className={field} />
      </label>
      <div className="flex items-center gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Agregar sesión"}
        </button>
        {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
      </div>
    </form>
  );
}
