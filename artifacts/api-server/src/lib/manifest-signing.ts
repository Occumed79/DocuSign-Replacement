import crypto from "crypto";

export interface SignedManifestResult {
  signature: string;
  algorithm: string;
}

export function signManifest(
  manifestHash: string,
  signingSecret: string,
): SignedManifestResult {
  const signature = crypto
    .createHmac("sha256", signingSecret)
    .update(manifestHash)
    .digest("hex");

  return {
    signature,
    algorithm: "HMAC-SHA256",
  };
}

export function verifyManifestSignature(
  manifestHash: string,
  signature: string,
  signingSecret: string,
): boolean {
  const expected = signManifest(manifestHash, signingSecret);
  return crypto.timingSafeEqual(
    Buffer.from(expected.signature, "hex"),
    Buffer.from(signature, "hex"),
  );
}
