import { ArrowUpRight } from "lucide-react";
import { Link } from "wouter";

export default function AppFooter() {
  return <footer className="app-footer"><Link href="/" className="footer-brand"><span className="app-logo-mark"><i /><i /><i /></span><span>xRisk</span></Link><nav><Link href="/dashboard">Dashboard</Link><Link href="/panics">Panic history</Link><Link href="/leaderboard">Leaderboard</Link><Link href="/docs">Docs <ArrowUpRight size={12} /></Link></nav><span className="footer-meta">Solana devnet · No wallet required</span></footer>;
}
