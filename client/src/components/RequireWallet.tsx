import { useEffect, useState, type ReactNode } from "react";
import { Redirect } from "wouter";
import { useWallet } from "@solana/wallet-adapter-react";

// Gate for wallet-only pages. Unconnected visitors bounce to /signin.
// Allows a grace window so auto-reconnecting returners don't flash away.
export default function RequireWallet({ children }: { children: ReactNode }) {
  const { connected, connecting, wallet } = useWallet();
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(true), 2500);
    return () => window.clearTimeout(timer);
  }, []);

  if (connected) return <>{children}</>;
  if (connecting || wallet || !settled) {
    return (
      <div className="app-shell">
        <main className="dashboard-main page-main">
          <div className="loading">Connecting wallet...</div>
        </main>
      </div>
    );
  }
  return <Redirect to="/signin" />;
}
