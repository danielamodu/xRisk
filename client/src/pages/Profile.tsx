import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import AppFooter from "@/components/AppFooter";
import PanicBanner from "@/components/PanicBanner";
import { getRiskState, XSTOCK_MINTS, scoreToColor } from "@/lib/xrisk";
import { PROGRAM_ID, decodeUsername, encodeUsername, loadIdl } from "@/lib/program";

interface WatchlistEntry {
  mint: string;
  symbol: string;
  alertThreshold: number;
  currentScore?: number;
  currentConfidence?: string;
}

export default function Profile() {
  const { connection } = useConnection();
  const { publicKey, signTransaction, signAllTransactions } = useWallet();

  const [profile, setProfile] = useState<{ username: string; createdAt: number; watchlistCount: number } | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [creating, setCreating] = useState(false);
  const [addingMint, setAddingMint] = useState(false);
  const [selectedMintToAdd, setSelectedMintToAdd] = useState(XSTOCK_MINTS[0]);
  const [alertThresholdToAdd, setAlertThresholdToAdd] = useState(75);

  async function getProgram(): Promise<anchor.Program | null> {
    if (!publicKey || !signTransaction || !signAllTransactions || !connection) return null;
    const wallet = { publicKey, signTransaction, signAllTransactions };
    const provider = new anchor.AnchorProvider(connection, wallet as any, { commitment: "confirmed" });
    return new anchor.Program(await loadIdl(), provider);
  }

  async function fetchProfile() {
    if (!publicKey) return;
    setLoading(true);
    try {
      const program = await getProgram();
      if (!program) return;
      const [profilePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("user_profile"), publicKey.toBuffer()],
        PROGRAM_ID
      );
      const profileAccount = await (program.account as any).userProfile.fetch(profilePda);
      setProfile({
        username: decodeUsername(profileAccount.username),
        createdAt: profileAccount.createdAt.toNumber(),
        watchlistCount: profileAccount.watchlistCount,
      });
      const entries = await (program.account as any).watchlistEntry.all([
        { memcmp: { offset: 8, bytes: publicKey.toBase58() } },
      ]);
      const parsed: WatchlistEntry[] = await Promise.all(
        entries.map(async (e: any) => {
          const mintStr = e.account.mint.toBase58();
          const symbol = XSTOCK_MINTS.find((m) => m.mint === mintStr)?.symbol ?? "UNKNOWN";
          const riskState = await getRiskState(mintStr, symbol);
          return {
            mint: mintStr,
            symbol,
            alertThreshold: e.account.alertThreshold,
            currentScore: riskState?.score,
            currentConfidence: riskState?.confidence,
          };
        })
      );
      setWatchlist(parsed);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  async function createProfile() {
    if (!publicKey || !usernameInput.trim()) return;
    const program = await getProgram();
    if (!program) return;
    setCreating(true);
    try {
      const [profilePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("user_profile"), publicKey.toBuffer()],
        PROGRAM_ID
      );
      await (program.methods as any)
        .createUserProfile(encodeUsername(usernameInput.trim()))
        .accounts({ userProfile: profilePda, wallet: publicKey, systemProgram: SystemProgram.programId })
        .rpc();
      await fetchProfile();
    } catch (err) {
      console.error("Failed to create profile:", err);
    } finally {
      setCreating(false);
    }
  }

  async function addToWatchlist() {
    if (!publicKey) return;
    const program = await getProgram();
    if (!program) return;
    try {
      const mint = new PublicKey(selectedMintToAdd.mint);
      const [profilePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("user_profile"), publicKey.toBuffer()],
        PROGRAM_ID
      );
      const [watchlistPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("watchlist"), publicKey.toBuffer(), mint.toBuffer()],
        PROGRAM_ID
      );
      await (program.methods as any)
        .addToWatchlist(mint, alertThresholdToAdd)
        .accounts({ watchlistEntry: watchlistPda, userProfile: profilePda, wallet: publicKey, systemProgram: SystemProgram.programId })
        .rpc();
      setAddingMint(false);
      await fetchProfile();
    } catch (err) {
      console.error("Failed to add to watchlist:", err);
    }
  }

  async function removeFromWatchlist(mintStr: string) {
    if (!publicKey) return;
    const program = await getProgram();
    if (!program) return;
    try {
      const mint = new PublicKey(mintStr);
      const [profilePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("user_profile"), publicKey.toBuffer()],
        PROGRAM_ID
      );
      const [watchlistPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("watchlist"), publicKey.toBuffer(), mint.toBuffer()],
        PROGRAM_ID
      );
      await (program.methods as any)
        .removeFromWatchlist(mint)
        .accounts({ watchlistEntry: watchlistPda, userProfile: profilePda, wallet: publicKey })
        .rpc();
      await fetchProfile();
    } catch (err) {
      console.error("Failed to remove from watchlist:", err);
    }
  }

  useEffect(() => {
    if (publicKey) fetchProfile();
    else {
      setProfile(null);
      setWatchlist([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey]);

  const activeAlerts = watchlist.filter(
    (e) => e.currentScore !== undefined && e.alertThreshold > 0 && e.currentScore >= e.alertThreshold
  );

  return (
    <div className="app-shell">
      <PanicBanner />
      <header className="app-header">
        <Link href="/" className="app-brand"><span className="app-logo-mark"><i /><i /><i /></span><span>xRisk</span></Link>
        <nav className="app-nav">
          <Link href="/dashboard">Dashboard</Link><Link href="/panics">Panic history</Link><Link href="/leaderboard">Leaderboard</Link><Link href="/profile">Profile</Link><Link href="/docs">Docs</Link>
          <span className="devnet-pill"><i /> DEVNET</span>
        </nav>
      </header>
      <main className="dashboard-main page-main">
        {!publicKey ? (
          <div className="page-title">
            <h1>Your <em>profile.</em></h1>
            <p>Connect your Solana wallet to track risk across your xStock positions.</p>
            <Link href="/signin" className="signin-cta">Connect Wallet →</Link>
          </div>
        ) : loading ? (
          <div className="page-title"><h1>Your <em>profile.</em></h1><p>Loading profile...</p></div>
        ) : !profile ? (
          <div className="page-title">
            <h1>Welcome to <em>xRisk.</em></h1>
            <p>Choose a username. Stored on-chain. Permanent.</p>
            <div className="username-row">
              <input
                type="text"
                placeholder="your_username"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value.slice(0, 20).replace(/[^a-zA-Z0-9_]/g, ""))}
                maxLength={20}
              />
              <button onClick={createProfile} disabled={creating || !usernameInput.trim()}>
                {creating ? "Creating..." : "Create Profile"}
              </button>
            </div>
            <p className="cost-note">~0.002 SOL · stored on Solana devnet</p>
          </div>
        ) : (
          <>
            <div className="page-title">
              <h1>{profile.username} <em>watches.</em></h1>
              <p>{publicKey.toBase58().slice(0, 8)}...{publicKey.toBase58().slice(-8)} · member since {new Date(profile.createdAt * 1000).toLocaleDateString()}</p>
            </div>
            {activeAlerts.length > 0 && (
              <div className="panic-banner">
                <span><strong>{activeAlerts.length} ALERT{activeAlerts.length > 1 ? "S" : ""}</strong> {activeAlerts.map((a) => `${a.symbol} (${a.currentScore})`).join(", ")}</span>
              </div>
            )}
            <section className="dash-card history-card">
              <div className="history-head"><span>Mint</span><span>Score</span><span>Threshold</span><span>Status</span><span></span></div>
              {watchlist.length === 0 ? (
                <div className="loading">No mints tracked yet.</div>
              ) : (
                watchlist.map((entry) => {
                  const alerting =
                    entry.currentScore !== undefined &&
                    entry.alertThreshold > 0 &&
                    entry.currentScore >= entry.alertThreshold;
                  return (
                    <div className="history-row" key={entry.mint}>
                      <span><Link href={`/mint/${entry.symbol}`}>{entry.symbol}</Link></span>
                      <span style={{ color: scoreToColor(entry.currentScore ?? 0) }}>{entry.currentScore ?? "—"}</span>
                      <span>{entry.alertThreshold > 0 ? `≥ ${entry.alertThreshold}` : "Off"}</span>
                      <span>{alerting ? "ALERT" : "OK"}</span>
                      <span><button onClick={() => removeFromWatchlist(entry.mint)}>Remove</button></span>
                    </div>
                  );
                })
              )}
            </section>
            {!addingMint ? (
              <button onClick={() => setAddingMint(true)}>+ Add Mint</button>
            ) : (
              <section className="dash-card history-card">
                <div className="history-head"><span>Mint</span><span>Alert ≥</span><span></span></div>
                <div className="history-row">
                  <span>
                    <select
                      value={selectedMintToAdd.symbol}
                      onChange={(e) => {
                        const found = XSTOCK_MINTS.find((m) => m.symbol === e.target.value);
                        if (found) setSelectedMintToAdd(found);
                      }}
                    >
                      {XSTOCK_MINTS.map((m) => (
                        <option key={m.symbol} value={m.symbol}>{m.symbol}</option>
                      ))}
                    </select>
                  </span>
                  <span>
                    <input
                      type="number" min={0} max={100}
                      value={alertThresholdToAdd}
                      onChange={(e) => setAlertThresholdToAdd(Number(e.target.value))}
                    />
                  </span>
                  <span>
                    <button onClick={addToWatchlist}>Add</button>{" "}
                    <button onClick={() => setAddingMint(false)}>Cancel</button>
                  </span>
                </div>
              </section>
            )}
            <p><Link href={`/wallet/${publicKey.toBase58()}`}>View your on-chain risk history →</Link></p>
          </>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
