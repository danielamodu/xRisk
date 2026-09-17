import { useEffect, useState } from "react";

export interface PanicEvent {
  id: string;
  timestamp: number;
  isoTime: string;
  affectedMints: string[];
  affectedSymbols: string[];
  trigger: string;
  severity: number;
  txSignature: string;
}

const REFRESH_MS = 15_000;

export function usePanics() {
  const [panics, setPanics] = useState<PanicEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/panics");
        const data = await res.json();
        if (!cancelled) setPanics(data.panics ?? []);
      } catch {
        // keep previous panics on transient failure
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const interval = window.setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  return { panics, loading };
}
