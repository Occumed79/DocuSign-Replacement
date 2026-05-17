import crypto from "crypto";

export interface SecurityManifestInput {
  requestId: number;
  documentHash: string;
  finalPdfHash?: string | null;
  finalEvidenceHash?: string | null;
  signerEvidenceHashes: string[];
  generatedAt?: string;
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return `{${Object.keys(obj).sort().map(k => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

export function buildSecurityManifest(input: SecurityManifestInput) {
  const manifest = {
    version: 1,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    requestId: input.requestId,
    documentHash: input.documentHash,
    finalPdfHash: input.finalPdfHash ?? null,
    finalEvidenceHash: input.finalEvidenceHash ?? null,
    signerEvidenceHashes: [...input.signerEvidenceHashes].filter(Boolean).sort(),
  };

  const canonical = canonicalJson(manifest);
  const manifestHash = sha256(canonical);

  return {
    manifest,
    manifestHash,
    algorithm: "SHA-256",
    canonicalization: "stable-json-recursive-key-sort-v1",
  };
}
