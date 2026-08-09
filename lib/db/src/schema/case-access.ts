import { boolean, index, integer, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { casesTable } from "./cases";
import { usersTable } from "./users";

/**
 * Secure invitation + verification session for a medical-history questionnaire.
 * Raw invitation/session tokens are never persisted; only SHA-256 hashes are stored.
 */
export const caseAccessTokensTable = pgTable("case_access_tokens", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull().references(() => casesTable.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  tokenHash: text("token_hash").notNull(),
  tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }).notNull(),
  verificationSessionHash: text("verification_session_hash"),
  verificationExpiresAt: timestamp("verification_expires_at", { withTimezone: true }),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdById: integer("created_by_id").references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, table => ({
  tokenHashUnique: uniqueIndex("case_access_tokens_token_hash_unique").on(table.tokenHash),
  caseLookup: index("case_access_tokens_case_id_idx").on(table.caseId),
  emailLookup: index("case_access_tokens_email_idx").on(table.email),
}));

export type CaseAccessToken = typeof caseAccessTokensTable.$inferSelect;
