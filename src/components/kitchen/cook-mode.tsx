"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Cookable } from "@/lib/kitchen/types";
import { formatQty } from "@/lib/kitchen/week";
import { cn } from "@/lib/utils";

export function CookMode({ item, backHref }: { item: Cookable; backHref: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [showIng, setShowIng] = useState(false);
  const current = item.steps[step];
  const last = step === item.steps.length - 1;

  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    navigator.wakeLock?.request("screen").then((l) => {
      if (cancelled) l.release();
      else lock = l;
    }).catch(() => {});
    return () => {
      cancelled = true;
      lock?.release();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background text-foreground">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Link href={backHref} className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl bg-secondary" aria-label="Salir">
          <X className="h-6 w-6" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold">{item.title}</p>
          <p className="text-sm text-muted-foreground">
            Paso {step + 1} de {item.steps.length} · {item.minutes} min
          </p>
        </div>
        <button
          onClick={() => setShowIng((v) => !v)}
          className="min-h-12 rounded-xl bg-secondary px-4 text-base font-medium"
        >
          {showIng ? "Paso" : "Ingredientes"}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-10">
        {showIng ? (
          <ul className="mx-auto max-w-2xl space-y-3">
            {item.ingredients.map((ing, i) => (
              <li key={i} className="flex min-h-12 items-center justify-between gap-4 border-b border-border text-xl">
                <span>{ing.name}</span>
                <span className="tabular-nums text-muted-foreground">{formatQty(ing.qty, ing.unit)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-8">
            <p className="text-3xl font-semibold leading-snug tracking-tight sm:text-5xl">{current.text}</p>
            {current.seconds ? (
              <StepTimer key={`${step}-${current.seconds}`} seconds={current.seconds} label={current.timerLabel} />
            ) : null}
          </div>
        )}
      </div>

      <footer className="grid grid-cols-2 gap-3 border-t border-border p-4 sm:px-10">
        <button
          onClick={() => { setStep((s) => Math.max(0, s - 1)); setShowIng(false); }}
          disabled={step === 0}
          className="inline-flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-secondary text-xl font-semibold disabled:opacity-40"
        >
          <ChevronLeft className="h-7 w-7" />
          Atrás
        </button>
        <button
          onClick={() => {
            if (last) {
              router.push(backHref);
              return;
            }
            setStep((s) => Math.min(item.steps.length - 1, s + 1));
            setShowIng(false);
          }}
          className={cn(
            "inline-flex min-h-16 items-center justify-center gap-2 rounded-2xl text-xl font-semibold",
            last ? "bg-primary/20 text-primary" : "bg-primary text-primary-foreground",
          )}
        >
          {last ? "Listo" : "Siguiente"}
          {!last && <ChevronRight className="h-7 w-7" />}
        </button>
      </footer>
    </div>
  );
}

function StepTimer({ seconds, label }: { seconds: number; label?: string }) {
  const [left, setLeft] = useState(seconds);
  const [run, setRun] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!run) return;
    const id = window.setInterval(() => setLeft((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [run]);

  useEffect(() => {
    if (run && left <= 0) {
      setRun(false);
      setDone(true);
      beep();
    }
  }, [left, run]);

  const show = Math.max(0, left);
  const mm = String(Math.floor(show / 60)).padStart(2, "0");
  const ss = String(show % 60).padStart(2, "0");

  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <p className="text-sm uppercase tracking-wide text-muted-foreground">{label ?? "Timer"}</p>
      <p className={cn("mt-1 font-semibold tabular-nums tracking-tight", done ? "text-5xl text-primary" : "text-7xl")}>
        {done ? "Tiempo" : `${mm}:${ss}`}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={() => { if (left <= 0) { setLeft(seconds); setDone(false); } setRun((r) => !r); }}
          className="min-h-16 min-w-40 rounded-2xl bg-primary px-6 text-xl font-semibold text-primary-foreground"
        >
          {run ? "Pausa" : done ? "Otra vez" : "Arrancar"}
        </button>
        <button
          onClick={() => { setRun(false); setDone(false); setLeft(seconds); }}
          className="min-h-16 rounded-2xl bg-secondary px-6 text-xl font-semibold"
        >
          Reiniciar
        </button>
      </div>
    </div>
  );
}

function beep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch {
    // sin audio, el número en verde alcanza
  }
}
