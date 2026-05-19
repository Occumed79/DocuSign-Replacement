import { pgTable, serial, integer, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { signatureRequestsTable } from "./signatures";

export const integrityLedgerTable = pgTable("integrity_ledger", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").references(() => signatureRequestsTable.id, { onDelete: "cascade" }),
  actorUserId: integer("actor_user_id").references(() => usersTable.id),
  eventType: text("event_type").notNull(),
  eventPayload: jsonb("event_payload").notNull().default({}),
  eventPayloadHash: text("event_payload_hash").notNull(),
  previousEntryHash: text("previous_entry_hash"),
  entryHash: text("entry_hash").notNull().unique(),
  algorithm: text("algorithm").notNull().default("SHA-256"),
  canonicalization: text("canonicalization").notNull().default("stable-json-recursive-key-sort-v1"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, table => ({
  requestIdx: index("integrity_ledger_request_id_idx").on(table.requestId),
  eventTypeIdx: index("integrity_ledger_event_type_idx").on(table.eventType),
  createdAtIdx: index("integrity_ledger_created_at_idx").on(table.createdAt),
}));

export type IntegrityLedgerEntry = typeof integrityLedgerTable.$inferSelect;
