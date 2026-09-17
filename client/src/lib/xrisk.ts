import { Buffer } from "buffer";
import { Connection, PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import idl from "../../public/xrisk_core.json";

// Browser polyfill — @solana/web3.js PDA derivation needs Buffer
if (!(globalThis as any).Buffer) {
  (globalThis as any).Buffer = Buffer;
}

const PROGRAM_ID = new PublicKey("GH636DTz7fDJgo9zAsk6pB3Xwsrf1mEU8jc4PP6KKA8E");
const RPC_URL =
  import.meta.env.VITE_RPC_URL || "https://devnet.helius-rpc.com/?api-key=6e811dea-28cc-4eab-8f6d-69b88613bf82";

export type MarketStatus = "Open" | "PreMarket" | "PostMarket" | "Closed" | "Weekend";
export type Confidence = "High" | "Medium" | "Low" | "Blind";

export interface RiskStateData {
  mint: string;
  symbol: string;
  name: string;
  score: number;
  marketStatus: MarketStatus;
  confidence: Confidence;
  chainlinkStalenessSecs: number;
  btc1hChangeBps: number;
  impliedMoveLowBps: number;
  impliedMoveHighBps: number;
  transferCount24h: number;
  lastUpdatedTs: number;
}

export const XSTOCK_MINTS: { symbol: string; mint: string; name: string }[] = [
  { symbol: "SPYx",   mint: "XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W", name: "SP500 xStock" },
  { symbol: "QQQx",   mint: "Xs8S1uUs1zvS2p7iwtsG3b6fkhpvmwz4GYU3gWAmWHZ", name: "Nasdaq xStock" },
  { symbol: "AAPLx",  mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp", name: "Apple xStock" },
  { symbol: "TSLAx",  mint: "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB", name: "Tesla xStock" },
  { symbol: "NVDAx",  mint: "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh", name: "NVIDIA xStock" },
  { symbol: "MSFTx",  mint: "XspzcW1PRtgf6Wj92HCiZdjzKCyFekVD8P5Ueh3dRMX", name: "Microsoft xStock" },
  { symbol: "METAx",  mint: "Xsa62P5mvPszXL1krVUnU5ar38bBSVcWAB6fmPCo5Zu", name: "Meta xStock" },
  { symbol: "GOOGLx", mint: "XsCPL9dNWBMvFtTmwcCA5v3xWPSMEBCszbQdiLLq6aN", name: "Alphabet xStock" },
  { symbol: "AMZNx",  mint: "Xs3eBt7uRfJX8QUs4suhyU8p2M6DoUDrJyWBa8LLZsg", name: "Amazon xStock" },
  { symbol: "MSTRx",  mint: "XsP7xzNPvEHS1m6qfanPUGjNmdnmsLKEoNAnHjdxxyZ", name: "MicroStrategy xStock" },
  { symbol: "COINx",  mint: "Xs7ZdzSHLU9ftNJsii5fCeJhoRWSC32SQGzGQtePxNu", name: "Coinbase xStock" },
  { symbol: "PLTRx",  mint: "XsoBhf2ufR8fTyNSjqfU71DYGaE6Z3SUGAidpzriAA4", name: "Palantir xStock" },
  { symbol: "GMEx",   mint: "Xsf9mBktVB9BSU5kf4nHxPq5hCBJ2j2ui3ecFGxPRGc", name: "GameStop xStock" },
  { symbol: "MCDx",   mint: "XsqE9cRRpzxcGKDXj1BJ7Xmg4GRhZoyY1KpmGSxAWT2", name: "McDonald's xStock" },
  { symbol: "GLDx",   mint: "Xsv9hRk1z5ystj9MhnA7Lq4vjSsLwzL2nxrwmwtD3re", name: "Gold xStock" },
];

export const MINT_TO_SYMBOL: Record<string, string> = Object.fromEntries(
  XSTOCK_MINTS.map((m) => [m.mint, m.symbol])
);

export const MINT_TO_NAME: Record<string, string> = Object.fromEntries(
  XSTOCK_MINTS.map((m) => [m.mint, m.name])
);

export const PROGRAM_ID_STR = "GH636DTz7fDJgo9zAsk6pB3Xwsrf1mEU8jc4PP6KKA8E";

let program: anchor.Program | null = null;

export function getProgram(): anchor.Program {
  if (program) return program;
  const connection = new Connection(RPC_URL, "confirmed");
  const wallet = {
    publicKey: PublicKey.default,
    signTransaction: async (tx: any) => tx,
    signAllTransactions: async (txs: any[]) => txs,
  };
  const provider = new anchor.AnchorProvider(connection, wallet as any, {
    commitment: "confirmed",
  });
  program = new anchor.Program(idl as any, provider);
  return program;
}

export async function getRiskState(
  mintAddress: string,
  symbol: string
): Promise<RiskStateData | null> {
  try {
    const mint = new PublicKey(mintAddress);
    const prog = getProgram();
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("risk_state"), mint.toBuffer()],
      PROGRAM_ID
    );
    const account = await (prog.account as any).riskState.fetch(pda);
    return {
      mint: mintAddress,
      symbol,
      name: MINT_TO_NAME[mintAddress] ?? symbol,
      score: account.score,
      marketStatus: parseMarketStatus(account.marketStatus),
      confidence: parseConfidence(account.confidence),
      chainlinkStalenessSecs: account.chainlinkStalenessSecs.toNumber(),
      // Anchor camelCases digit-adjacent fields: btc1hChangeBps -> btc1HChangeBps
      btc1hChangeBps: account.btc1HChangeBps ?? account.btc1hChangeBps ?? 0,
      impliedMoveLowBps: account.impliedMoveLowBps,
      impliedMoveHighBps: account.impliedMoveHighBps,
      transferCount24h: (account.transferCount24H ?? account.transferCount24h).toNumber(),
      lastUpdatedTs: account.lastUpdatedTs.toNumber(),
    };
  } catch (err) {
    console.error(`[xrisk] getRiskState failed for ${symbol}:`, err);
    return null;
  }
}

