import { useEffect, useState } from "react";
import { CircleAlert, ArrowUpRight, Newspaper } from "lucide-react";
import { Link } from "wouter";
import { usePanics, type PanicEvent } from "@/hooks/usePanics";

const ROTATE_MS = 8000;

interface Headline {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
}

type WireItem =
  | { kind: "panic"; panic: PanicEvent }
  | { kind: "news"; headline: Headline };

function timeAgo(ts: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// Live news ticker: rotates through on-chain panic broadcasts interleaved
// with external market headlines. Progress bar shows time until the next
// item; hovering pauses the rotation. Hidden when both feeds are empty.
export default function PanicBanner() {
  const { panics } = usePanics();
  const [headlines, setHeadlines] = useState<Headline[]>([]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/news");
        const data = await res.json();
        if (!cancelled) setHeadlines(data.headlines ?? []);
      } catch {
        // headlines unavailable — panics still rotate
      }
    }
    load();
    const interval = window.setInterval(load, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const items: WireItem[] = [];
  const n = Math.max(panics.length, headlines.length);
  for (let i = 0; i < n; i++) {
    if (i < panics.length) items.push({ kind: "panic", panic: panics[i] });
    if (i < headlines.length) items.push({ kind: "news", headline: headlines[i] });
  }

  useEffect(() => {
    if (items.length <= 1 || paused) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % items.length), ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [items.length, paused]);

  if (items.length === 0) return null;
  const pos = index % items.length;
  const item = items[pos];

  return (
    <div
      className="panic-banner panic-wire"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {item.kind === "panic" ? <CircleAlert size={14} /> : <Newspaper size={14} />}
      {item.kind === "panic" ? (
        <span key={item.panic.id + pos} className="panic-wire-item">
          <strong>PANIC BROADCAST</strong> {item.panic.trigger.replace(/_/g, " ").toLowerCase()} signal
          detected across {item.panic.affectedSymbols.length} mints
          <em className="panic-wire-time"> · {timeAgo(item.panic.timestamp)}</em>
        </span>
      ) : (
        <span key={item.headline.url + pos} className="panic-wire-item">
          <strong>{item.headline.source.toUpperCase()}</strong> {item.headline.title}
        </span>
      )}
      {item.kind === "panic" ? (
        <Link href="/panics">
          Inspect event <ArrowUpRight size={13} />
        </Link>
      ) : (
        <a href={item.headline.url} target="_blank" rel="noopener noreferrer">
          Read <ArrowUpRight size={13} />
        </a>
      )}
      {items.length > 1 && !paused && (
        <span key={"bar" + pos} className="panic-wire-progress" />
      )}
    </div>
  );
}
