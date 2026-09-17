export type Confidence = "HIGH" | "MEDIUM" | "LOW" | "BLIND";
export type MarketStatus = "OPEN" | "CLOSED" | "WEEKEND";

export type MintRisk = {
  symbol: string;
  name: string;
  score: number;
  confidence: Confidence;
  status: MarketStatus;
  band: string;
  oracleAge: string;
  oracleMinutes: number;
  price: string;
  change: string;
  transferCount: number;
  btcChange: string;
};

export const trackedMints: MintRisk[] = [
  { symbol: "AAPLx", name: "Apple Inc.", score: 87, confidence: "BLIND", status: "WEEKEND", band: "-3.2% to +1.1%", oracleAge: "9h 43m", oracleMinutes: 583, price: "$214.12", change: "+0.84%", transferCount: 1842, btcChange: "-2.8%" },
  { symbol: "NVDAx", name: "NVIDIA Corp.", score: 76, confidence: "LOW", status: "WEEKEND", band: "-4.8% to +2.4%", oracleAge: "9h 41m", oracleMinutes: 581, price: "$138.21", change: "-1.21%", transferCount: 1268, btcChange: "-2.8%" },
  { symbol: "TSLAx", name: "Tesla Inc.", score: 62, confidence: "MEDIUM", status: "CLOSED", band: "-2.1% to +2.8%", oracleAge: "3h 14m", oracleMinutes: 194, price: "$336.04", change: "+1.48%", transferCount: 938, btcChange: "-1.4%" },
  { symbol: "AMZNx", name: "Amazon.com Inc.", score: 41, confidence: "HIGH", status: "OPEN", band: "-1.2% to +1.4%", oracleAge: "34s", oracleMinutes: 1, price: "$227.91", change: "+0.22%", transferCount: 721, btcChange: "+0.3%" },
  { symbol: "MSFTx", name: "Microsoft Corp.", score: 28, confidence: "HIGH", status: "OPEN", band: "-0.8% to +1.0%", oracleAge: "28s", oracleMinutes: 1, price: "$509.32", change: "+0.61%", transferCount: 504, btcChange: "+0.3%" },
  { symbol: "COINx", name: "Coinbase Global", score: 91, confidence: "BLIND", status: "WEEKEND", band: "-7.4% to +5.8%", oracleAge: "10h 02m", oracleMinutes: 602, price: "$312.08", change: "-3.42%", transferCount: 2291, btcChange: "-4.7%" },
];

export type RiskEvent = { id: string; timestamp: string; symbol: string; amount: string; score: number; confidence: Confidence; kind: string };
export const riskEvents: RiskEvent[] = [
  { id: "evt-1", timestamp: "02:14:36", symbol: "AAPLx", amount: "$48,290", score: 87, confidence: "BLIND", kind: "TRANSFER" },
  { id: "evt-2", timestamp: "02:13:51", symbol: "COINx", amount: "$112,804", score: 91, confidence: "BLIND", kind: "TRANSFER" },
  { id: "evt-3", timestamp: "02:12:09", symbol: "NVDAx", amount: "$18,442", score: 76, confidence: "LOW", kind: "TRANSFER" },
  { id: "evt-4", timestamp: "02:08:42", symbol: "AMZNx", amount: "$9,210", score: 41, confidence: "HIGH", kind: "TRANSFER" },
  { id: "evt-5", timestamp: "02:06:18", symbol: "TSLAx", amount: "$33,901", score: 62, confidence: "MEDIUM", kind: "TRANSFER" },
  { id: "evt-6", timestamp: "01:58:03", symbol: "AAPLx", amount: "$6,705", score: 85, confidence: "BLIND", kind: "TRANSFER" },
  { id: "evt-7", timestamp: "01:51:28", symbol: "MSFTx", amount: "$14,008", score: 28, confidence: "HIGH", kind: "TRANSFER" },
];

export type Panic = { timestamp: string; affected: number; trigger: string; severity: number; symbols: string[] };
export const panicHistory: Panic[] = [
  { timestamp: "2026-09-16 02:14:36 UTC", affected: 3, trigger: "CHAINLINK_STALE", severity: 91, symbols: ["AAPLx", "NVDAx", "COINx"] },
  { timestamp: "2026-09-14 18:42:09 UTC", affected: 2, trigger: "BTC_DUMP", severity: 84, symbols: ["COINx", "TSLAx"] },
  { timestamp: "2026-09-11 09:18:55 UTC", affected: 5, trigger: "MACRO_SHOCK", severity: 78, symbols: ["AAPLx", "NVDAx", "TSLAx", "AMZNx", "COINx"] },
  { timestamp: "2026-09-04 21:06:12 UTC", affected: 1, trigger: "CHAINLINK_STALE", severity: 76, symbols: ["NVDAx"] },
];

export const riskHistory = [64, 58, 61, 55, 49, 52, 57, 63, 60, 68, 71, 66, 74, 79, 75, 82, 87, 84, 88, 87, 91, 86, 87, 87];

export const dashboardStats = { tracked: trackedMints.length, elevated: trackedMints.filter((mint) => mint.score > 75).length, protected: "$18.4M", lastBlock: "287,419,882" };
