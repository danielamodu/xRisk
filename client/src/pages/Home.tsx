import { useEffect, useState } from "react";
import { Activity, ArrowDownRight, ArrowUpRight, Bell, ChevronRight, CircleAlert, Clock3, ExternalLink, Menu, RefreshCw, ShieldAlert, Wifi, X } from "lucide-react";
import { Link } from "wouter";
import { Confidence, dashboardStats, riskEvents } from "@/lib/riskData";
import { useRiskStates } from "@/hooks/useRiskStates";
import { usePanics } from "@/hooks/usePanics";
import {
  computeAdjustedLTV,
  computeProtectedExposure,
  formatStaleness,
  type RiskStateData,
} from "@/lib/xrisk";
import AppFooter from "@/components/AppFooter";
import PanicBanner from "@/components/PanicBanner";
import RequireWallet from "@/components/RequireWallet";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

function LogoMark() { return <span className="app-logo-mark" aria-hidden="true"><i /><i /><i /></span>; }
function ConfidenceBadge({ value }: { value: string }) { return <span className={`confidence confidence-${value.toLowerCase()}`}><i />{value}</span>; }
function Score({ value }: { value: number }) { return <span className={`score score-${value > 75 ? "danger" : value > 50 ? "watch" : "safe"}`}>{value}</span>; }
type PanelState = "loading" | "ready" | "error";
function usePanelState(delay: number) { const [state, setState] = useState<PanelState>("loading"); useEffect(() => { const timer = window.setTimeout(() => setState("ready"), delay); return () => window.clearTimeout(timer); }, [delay]); return { state, retry: () => { setState("loading"); window.setTimeout(() => setState("ready"), 600); } }; }
function PanelError({ onRetry }: { onRetry: () => void }) { return <div className="panel-state panel-error"><CircleAlert size={17} /><strong>Unable to load panel</strong><p>Data is temporarily unavailable.</p><button onClick={onRetry}>Retry <RefreshCw size={12} /></button></div>; }
function TableSkeleton() { return <div className="skeleton-list">{Array.from({ length: 6 }).map((_, index) => <div className="skeleton-row" key={index}><i className="skeleton-avatar" /><span><i /><i /></span><i /><i /><i /><i /></div>)}</div>; }
function EventSkeleton() { return <div className="skeleton-list event-skeleton">{Array.from({ length: 7 }).map((_, index) => <div className="skeleton-event" key={index}><i /><span><i /><i /></span><i /><i /></div>)}</div>; }
function SimulatorSkeleton() { return <div className="simulator-skeleton"><i /><i /><div><i /><i /></div><div><i /><i /></div><i /></div>; }

function RiskGrid() {
  const { states, loading } = useRiskStates(); return <section className="dash-card risk-grid-card"><div className="dash-card-header"><div><span className="app-kicker">01 / RISK GRID</span><h2>Tracked mints</h2></div><span className="refresh-note"><RefreshCw size={12} /> 30s refresh</span></div>{loading ? <TableSkeleton /> : <><div className="risk-table-head"><span>Asset</span><span>Score</span><span>Confidence</span><span>Market</span><span>Implied move</span><span>Oracle age</span></div><div className="risk-rows">{states.map((mint: RiskStateData) => <Link href={`/mint/${mint.symbol}`} className={`risk-row ${mint.score > 75 ? "risk-row-alert" : ""}`} key={mint.symbol}><div className="asset-cell"><span className="asset-avatar">{mint.symbol.slice(0, 1)}</span><span><strong>{mint.symbol}</strong><small>{mint.name}</small></span></div><Score value={mint.score} /><ConfidenceBadge value={mint.confidence.toUpperCase()} /><span className={`market-status status-${mint.marketStatus.toLowerCase()}`}><i />{mint.marketStatus.toUpperCase()}</span><span className="band-value">{(mint.impliedMoveLowBps / 100).toFixed(1)}% to +{(mint.impliedMoveHighBps / 100).toFixed(1)}%</span><span className={`oracle-age ${mint.chainlinkStalenessSecs > 3600 ? "oracle-stale" : ""}`}><Clock3 size={12} />{formatStaleness(mint.chainlinkStalenessSecs)}</span><ChevronRight className="row-arrow" size={15} /></Link>)}</div></>}</section>;
}

function EventStream() {
  const panel = usePanelState(850); return <section className="dash-card event-card"><div className="dash-card-header"><div><span className="app-kicker">02 / LIVE EVENT STREAM</span><h2>RiskEvents</h2></div><span className="stream-live"><i /> LIVE</span></div>{panel.state === "loading" ? <EventSkeleton /> : panel.state === "error" ? <PanelError onRetry={panel.retry} /> : <><div className="event-list">{riskEvents.map((event) => <div className="event-row" key={event.id}><div className="event-time">{event.timestamp}<small>{event.kind}</small></div><div className="event-main"><strong>{event.symbol}</strong><span>Transfer of <b>{event.amount}</b></span></div><div className="event-score"><Score value={event.score} /><ConfidenceBadge value={event.confidence} /></div>{event.score > 85 && <CircleAlert className="event-flag" size={15} />}</div>)}</div><Link href="/panics" className="card-link">View panic history <ArrowUpRight size={14} /></Link></>}</section>;
}

