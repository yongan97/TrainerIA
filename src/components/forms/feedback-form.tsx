"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const FEELS = [
  { key: "genial", label: "😄 Genial" },
  { key: "bien", label: "🙂 Bien" },
  { key: "normal", label: "😐 Normal" },
  { key: "cansado", label: "😓 Cansado" },
  { key: "mal", label: "😣 Mal" },
];

const field = "w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

export function FeedbackForm({
  activityId,
  initialRpe,
  initialFeel,
  initialNotes,
}: {
  activityId: string;
  initialRpe: number | null;
  initialFeel: string | null;
  initialNotes: string | null;
}) {
  const router = useRouter();
  const [rpe, setRpe] = useState(initialRpe ?? 5);
  const [feel, setFeel] = useState(initialFeel ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/activities/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: activityId, rpe, feel, notes: fd.get("notes") }),
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

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Esfuerzo percibido (RPE)</span>
          <span className="font-medium tabular-nums">{rpe}/10</span>
        </div>
        <input type="range" min={1} max={10} value={rpe} onChange={(e) => setRpe(Number(e.target.value))} className="w-full accent-primary" />
      </div>
      <div>
        <span className="mb-2 block text-sm text-muted-foreground">¿Cómo te sentiste?</span>
        <div className="flex flex-wrap gap-2">
          {FEELS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFeel(f.key)}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${feel === f.key ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:bg-secondary"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">Notas</span>
        <input name="notes" defaultValue={initialNotes ?? ""} placeholder="Piernas pesadas, buen clima…" className={field} />
      </label>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
          {saving ? "Guardando…" : "Guardar sensaciones"}
        </button>
        {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
      </div>
    </form>
  );
}
