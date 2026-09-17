# xRisk — Live Risk Context for Tokenized Stocks

xRisk turns the blind spots between traditional market hours and always-on DeFi
into a live, machine-readable risk signal — written on-chain every 30 seconds.

When public markets close but on-chain trading continues, xRisk tells protocols
when a price is technically available but economically unsafe to trust.

- **Program:** `GH636DTz7fDJgo9zAsk6pB3Xwsrf1mEU8jc4PP6KKA8E` (Solana devnet)
- **Frontend:** Vite + React 19 + Express (this repo)
- **Signal engine:** TypeScript indexer feeding `RiskState` PDAs on-chain

## What it does

| Surface | Route | Data |
|---|---|---|
| Landing | `/` | Marketing + live risk snapshot, ticker, methodology, FAQ |
| Dashboard (gated) | `/dashboard` | Live risk grid, LTV simulator, event stream — wallet required |
| Sign in | `/signin` | Phantom / Solflare connect, first-time entry point |
| Mint detail | `/mint/:symbol` | Per-mint live context + transfer events |
| Panic history | `/panics` | Every on-chain `PanicBroadcast`, newest first |
| RiskLP leaderboard | `/leaderboard` | Wallets attested for braving high-risk windows |
| Profile | `/profile` | On-chain username + per-mint alert watchlist |
| Wallet history | `/wallet/:address` | Any wallet's transfers overlaid with risk scores |
| Protocol API | `/api/risk/:mint` | Live JSON for any tracked mint (open, no auth) |
| News feed | `/api/news` | Market headlines merged into the panic wire |
| Panics feed | `/api/panics` | Panic log, newest first |

**Flow:** landing → sign-in → dashboard → explore. The dashboard bounces
unconnected wallets back to `/signin`. Docs and the protocol API stay public.

**Risk scoring (0–100):** market state (up to 45) + oracle staleness (up to 25)
+ BTC hourly momentum (up to 20). Scores above 75 mark Blind windows; panics
fire at 85+ across 3 or more mints.

## Quickstart

Prerequisites: Node 20+, pnpm 10.

```bash
git clone https://github.com/danielamodu/xRisk.git
cd xRisk
pnpm install
pnpm build
pnpm start
```

Open http://localhost:3000 (set `PORT` to change it).

> **pnpm workspace note:** if your machine has a stray `pnpm-workspace.yaml`
> in a parent directory, install and add with the flag so deps stay local:
> `pnpm install --ignore-workspace`

### Environment

Copy these into a `.env` file (gitignored — never commit keys):

```
VITE_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_HELIUS_KEY
VITE_PROGRAM_ID=GH636DTz7fDJgo9zAsk6pB3Xwsrf1mEU8jc4PP6KKA8E
NEWSAPI_KEY=your-newsapi-key          # optional: market headlines in the wire
CRYPTOPANIC_TOKEN=your-token          # optional: crypto headlines in the wire
```

- `VITE_RPC_URL` is baked into the client at build time and used by the
  server for the protocol API. A dedicated RPC endpoint (Helius free tier)
  is strongly recommended — the public devnet endpoint rate-limits the
  30-second update cadence.
- News keys live server-side only and are cached for 15 minutes to stay
  inside free-tier quotas. Without them the wire rotates on-chain panics.

### Scripts

```bash
pnpm dev      # vite dev server (client only; /api/* needs the built server)
pnpm check    # tsc --noEmit
pnpm build    # vite build + esbuild server bundle into dist/
pnpm start    # production: NODE_ENV=production node dist/index.js
```

## How it fits together

```
                        ┌──────────────────────────────┐
                        │  xRisk Anchor program        │
                        │  RiskState · RiskLpRecord    │
                        │  UserProfile · Watchlist     │  devnet
                        └──────────────┬───────────────┘
                                       │ 30s updates / events
                        ┌──────────────▼───────────────┐
                        │  Signal indexer (off-chain)  │
                        │  scores · panics · watchers  │
                        └──────────────┬───────────────┘
                                       │ panic_log.json
                        ┌──────────────▼───────────────┐
                        │  This repo: Express + Vite   │
                        │  /api/* · pages · wire       │
                        └──────────────────────────────┘
```

- `client/public/xrisk_core.json` — program IDL (new-format Anchor spec).
  Keep it in sync with on-chain upgrades or reads/writes break.
- `client/src/lib/xrisk.ts` — the single on-chain reader (PDAs, parsing, LTV math).
- `client/src/hooks/` — `useRiskStates` (30s), `usePanics` (15s).
- `server/index.ts` — static hosting plus `/api/panics`, `/api/risk/:mint`,
  `/api/news`. API routes must be registered before the SPA catch-all.
- `panic_log.json` — runtime file written by the indexer (gitignored).

## Protocol integration

```bash
GET /api/risk/XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp
```

Returns score, confidence, market status, oracle age, implied-move band, and a
suggested LTV adjustment. Cached 25s, CORS open. See `/docs` in the app.

## Status

Devnet demo. Scores, attestations, profiles, and panics are real on-chain
state — not real money. Not financial advice.