function Simulator() {
  const { states, loading } = useRiskStates();
  const aapl = states.find((s) => s.symbol === "AAPLx");
  const liveScore = aapl?.score;
  const [ltv, setLtv] = useState(75);
  useEffect(() => {
    if (liveScore !== undefined) setLtv(Math.round(computeAdjustedLTV(liveScore) * 1000) / 10);
  }, [liveScore]);
  const protected_value = liveScore !== undefined ? computeProtectedExposure(2400000, liveScore) : 0;
  const band = aapl ? `${(aapl.impliedMoveLowBps / 100).toFixed(1)}% to +${(aapl.impliedMoveHighBps / 100).toFixed(1)}%` : "—";
  const oracle = aapl ? `${formatStaleness(aapl.chainlinkStalenessSecs)} stale` : "—";
  return <section className="dash-card simulator-card"><div className="dash-card-header"><div><span className="app-kicker">03 / PROTOCOL IMPACT</span><h2>Simulator</h2></div><span className="sim-live">AAPLx / {liveScore ?? "…"}</span></div>{loading ? <SimulatorSkeleton /> : <><p className="card-description">Same collateral. Different context. See what xRisk makes actionable.</p><div className="sim-columns"><div className="sim-column without"><span className="sim-label">WITHOUT xRISK</span><div className="sim-metric"><small>Kamino LTV</small><strong>75.0%</strong></div><div className="sim-metric"><small>Collateral value</small><strong>$2.40M</strong></div><div className="unknown-state"><CircleAlert size={14} /> RISK UNKNOWN</div><p>Oracle says current. Market context unavailable.</p></div><div className="sim-column with"><span className="sim-label">WITH xRISK</span><div className="sim-metric"><small>Adjusted LTV</small><strong className="danger-text">{ltv.toFixed(1)}%</strong><input aria-label="Adjusted LTV" type="range" min="40" max="75" value={ltv} onChange={(event) => setLtv(Number(event.target.value))} /></div><div className="sim-metric"><small>Collateral value</small><strong>$2.40M</strong></div><div className="quantified-state"><ShieldAlert size={14} /> RISK QUANTIFIED</div><p>{oracle} / {band} implied move.</p></div></div><div className="protected-value"><span>Estimated positions protected</span><strong>${Math.round(protected_value).toLocaleString()}</strong><ArrowUpRight size={15} /></div></>}</section>;
}

function OverviewStrip() {
  const { states } = useRiskStates();
  const tracked = states.length > 0 ? states.length : dashboardStats.tracked;
  const elevated = states.length > 0 ? states.filter((s) => s.score > 75).length : dashboardStats.elevated;
  return <div className="overview-strip"><div><span>TRACKED MINTS</span><strong>{tracked}</strong></div><div><span>ELEVATED RISK</span><strong className="danger-text">{elevated}</strong></div><div><span>POSITIONS PROTECTED</span><strong>{dashboardStats.protected}</strong></div><div><span>LAST PROGRAM BLOCK</span><strong className="block-value">{dashboardStats.lastBlock}</strong></div></div>;
}
export default function Home() {
  const [mobileNav, setMobileNav] = useState(false); const [lastUpdated, setLastUpdated] = useState("just now");
  useEffect(() => { const timer = window.setInterval(() => setLastUpdated("just now"), 30000); return () => window.clearInterval(timer); }, []);
  return <RequireWallet><div className="app-shell"><PanicBanner /><header className="app-header"><Link href="/" className="app-brand"><LogoMark /><span>xRisk</span></Link><nav className={mobileNav ? "app-nav app-nav-open" : "app-nav"}><Link href="/dashboard">Dashboard</Link><Link href="/panics">Panic history</Link><Link href="/leaderboard">Leaderboard</Link><Link href="/profile">Profile</Link><Link href="/docs">Docs</Link><span className="devnet-pill"><i /> DEVNET</span></nav><button className="app-menu" onClick={() => setMobileNav(!mobileNav)} aria-label="Toggle navigation">{mobileNav ? <X size={19} /> : <Menu size={19} />}</button></header><main className="dashboard-main"><div className="dashboard-title"><div><h1>Good morning, <em>risk.</em></h1><p>Live tokenized-market context. No wallet required.</p></div><div className="dash-actions"><span className="updated-label"><Wifi size={13} /> Synced {lastUpdated}</span><button className="icon-button" aria-label="Refresh dashboard" onClick={() => setLastUpdated("just now")}><RefreshCw size={15} /></button><WalletMultiButton /></div></div><OverviewStrip /><div className="dashboard-grid"><RiskGrid /><EventStream /><Simulator /></div><section className="source-strip" id="sources"><span><Activity size={14} /> Program <code>GH636DTz7fDJgo9zAsk6pB3Xwsrf1mEU8jc4PP6KKA8E</code></span><span>Helius devnet <ExternalLink size={12} /></span></section></main><AppFooter /></div></RequireWallet>;
}
