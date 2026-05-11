import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

// TOTP MFA secrets per user
export const mfaSecretsTable = pgTable("mfa_secrets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => usersTable.id, { onDelete: "cascade" }),
  secret: text("secret").notNull(), // base32-encoded TOTP secret (AES-256 encrypted at rest)
  isEnabled: boolean("is_enabled").notNull().default(false),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

// Backup codes for MFA recovery (each code is single-use)
export const mfaBackupCodesTable = pgTable("mfa_backup_codes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  codeHash: text("code_hash").notNull(), // SHA-256 of the backup code
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Pending MFA challenges — issued after password is verified, before TOTP is verified
export const mfaChallengesTable = pgTable("mfa_challenges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  challengeToken: text("challenge_token").notNull().unique(), // 32-byte random token
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type MfaSecret = typeof mfaSecretsTable.$inferSelect;
export type MfaBackupCode = typeof mfaBackupCodesTable.$inferSelect;
export type MfaChallenge = typeof mfaChallengesTable.$inferSelect;
