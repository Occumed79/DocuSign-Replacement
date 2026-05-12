const REQUIRED_PRODUCTION_ENV = [
  "DATABASE_URL",
  "SESSION_SECRET",
  "DB_ENCRYPTION_KEY",
  "MFA_ENCRYPTION_KEY",
  "BLIND_INDEX_KEY",
] as const;

const PLACEHOLDER_VALUES = new Set([
  "",
  "change-me",
  "change-me-to-a-long-random-string-in-production",
  "your-secret-here",
  "your-domain.com",
]);

function isMissingOrPlaceholder(value: string | undefined): boolean {
  if (value === undefined) return true;
  return PLACEHOLDER_VALUES.has(value.trim());
}

function isValidHexKey(value: string | undefined): boolean {
  return typeof value === "string" && /^[a-fA-F0-9]{64}$/.test(value.trim());
}

export function validateEnvironment(): void {
  const isProduction = process.env.NODE_ENV === "production";

  if (!process.env.PORT) {
    process.env.PORT = "8080";
  }

  if (!isProduction) {
    return;
  }

  const missing = REQUIRED_PRODUCTION_ENV.filter(key => isMissingOrPlaceholder(process.env[key]));

  const invalidKeys: string[] = [];
  for (const key of ["DB_ENCRYPTION_KEY", "MFA_ENCRYPTION_KEY", "BLIND_INDEX_KEY"] as const) {
    if (process.env[key] && !isValidHexKey(process.env[key])) {
      invalidKeys.push(`${key} must be exactly 64 hexadecimal characters`);
    }
  }

  if (missing.length > 0 || invalidKeys.length > 0) {
    const problems = [
      ...missing.map(key => `${key} is required in production`),
      ...invalidKeys,
    ];

    throw new Error(
      [
        "Production environment validation failed.",
        ...problems.map(problem => `- ${problem}`),
        "Generate 64-character encryption keys with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
      ].join("\n"),
    );
  }
}
