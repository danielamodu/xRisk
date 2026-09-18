import { ArrowRight, ShieldAlert } from "lucide-react";
import { Link } from "wouter";
import AppFooter from "@/components/AppFooter";
import PanicBanner from "@/components/PanicBanner";
import { useRiskStates } from "@/hooks/useRiskStates";
import { usePanics } from "@/hooks/usePanics";
import { scoreToColor } from "@/lib/xrisk";

function LiveSnapshot() {
  const { states, loading } = useRiskStates();
  const top = [...states].sort((a, b) => b.score - a.score).slice(0, 5);
  return (
    <section className="landing-section">
      <span className="app-kicker">LIVE RISK SNAPSHOT</span>
      <h2>Highest risk on devnet, right now.</h2>
      {loading || top.length === 0 ? (
        <p className="landing-muted">Reading on-chain state...</p>
      ) : (
        <div className="landing-snapshot">
          {top.map((s) => (
            <Link key={s.symbol} href={`/mint/${s.symbol}`} className="landing-snapshot-row">
              <span className="asset-avatar">{s.symbol.slice(0, 1)}</span>
              <strong>{s.symbol}</strong>
              <span className="landing-snapshot-market">{s.marketStatus.toUpperCase()}</span>
              <strong style={{ color: scoreToColor(s.score) }}>{s.score}</strong>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}


function TickerTape() {
  const { states, loading } = useRiskStates();
  if (loading || states.length === 0) return null;
  const items = [...states, ...states];
  return (
    <div className="ticker-tape" aria-hidden="true">
      <div className="ticker-track">
        {items.map((s, i) => (
          <span className="ticker-item" key={s.symbol + i}>
            <strong>{s.symbol}</strong>
            <b style={{ color: scoreToColor(s.score) }}>{s.score}</b>
            <small>{s.marketStatus.toUpperCase()}</small>
          </span>
        ))}
      </div>
    </div>
  );
}

function StatsBand() {
  const { states } = useRiskStates();
  const { panics } = usePanics();
  const elevated = states.filter((s) => s.score > 75).length;
  return (
    <section className="landing-stats-band">
      <div><strong>{states.length || "ΓÇö"}</strong><span>MINTS TRACKED</span></div>
      <div><strong className={elevated > 0 ? "danger-text" : ""}>{states.length ? elevated : "ΓÇö"}</strong><span>ELEVATED NOW</span></div>
      <div><strong>{panics.length}</strong><span>PANICS LOGGED</span></div>
      <div><strong>30s</strong><span>ON-CHAIN CADENCE</span></div>
    </section>
  );
}

function Methodology() {
  return (
    <section className="landing-section">
      <span className="app-kicker">HOW SCORING WORKS</span>
      <h2>Three signals. One number.</h2>
      <div className="landing-steps">
        <div><strong>MARKET STATE ┬╖ up to 45</strong><p>Weekend and closed sessions score highest ΓÇö prices exist but nothing backs them. Open markets score zero.</p></div>
        <div><strong>ORACLE STALENESS ┬╖ up to 25</strong><p>The longer since a trusted price printed, the higher the score. Fresh oracles during open hours stay at zero.</p></div>
        <div><strong>BTC MOMENTUM ┬╖ up to 20</strong><p>Sharp hourly BTC moves raise every mint ΓÇö macro shocks don&apos;t respect market hours.</p></div>
      </div>
    </section>
  );
}

function PanicPreview() {
  const { panics, loading } = usePanics();
  if (loading || panics.length === 0) return null;
  return (
    <section className="landing-section">
      <span className="app-kicker">RECEIPT BOOK</span>
      <h2>Recent panic broadcasts.</h2>
      <div className="landing-panics">
        {panics.slice(0, 3).map((e) => (
          <div className="landing-panic-row" key={e.id}>
            <strong style={{ color: "#C0392B" }}>{e.severity}</strong>
            <span>{e.trigger.replace(/_/g, " ")}</span>
            <small>{e.affectedSymbols.join(", ")}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

function Faq() {
  const items = [
    ["What is xRisk?", "A risk-context layer for tokenized stocks. It scores every xStock mint 0ΓÇô100 based on market hours, oracle staleness, and BTC momentum ΓÇö and writes that state on-chain every 30 seconds."],
    ["Do I need a wallet to browse?", "No. The dashboard, mint pages, panic history, and docs are open. You only connect when creating a profile or watchlist."],
    ["How do protocols use it?", "One REST call: GET /api/risk/:mint returns the live score, confidence, implied-move band, and a suggested LTV adjustment. See the docs page."],
    ["Which network is this on?", "Solana devnet. Scores, attestations, profiles, and panics are all real on-chain state ΓÇö just not real money."],
    ["Is this financial advice?", "No. xRisk is an experimental devnet demo describing market conditions, not telling anyone what to trade."],
  ];
  return (
    <section className="landing-section">
      <span className="app-kicker">FAQ</span>
      <h2>Questions, answered.</h2>
      <div className="landing-faq">
        {items.map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export default function Landing() {
  return <div className="app-shell landing-page"><PanicBanner /><header className="app-header"><Link href="/" className="app-brand"><span className="app-logo-mark"><i /><i /><i /></span><span>xRisk</span></Link><nav className="app-nav"><Link href="/dashboard">Dashboard</Link><Link href="/leaderboard">Leaderboard</Link><Link href="/profile">Profile</Link><Link href="/docs">Docs</Link><span className="devnet-pill"><i /> DEVNET</span></nav></header><main className="landing-main"><div className="landing-copy"><span className="landing-eyebrow"><i /> Risk context for 24/7 markets</span><h1>Never lend against <em>a stale price.</em></h1><p>Tokenized stocks trade 24/7. Their prices don&apos;t. xRisk scores every xStock mint 0–100 on-chain — so lending protocols know exactly when collateral can&apos;t be trusted, and cut LTV before it hurts.</p><div className="landing-actions"><Link href="/signin" className="landing-primary">Enter the app <ArrowRight size={16} /></Link><Link href="/docs" className="landing-secondary">Read the docs</Link></div></div><div className="landing-hero-visual"><img src="/hero.jpg" alt="Hands calculating risk across volatile markets" /></div></main><TickerTape /><section className="landing-proof"><div><strong>63%</strong><span>of tokenized stock volume settles outside NYSE hours.</span></div><div><strong>24/7</strong><span>DeFi keeps moving when reference markets stop printing.</span></div><div><strong>1</strong><span>machine-readable signal for every downstream protocol.</span></div></section><section className="landing-section"><span className="app-kicker">HOW IT WORKS</span><h2>From market close to machine-readable risk in 30 seconds.</h2><div className="landing-steps"><div><strong>01 ┬╖ Track</strong><p>An off-chain indexer watches market hours, oracle staleness, and BTC momentum for every xStock mint.</p></div><div><strong>02 ┬╖ Score</strong><p>Each mint gets a 0ΓÇô100 risk score with confidence and an implied-move band, written on-chain every 30 seconds.</p></div><div><strong>03 ┬╖ Act</strong><p>Lending protocols adjust LTV, subscribers catch panic broadcasts, and wallets earn RiskLP for braving blind windows.</p></div></div></section><LiveSnapshot /><StatsBand /><Methodology /><PanicPreview /><section className="landing-section"><span className="app-kicker">FOR PROTOCOLS</span><h2>One API call. Zero custody.</h2><p className="landing-muted">xRisk never holds funds, replaces oracles, or asks permission. Read the signal and set your own policy.</p><div className="landing-cards"><div><strong>Lending</strong><p>Kamino-style: read <code>/api/risk/:mint</code>, apply the suggested LTV, gate new borrows when confidence drops to Blind. </p></div><div><strong>AMMs</strong><p>Widen spreads or flag pools when the reference market is closed and the oracle is aging.</p></div><div><strong>Risk teams</strong><p>One machine-readable number per mint instead of a terminal and a prayer.</p></div></div></section><Faq /><section className="landing-cta"><h2>Collateral you can&apos;t trust is collateral you can&apos;t price.</h2><p>Read the signal. Cut the LTV. Sleep through the weekend.</p><div className="landing-actions"><Link href="/signin" className="landing-primary">Enter the app <ArrowRight size={16} /></Link><Link href="/docs" className="landing-secondary">Read the docs</Link></div></section><AppFooter /></div>;
}
