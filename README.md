# xRisk

A dashboard-first control room for tokenized public-market risk on Solana. The app currently runs with a polished demo data layer and is structured for a later Solana devnet integration.

## What is included

- `/` — responsive dashboard with:
  - Risk Grid for tracked xStocks
  - Live RiskEvent stream
  - Protocol Impact Simulator
  - Panic Broadcast banner
  - Devnet/source status strip
- `/panics` — PanicBroadcast history table
- `/mint/:symbol` — mint detail view with:
  - current score and confidence
  - market/oracle/BTC/implied-band breakdown
  - 24-hour risk chart
  - recent RiskEvents
- Shared xRisk SVG mark, favicon, and wordmark assets in `client/public/`
- Responsive mobile layout with no wallet connection required
- 30-second refresh scaffold in the dashboard UI

## Current data status

The UI currently uses deterministic demo data in `client/src/lib/riskData.ts`. It is not yet reading live Solana accounts or logs.

Target integration:

- Network: Solana devnet
- Program ID: `GH636DTz7fDJgo9zAsk6pB3Xwsrf1mEU8jc4PP6KKA8E`
- RPC: Helius devnet endpoint, supplied through an environment variable
- Poll `RiskState` accounts every 30 seconds
- Subscribe to program logs for real-time `RiskEvent` and `PanicBroadcast` updates

## Local installation

Requirements: Node.js 22+ and pnpm 10+.

```bash
git clone https://github.com/danielamodu/xrisk-protocol.git
cd xrisk-protocol
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Verification commands

```bash
pnpm check
pnpm build
```

The project is a Vite + React + TypeScript + Tailwind static frontend. There is no wallet connection, authentication, database, or backend API in the current version.

## Environment setup for the Solana integration

Create a local `.env.local` when live data work begins:

```bash
VITE_HELIUS_DEVNET_RPC_URL=https://devnet.helius-rpc.com/?api-key=replace_me
VITE_XRISK_PROGRAM_ID=GH636DTz7fDJgo9zAsk6pB3Xwsrf1mEU8jc4PP6KKA8E
```

Do not commit real API keys. Use the project secret-management workflow for deployed environments.

## Project map

```text
client/src/App.tsx                 route map
client/src/pages/Home.tsx          dashboard
client/src/pages/Panics.tsx        panic history
client/src/pages/MintDetail.tsx    mint detail route
client/src/lib/riskData.ts         current demo data and types
client/src/index.css               dashboard design system
client/public/                     favicon and logo SVGs
```

## Suggested next implementation order

1. Add `VITE_HELIUS_DEVNET_RPC_URL` and a small Solana client/data adapter.
2. Decode `RiskState`, `RiskEvent`, and `PanicBroadcast` accounts/logs into the existing TypeScript types.
3. Replace the demo arrays in `riskData.ts` behind a polling hook without changing the presentational components.
4. Add connection/error/loading states for RPC outages and stale data.
5. Add an integration test or fixture replay for each event type before switching the UI to live data.

## Handoff notes for the next agent

Preserve the current visual language: paper background, black control-room cards, coral risk accent, acid-lime live indicator, Space Grotesk display type, and DM Mono data type. Keep the dashboard readable at desktop and mobile widths. The key product promise is that xRisk turns a technically available but contextually unsafe price into a machine-readable risk state for downstream protocols.

## License

Private repository. Add the project license and contributor policy before making the repository public.
