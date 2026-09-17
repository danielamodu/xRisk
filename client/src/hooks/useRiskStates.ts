import { useEffect, useState } from "react";
import { getAllRiskStates, type RiskStateData } from "@/lib/xrisk";

const REFRESH_MS = 30_000;

export function useRiskStates() {
  const [states, setStates] = useState<RiskStateData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getAllRiskStates();
        if (!cancelled) setStates(data);
      } catch {
        // keep previous states on transient failure
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

  return { states, loading };
}
