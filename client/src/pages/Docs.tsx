import { ArrowLeft, ArrowUpRight, Check, CircleAlert, Code2, ExternalLink, ShieldAlert } from "lucide-react";
import { Link } from "wouter";
import AppFooter from "@/components/AppFooter";
import PanicBanner from "@/components/PanicBanner";

export default function Docs() {
  return <div className="app-shell"><PanicBanner /><header className="app-header"><Link href="/" className="app-brand"><span className="app-logo-mark"><i /><i /><i /></span><span>xRisk</span></Link><nav className="app-nav"><Link href="/dashboard">Dashboard</Link><Link href="/docs">Docs</Link><Link href="/panics">Panic history</Link><Link href="/leaderboard">Leaderboard</Link><Link href="/profile">Profile</Link><span className="devnet-pill"><i /> DEVNET</span></nav></header><main className="dashboard-main page-main docs-main"><Link href="/dashboard" className="back-link"><ArrowLeft size={14} /> Back to dashboard</Link><div className="page-title"><h1>Build with <em>xRisk.</em></h1><p>The context layer for tokenized public markets.</p></div><div className="docs-grid"><aside className="docs-nav"><a href="#overview">Overview</a><a href="#signal">Signal</a><a href="#integration">Integration</a><a href="#data">Data sources</a></aside><div className="docs-content"><section id="overview" className="docs-section"><span className="docs-icon"><ShieldAlert size={18} /></span><h2>Know when a price is unsafe to trust.</h2><p>xRisk monitors the gap between always-on tokenized markets and the reference markets that price them. It turns stale or incomplete context into a machine-readable state downstream protocols can act on.</p></section><section id="signal" className="docs-section"><span className="docs-icon"><Code2 size={18} /></span><h2>The signal</h2><p>Every tracked mint resolves to a state with a score, confidence, market status, oracle age, and estimated move band.</p><pre><code>{`xrisk.getSignal("AAPLx")

{
  state: "UNPRICED",
  score: 87,
  confidence: "BLIND",
  marketStatus: "WEEKEND",
  oracleAge: 34980,
  impliedBand: [-0.032, 0.011]
}`}</code></pre></section><section id="integration" className="docs-section"><span className="docs-icon"><Check size={18} /></span><h2>Protocol integration</h2><p>Protocols read the signal and choose their own policy. xRisk does not take custody, replace the underlying oracle, or require a wallet connection.</p><div className="docs-cards"><article><strong>Kamino</strong><p>Adjust effective LTV, gate new borrows, or pause liquidation actions when confidence drops.</p></article><article><strong>Raydium</strong><p>Widen spreads, reduce trade size, or flag pool conditions when the underlying market is stale.</p></article></div></section><section id="data" className="docs-section"><span className="docs-icon"><ExternalLink size={18} /></span><h2>Data sources</h2><p>Current environment: Solana devnet.</p><div className="docs-data"><span>Program</span><code>GH636DTz7fDJgo9zAsk6pB3Xwsrf1mEU8jc4PP6KKA8E</code><span>Update cadence</span><code>30 seconds + program logs</code><span>RPC</span><code>Helius devnet endpoint</code></div></section></div></div></main><AppFooter /></div>;
}
