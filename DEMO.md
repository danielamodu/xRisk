# xRisk Demo Script — "Never lend against a stale price" (3 min)

One story, one user, one action. You are showing a lending protocol why it
should never trust a tokenized-stock price blindly — and how xRisk fixes it.

**Setup before recording:** devnet, indexer running (`npm start` in
`xRisk/app/indexer`), frontend on http://localhost:3000, Phantom on devnet
with ~0.5 SOL. Know the market state: if NYSE is open, scores read ~0
("Risk is priced" — use the *mechanics* beats below); if closed/weekend,
scores spike and every beat lands harder.

---

## Beat 1 — The problem (landing, 30s)

Land on `/`. Read the headline out loud: *"Never lend against a stale price."*

Say: *"Tokenized stocks trade 24/7. Their prices don't. When Wall Street
closes, the oracle keeps quoting Friday 4pm — and lending protocols quote
borrow limits against it like it's fresh. That's the gap xRisk closes."*

Scroll once through the ticker and methodology. Don't linger.

## Beat 2 — The live proof (dashboard, 60s)

Click **Enter the app** → connect wallet → dashboard.

- Point at the Risk Grid: *"Every mint scored 0–100, written on-chain every
  30 seconds. Not a dashboard number — click any PDA on the explorer."*
- Open AAPLx. Show market status, oracle age, implied-move band.
- **Simulator (the money shot):** *"Same $2.4M collateral. Without xRisk,
  Kamino lends 75% against a possibly-stale price. With xRisk, the LTV
  drops with the score — here's the protected exposure, computed live."*

If scores are 0 (market open): *"Right now the market's open, so risk is
priced and LTV stays full. That's the system working — come back after
close and watch it bite."* Then show `/api/risk/<mint>` JSON as the
machine-readable receipt.

## Beat 3 — It already fired (panics + leaderboard, 45s)

Open **Panic history**: *"When 3+ mints cross 85, the program screams
on-chain. Here's a real one — severity, trigger, explorer link."*

Open **Leaderboard**: *"And when wallets move during those windows, they
get attested. Protocols can reward the wallets that provide liquidity when
it's dangerous. That's RiskLP — reputation with receipts."*

## Beat 4 — Personalize it (profile, 30s)

Open **Profile** → create username → add AAPLx with threshold 75:
*"Every user gets on-chain alerts. Set it, and when the score crosses,
you know before your position does."*

## Beat 5 — Close (15s)

*"xRisk is a risk oracle for tokenized-stock collateral: scores, panics,
attestations, alerts — all on-chain, all verifiable. Never lend against
a stale price."*

---

## If something breaks on stage

- Scores all 0 → market is open; say so, it's correct behavior.
- Wallet won't connect → use the Protocol API + explorer links; they're
  wallet-free and prove the same point.
- RPC 429s → Helius devnet throttles under load; wait 30s, it recovers.
- Never claim mainnet. This is a devnet demo with real chain state.
