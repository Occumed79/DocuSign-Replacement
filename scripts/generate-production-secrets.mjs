#!/usr/bin/env node
/**
 * Generate cryptographically secure production secrets for PacketPath.
 * 
 * This script generates 64-character hexadecimal keys for AES-256-GCM encryption
 * and HMAC operations. These keys must be manually set in your production environment.
 * 
 * Usage:
 *   node scripts/generate-production-secrets.mjs
 * 
 * Or using the npm script:
 *   pnpm run generate-secrets
 */

import crypto from "crypto";

function generateHexKey() {
  return crypto.randomBytes(32).toString("hex");
}

function generateSessionSecret() {
  // Session secret can be any cryptographically random string
  // Using 64 hex chars for consistency with encryption keys
  return generateHexKey();
}

console.log("=== PacketPath Production Secrets ===\n");
console.log("Copy these values to your production environment variables:\n");

console.log("SESSION_SECRET=");
console.log(generateSessionSecret());
console.log();

console.log("DB_ENCRYPTION_KEY=");
console.log(generateHexKey());
console.log();

console.log("MFA_ENCRYPTION_KEY=");
console.log(generateHexKey());
console.log();

console.log("BLIND_INDEX_KEY=");
console.log(generateHexKey());
console.log();

console.log("=== Important Security Notes ===");
console.log("1. Store these secrets securely (e.g., password manager, secrets manager)");
console.log("2. Never commit secrets to version control");
console.log("3. Rotate keys periodically (recommended: annually)");
console.log("4. If a key is compromised, rotate immediately and re-encrypt affected data");
console.log("5. Each deployment should use unique keys");
