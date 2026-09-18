import { useEffect, useState } from "react";
import { Link } from "wouter";
import { PublicKey } from "@solana/web3.js";
import AppFooter from "@/components/AppFooter";
import PanicBanner from "@/components/PanicBanner";
import { MINT_TO_SYMBOL } from "@/lib/xrisk";
import { getReadonlyProgram } from "@/lib/program";

interface Entry {
  wallet: string;
  mint: string;
  symbol: string;
  attestationCount: number;
  highestScoreSeen: number;
  lastAttestedTs: number;
}

export default function Leaderboard() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const program = await getReadonlyProgram();
        const accounts = await (program.account as any).riskLpRecord.all();
        const parsed: Entry[] = accounts.map((a: any) => ({
          wallet: (a.account.wallet as PublicKey).toBase58(),
          mint: (a.account.mint as PublicKey).toBase58(),
          symbol: MINT_TO_SYMBOL[(a.account.mint as PublicKey).toBase58()] ?? "UNKNOWN",
          attestationCount: a.account.attestationCount.toNumber(),
          highestScoreSeen: a.account.highestScoreSeen as number,
          lastAttestedTs: a.account.lastAttestedTs.toNumber(),
        }));
        parsed.sort((a, b) => b.attestationCount - a.attestationCount);
        setEntries(parsed);
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
    const interval = window.setInterval(load, 30_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="app-shell">
      <PanicBanner />
      <header className="app-header">
        <Link href="/" className="app-brand"><span className="app-logo-mark"><i /><i /><i /></span><span>xRisk</span></Link>
        <nav className="app-nav">
          <Link href="/dashboard">Dashboard</Link><Link href="/docs">Docs</Link><Link href="/panics">Panic history</Link><Link href="/leaderboard">Leaderboard</Link><Link href="/profile">Profile</Link>
          <span className="devnet-pill"><i /> DEVNET</span>
        </nav>
      </header>
      <main className="dashboard-main page-main">
        <div className="page-title">
          <h1>RiskLP <em>leaderboard.</em></h1>
          <p>Wallets active during high-risk windows. Attested on-chain.</p>
        </div>
        {loading ? (
          <div className="loading">Reading on-chain attestations...</div>
        ) : entries.length === 0 ? (
          <div className="loading">No RiskLP attestations yet.</div>
        ) : (
          <section className="dash-card history-card">
            <div className="history-head"><span>#</span><span>Wallet</span><span>Mint</span><span>Attestations</span><span>Worst seen</span></div>
            {entries.map((e, i) => (
              <div className="history-row" key={`${e.wallet}-${e.mint}`}>
                <span>{i + 1}</span>
                <span><Link href={`/wallet/${e.wallet}`}>{e.wallet.slice(0, 4)}...{e.wallet.slice(-4)}</Link></span>
                <span><Link href={`/mint/${e.symbol}`}>{e.symbol}</Link></span>
                <span><strong>{e.attestationCount}</strong></span>
                <span>{e.highestScoreSeen}</span>
              </div>
            ))}
          </section>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
