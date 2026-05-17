import crypto from "crypto";

export interface IntegrityChainEntry {
  timestamp: string;
  requestId: number;
  eventType: string;
  manifestHash?: string;
  evidenceHash?: string;
  previousHash?: string | null;
}

function sha256(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

export function computeIntegrityEntryHash(entry: IntegrityChainEntry): string {
  return sha256(JSON.stringify(entry));
}

export function buildIntegrityChainEntry(
  entry: IntegrityChainEntry,
  previousHash?: string | null,
) {
  const chained = {
    ...entry,
    previousHash: previousHash ?? null,
  };

  return {
    entry: chained,
    entryHash: computeIntegrityEntryHash(chained),
  };
}
