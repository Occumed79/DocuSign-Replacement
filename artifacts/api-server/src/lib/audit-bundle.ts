import crypto from "crypto";

export interface AuditBundleInput {
  request: Record<string, unknown>;
  recipients: Record<string, unknown>[];
  signatures: Record<string, unknown>[];
  formResponses: Record<string, unknown>[];
  auditEvents: Record<string, unknown>[];
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

export function buildAuditEvidenceBundle(input: AuditBundleInput) {
  const generatedAt = new Date().toISOString();
  const bundle = {
    version: 1,
    generatedAt,
    request: input.request,
    recipients: input.recipients,
    signatures: input.signatures,
    formResponses: input.formResponses,
    auditEvents: input.auditEvents,
  };

  const canonical = canonicalJson(bundle);
  const bundleHash = sha256(canonical);

  return {
    bundle,
    bundleHash,
    algorithm: "SHA-256",
    canonicalization: "stable-json-recursive-key-sort-v1",
  };
}
