import { Connection, PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { Buffer } from "buffer";

if (!(globalThis as any).Buffer) {
  (globalThis as any).Buffer = Buffer;
}

export const PROGRAM_ID = new PublicKey("GH636DTz7fDJgo9zAsk6pB3Xwsrf1mEU8jc4PP6KKA8E");
export const RPC_URL =
  import.meta.env.VITE_RPC_URL || "https://devnet.helius-rpc.com/?api-key=6e811dea-28cc-4eab-8f6d-69b88613bf82";

let cachedIdl: any = null;

export async function loadIdl(): Promise<any> {
  if (cachedIdl) return cachedIdl;
  const res = await fetch("/xrisk_core.json");
  if (!res.ok) throw new Error("Failed to load IDL");
  cachedIdl = await res.json();
  return cachedIdl;
}

// Read-only program (no wallet) for public data reads
export async function getReadonlyProgram(): Promise<anchor.Program> {
  const idl = await loadIdl();
  const connection = new Connection(RPC_URL, "confirmed");
  const provider = new anchor.AnchorProvider(
    connection,
    {
      publicKey: PublicKey.default,
      signTransaction: async (tx: any) => tx,
      signAllTransactions: async (txs: any[]) => txs,
    } as any,
    { commitment: "confirmed" }
  );
  return new anchor.Program(idl, provider);
}

export function decodeUsername(bytes: number[] | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const end = arr.indexOf(0);
  return new TextDecoder().decode(arr.slice(0, end === -1 ? 32 : end));
}

export function encodeUsername(username: string): number[] {
  const bytes = new TextEncoder().encode(username);
  const padded = new Uint8Array(32);
  padded.set(bytes.slice(0, 32));
  return Array.from(padded);
}
