"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";

export function GarminImport() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<
    Array<{ name: string; sport?: string; ok: boolean; error?: string }>
  >([]);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setResults([]);
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("files", f));
    try {
      const res = await fetch("/api/garmin/import", { method: "POST", body: fd });
      const json = await res.json();
      setResults(json.results ?? [{ name: "?", ok: false, error: json.error }]);
      router.refresh();
    } catch (e) {
      setResults([{ name: "?", ok: false, error: String(e) }]);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <button
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
      >
        <Upload className="h-4 w-4" />
        {busy ? "Importando…" : "Importar .tcx de Garmin"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".tcx,.fit"
        multiple
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />
      {results.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs">
          {results.map((r, i) => (
            <li key={i} className={r.ok ? "text-primary" : "text-red-400"}>
              {r.ok ? `✓ ${r.name} (${r.sport})` : `✗ ${r.name}: ${r.error}`}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
