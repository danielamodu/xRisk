import "dotenv/config";
import express from "express";
import { createServer } from "http";
import fs from "fs";
import path from "path";
// (fileURLToPath shim removed: esbuild drops it when bundling to ESM)
import { Connection, PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";

// import.meta.dirname is native in Node 20.11+ (esbuild drops the
// fileURLToPath shim when bundling to ESM, which broke startup)
const __dirname: string = import.meta.dirname;

const PROGRAM_ID = new PublicKey("GH636DTz7fDJgo9zAsk6pB3Xwsrf1mEU8jc4PP6KKA8E");
const RPC_URL =
  process.env.VITE_RPC_URL || "https://devnet.helius-rpc.com/?api-key=6e811dea-28cc-4eab-8f6d-69b88613bf82";

const MINT_TO_SYMBOL: Record<string, string> = {
  "XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W": "SPYx",
  "Xs8S1uUs1zvS2p7iwtsG3b6fkhpvmwz4GYU3gWAmWHZ": "QQQx",
  "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp": "AAPLx",
  "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB": "TSLAx",
  "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh": "NVDAx",
  "XspzcW1PRtgf6Wj92HCiZdjzKCyFekVD8P5Ueh3dRMX": "MSFTx",
  "Xsa62P5mvPszXL1krVUnU5ar38bBSVcWAB6fmPCo5Zu": "METAx",
  "XsCPL9dNWBMvFtTmwcCA5v3xWPSMEBCszbQdiLLq6aN": "GOOGLx",
  "Xs3eBt7uRfJX8QUs4suhyU8p2M6DoUDrJyWBa8LLZsg": "AMZNx",
  "XsP7xzNPvEHS1m6qfanPUGjNmdnmsLKEoNAnHjdxxyZ": "MSTRx",
  "Xs7ZdzSHLU9ftNJsii5fCeJhoRWSC32SQGzGQtePxNu": "COINx",
  "XsoBhf2ufR8fTyNSjqfU71DYGaE6Z3SUGAidpzriAA4": "PLTRx",
  "Xsf9mBktVB9BSU5kf4nHxPq5hCBJ2j2ui3ecFGxPRGc": "GMEx",
  "XsqE9cRRpzxcGKDXj1BJ7Xmg4GRhZoyY1KpmGSxAWT2": "MCDx",
  "Xsv9hRk1z5ystj9MhnA7Lq4vjSsLwzL2nxrwmwtD3re": "GLDx",
};

function parseMarketStatus(raw: object): string {
  if ("open" in raw) return "Open";
  if ("preMarket" in raw) return "PreMarket";
  if ("postMarket" in raw) return "PostMarket";
  if ("weekend" in raw) return "Weekend";
  return "Closed";
}

function parseConfidence(raw: object): string {
  if ("high" in raw) return "High";
  if ("medium" in raw) return "Medium";
  if ("low" in raw) return "Low";
  return "Blind";
}

let program: anchor.Program | null = null;

function getProgram(idlPath: string): anchor.Program {
  if (program) return program;
  const connection = new Connection(RPC_URL, "confirmed");
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
  const provider = new anchor.AnchorProvider(
    connection,
    {
      publicKey: PublicKey.default,
      signTransaction: async (tx: any) => tx,
      signAllTransactions: async (txs: any[]) => txs,
    } as any,
    { commitment: "confirmed" }
  );
  program = new anchor.Program(idl, provider);
  return program;
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  const idlPath = path.join(staticPath, "xrisk_core.json");

  // Panic history — written by the off-chain indexer, served newest-first
  app.get("/api/panics", (_req, res) => {
    try {
      const logPath = path.resolve(process.cwd(), "panic_log.json");
      if (!fs.existsSync(logPath)) return res.json({ panics: [], count: 0 });
      const panics = JSON.parse(fs.readFileSync(logPath, "utf-8"));
      const reversed = [...panics].reverse();
      res.json({ panics: reversed, count: reversed.length, lastChecked: new Date().toISOString() });
    } catch {
      res.json({ panics: [], count: 0, error: "Failed to read panic log" });
    }
  });

  // Protocol API — live risk state for any tracked mint
  app.get("/api/risk/:mint", async (req, res) => {
    const { mint } = req.params;
    let mintPubkey: PublicKey;
    try {
      mintPubkey = new PublicKey(mint);
    } catch {
      return res.status(400).json({ error: "Invalid mint address" });
    }
    try {
      const prog = getProgram(idlPath);
      const [riskStatePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("risk_state"), mintPubkey.toBuffer()],
        PROGRAM_ID
      );
      const account = await (prog.account as any).riskState.fetch(riskStatePda);
      // Anchor camelCases digit-adjacent fields (btc1hChangeBps -> btc1HChangeBps)
      const btc1hChangeBps = account.btc1HChangeBps ?? account.btc1hChangeBps ?? 0;
      const transferCount24h = (account.transferCount24H ?? account.transferCount24h).toNumber();
      const score = account.score as number;
      res.set({ "Cache-Control": "public, max-age=25", "Access-Control-Allow-Origin": "*" });
      return res.json({
        mint,
        symbol: MINT_TO_SYMBOL[mint] ?? null,
        score,
        confidence: parseConfidence(account.confidence),
        marketStatus: parseMarketStatus(account.marketStatus),
        chainlinkStalenessSecs: account.chainlinkStalenessSecs.toNumber(),
        btc1hChangeBps,
        impliedMove: {
          lowBps: account.impliedMoveLowBps,
          highBps: account.impliedMoveHighBps,
          lowPct: (account.impliedMoveLowBps / 100).toFixed(2),
          highPct: (account.impliedMoveHighBps / 100).toFixed(2),
        },
        suggestedLtvAdjustment: {
          baseLtv: 0.75,
          adjustedLtv: parseFloat((0.75 * (1 - (score / 100) * 0.5)).toFixed(4)),
          reductionPct: parseFloat(((score / 100) * 50).toFixed(2)),
        },
        transferCount24h,
        lastUpdatedTs: account.lastUpdatedTs.toNumber(),
        lastUpdatedIso: new Date(account.lastUpdatedTs.toNumber() * 1000).toISOString(),
        programId: PROGRAM_ID.toBase58(),
        network: "devnet",
      });
    } catch {
      return res.status(404).json({ error: "RiskState not found for this mint. Is it tracked by xRisk?" });
    }
  });

  // External headlines (CryptoPanic crypto + NewsAPI equities).
  // Keys live only on the server via CRYPTOPANIC_TOKEN / NEWSAPI_KEY env vars
  // (see .env). 10-minute in-memory cache keeps us inside free-tier quotas.
  // Missing keys simply yield no headlines — panics always work regardless.
  let newsCache: {
    at: number;
    headlines: { title: string; source: string; url: string; publishedAt: string }[];
  } = { at: 0, headlines: [] };
  const NEWS_TTL_MS = 15 * 60 * 1000;

  async function fetchHeadlines() {
    const now = Date.now();
    if (now - newsCache.at < NEWS_TTL_MS) return newsCache.headlines;
    const headlines: { title: string; source: string; url: string; publishedAt: string }[] = [];
    const jobs: Promise<unknown>[] = [];
    if (process.env.CRYPTOPANIC_TOKEN) {
      jobs.push(
        fetch(
          "https://cryptopanic.com/api/v1/posts/?auth_token=" +
            process.env.CRYPTOPANIC_TOKEN +
            "&currencies=BTC,ETH,SOL&filter=hot&kind=news&public=true"
        )
          .then((r) => (r.ok ? r.json() : null))
          .then((j) =>
            ((j?.results ?? []) as any[]).slice(0, 10).map((p: any) => ({
              title: p.title,
              source: "CryptoPanic",
              url: p.url,
              publishedAt: p.published_at,
            }))
          )
          .catch(() => [])
      );
    }
    if (process.env.NEWSAPI_KEY) {
      jobs.push(
        fetch(
          "https://newsapi.org/v2/everything?" +
            "q=(solana OR bitcoin OR ethereum OR crypto OR \"stock market\" OR tokenized)&" +
            "sortBy=publishedAt&language=en&pageSize=30&apiKey=" +
            process.env.NEWSAPI_KEY
        )
          .then((r) => (r.ok ? r.json() : null))
          .then((j) =>
            ((j?.articles ?? []) as any[]).filter((a: any) => {
                const text = a.title ?? "";
                // sports desks write about "transfer markets" and "rates" of play — exclude first
                if (/football|soccer|premier league|champions|la liga|serie a|bundesliga|world cup|\bmatch\b|\bgoal\b|striker|pichichi|ligue|wimbledon|nba|nfl/i.test(text)) return false;
                return /solana|bitcoin|\bbtc\b|ethereum|\beth\b|crypto|tokenized|stock|stocks|nasdaq|etf|defi|\bfed\b|\bsol\b|xstock/i.test(text);
              }).slice(0, 15).map((a: any) => ({
              title: a.title,
              source: a.source?.name ?? "NewsAPI",
              url: a.url,
              publishedAt: a.publishedAt,
            }))
          )
          .catch(() => [])
      );
    }
    if (jobs.length > 0) {
      const lists = (await Promise.all(jobs)) as {
        title: string;
        source: string;
        url: string;
        publishedAt: string;
      }[][];
      for (const list of lists) {
        for (const h of list) {
          if (h.title && h.url) headlines.push(h);
        }
      }
    }
    newsCache = { at: now, headlines };
    return headlines;
  }

  app.get("/api/news", async (_req, res) => {
    try {
      const headlines = await fetchHeadlines();
      res.set({ "Cache-Control": "public, max-age=600", "Access-Control-Allow-Origin": "*" });
      return res.json({
        headlines,
        count: headlines.length,
        sources: [
          ...(process.env.CRYPTOPANIC_TOKEN ? ["cryptopanic"] : []),
          ...(process.env.NEWSAPI_KEY ? ["newsapi"] : []),
        ],
      });
    } catch {
      return res.json({ headlines: [], count: 0, sources: [] });
    }
  });

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
