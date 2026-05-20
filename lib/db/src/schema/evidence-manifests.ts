import { pgTable, serial, integer, text, timestamp, jsonb, boolean, index } from "drizzle-orm/pg-core";
import { signatureRequestsTable } from "./signatures";
import { usersTable } from "./users";

export const evidenceManifestsTable = pgTable("evidence_manifests", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => signatureRequestsTable.id, { onDelete: "cascade" }),
  manifestId: text("manifest_id").notNull().unique(),
  manifestHash: text("manifest_hash").notNull(),
  manifestVersion: integer("manifest_version").notNull().default(1),
  finalized: boolean("finalized").notNull().default(true),
  generatedById: integer("generated_by_id").references(() => usersTable.id, { onDelete: "set null" }),
  manifest: jsonb("manifest").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, table => ({
  requestIdx: index("evidence_manifest_request_idx").on(table.requestId),
  manifestHashIdx: index("evidence_manifest_hash_idx").on(table.manifestHash),
}));

export const immutableEvidenceEventsTable = pgTable("immutable_evidence_events", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").references(() => signatureRequestsTable.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(),
  targetTable: text("target_table").notNull(),
  targetRecordId: text("target_record_id").notNull(),
  blocked: boolean("blocked").notNull().default(true),
  reason: text("reason"),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, table => ({
  requestIdx: index("immutable_evidence_request_idx").on(table.requestId),
  eventTypeIdx: index("immutable_evidence_event_type_idx").on(table.eventType),
}));

export type EvidenceManifest = typeof evidenceManifestsTable.$inferSelect;
