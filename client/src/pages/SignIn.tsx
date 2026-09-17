import { Link, Redirect } from "wouter";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { ShieldAlert } from "lucide-react";

export default function SignIn() {
  const { connected } = useWallet();

  // Returning users (wallet already connected) skip straight to the dashboard
  if (connected) return <Redirect to="/dashboard" />;

  return (
    <div className="signin-shell">
      <div className="signin-left">
        <Link href="/" className="app-brand">
          <span className="app-logo-mark"><i /><i /><i /></span>
          <span>xRisk</span>
        </Link>
        <h1>Know what<br />you&apos;re trusting.</h1>
        <p className="signin-sub">Live risk context for tokenized stocks. No signup. No email. Wallet&nbsp;=&nbsp;identity.</p>
        <div className="signin-card">
          <WalletMultiButton />
                    <div className="signin-features">
            <div>◎ Personal watchlist stored on-chain</div>
            <div>◎ Custom alert thresholds per mint</div>
            <div>◎ Risk history for your wallet</div>
          </div>
        </div>
        <p className="signin-note">
          <ShieldAlert size={13} /> Connecting is free and read-only. You only sign when creating your profile or watchlist.
        </p>
      </div>
<div className="signin-right signin-visual-right"><img src="/hero.jpg" alt="Hands calculating risk across volatile markets" /></div>
    </div>
  );
}