export async function getAllRiskStates(): Promise<RiskStateData[]> {
  const results = await Promise.allSettled(
    XSTOCK_MINTS.map(({ symbol, mint }) => getRiskState(mint, symbol))
  );
  return results
    .filter(
      (r): r is PromiseFulfilledResult<RiskStateData> =>
        r.status === "fulfilled" && r.value !== null
    )
    .map((r) => r.value);
}

export function computeAdjustedLTV(score: number, baseLTV = 0.75): number {
  return baseLTV * (1 - (score / 100) * 0.5);
}

export function computeProtectedExposure(
  collateralUSD: number,
  score: number,
  baseLTV = 0.75
): number {
  return collateralUSD * (baseLTV - computeAdjustedLTV(score, baseLTV));
}

export function scoreToColor(score: number): string {
  if (score < 25) return "#1DB954";
  if (score < 50) return "#F5A623";
  if (score < 75) return "#E05C2C";
  return "#C0392B";
}

export function formatStaleness(secs: number): string {
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.round(secs / 60)}m`;
  if (secs < 86400) return `${Math.round(secs / 3600)}h`;
  return `${Math.round(secs / 86400)}d`;
}

function parseMarketStatus(raw: object): MarketStatus {
  if ("open" in raw) return "Open";
  if ("preMarket" in raw) return "PreMarket";
  if ("postMarket" in raw) return "PostMarket";
  if ("weekend" in raw) return "Weekend";
  return "Closed";
}

function parseConfidence(raw: object): Confidence {
  if ("high" in raw) return "High";
  if ("medium" in raw) return "Medium";
  if ("low" in raw) return "Low";
  return "Blind";
}
