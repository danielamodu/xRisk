import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { Connection, PublicKey } from "@solana/web3.js";
import AppFooter from "@/components/AppFooter";
import PanicBanner from "@/components/PanicBanner";
import { scoreToColor, MINT_TO_SYMBOL } from "@/lib/xrisk";
import { PROGRAM_ID, decodeUsername, getReadonlyProgram } from "@/lib/program";

interface TransferEvent {
  signature: string;
  symbol: string;
  amount: number;
  score: number;
  confidence: string;
  marketStatus: string;
  timestamp: number;
}

export default function WalletDetail() {
  const [, params] = useRoute("/wallet/:address");
  const address = params?.address ?? "";
  const [events, setEvents] = useState<TransferEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const walletPubkey = new PublicKey(address);
        const program = await getReadonlyProgram();
        const connection = new Connection(
          import.meta.env.VITE_RPC_URL || "https://api.devnet.solana.com",
          "confirmed"
        );

        try {
          const [profilePda] = PublicKey.findProgramAddressSync(
            [Buffer.from("user_profile"), walletPubkey.toBuffer()],
            PROGRAM_ID
          );
          const profileAccount = await (program.account as any).userProfile.fetch(profilePda);
          setUsername(decodeUsername(profileAccount.username));
        } catch {
          // anonymous wallet
        }

        const sigs = await connection.getSignaturesForAddress(walletPubkey, { limit: 20 });
        const parsed: TransferEvent[] = [];
        for (const sig of sigs) {
          try {
            const tx = await connection.getTransaction(sig.signature, {
              maxSupportedTransactionVersion: 0,
            });
            const logs = tx?.meta?.logMessages;
            if (!logs || tx?.meta?.err) continue;
            for (const log of logs) {
              if (!log.startsWith("Program data:")) continue;
              let decoded: { name: string; data: any } | null = null;
              try {
                decoded = (program as any).coder.events.decode(log.slice(13).trim());
              } catch {
                continue;
              }
              if (!decoded || decoded.name !== "riskEvent") continue;
              const mintStr = (decoded.data.mint as PublicKey).toBase58();
              if (!MINT_TO_SYMBOL[mintStr]) continue;
              const score = decoded.data.score as number;
              parsed.push({
                signature: sig.signature,
                symbol: MINT_TO_SYMBOL[mintStr],
                amount: Number(decoded.data.transferAmount),
                score,
                confidence: Object.keys(decoded.data.confidence)[0].toUpperCase(),
                marketStatus: Object.keys(decoded.data.marketStatus)[0].toUpperCase(),
                timestamp: (sig.blockTime ?? 0) * 1000,
              });
            }
          } catch {
            continue;
          }
        }
        setEvents(parsed);
      } catch (err) {
        console.error("Failed to fetch wallet history:", err);
      } finally {
        setLoading(false);
      }
    }
    if (address) load();
  }, [address]);

  const avg =
    events.length > 0 ? Math.round(events.reduce((s, e) => s + e.score, 0) / events.length) : null;

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
          <h1>{username ? `${username}’s ` : ""}Wallet <em>history.</em></h1>
          <p>{address.slice(0, 8)}...{address.slice(-8)}{avg !== null && <> · avg risk <strong style={{ color: scoreToColor(avg) }}>{avg}</strong></>}</p>
        </div>
        {loading ? (
          <div className="loading">Reading on-chain transfer history...</div>
        ) : events.length === 0 ? (
          <div className="loading">No xStock transfers found for this wallet on devnet.</div>
        ) : (
          <section className="dash-card history-card">
            <div className="history-head"><span>Time</span><span>Mint</span><span>Amount</span><span>Score</span><span>Confidence</span></div>
            {events.map((e) => (
              <div className="history-row" key={e.signature}>
                <span className="history-time">{new Date(e.timestamp).toLocaleString()}</span>
                <span><Link href={`/mint/${e.symbol}`}>{e.symbol}</Link></span>
                <span>{e.amount.toLocaleString()}</span>
                <span style={{ color: scoreToColor(e.score) }}><strong>{e.score}</strong></span>
                <span>{e.confidence}</span>
              </div>
            ))}
          </section>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
