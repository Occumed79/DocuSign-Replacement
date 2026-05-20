import { pgTable, serial, integer, text, timestamp, jsonb, boolean, index } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { signatureRequestsTable } from "./signatures";

export const securityOperationsEventsTable = pgTable("security_operations_events", {
  id: serial("id").primaryKey(),
  eventId: text("event_id").notNull().unique(),
  eventType: text("event_type").notNull(),
  category: text("category").notNull().default("security"),
  severity: text("severity").notNull().default("low"),
  requestId: integer("request_id").references(() => signatureRequestsTable.id, { onDelete: "set null" }),
  actorUserId: integer("actor_user_id").references(() => usersTable.id, { onDelete: "set null" }),
  source: text("source").notNull().default("packetpath"),
  correlationId: text("correlation_id"),
  details: jsonb("details").notNull().default({}),
  acknowledged: boolean("acknowledged").notNull().default(false),
  acknowledgedById: integer("acknowledged_by_id").references(() => usersTable.id, { onDelete: "set null" }),
  acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, table => ({
  eventTypeIdx: index("security_ops_events_event_type_idx").on(table.eventType),
  severityIdx: index("security_ops_events_severity_idx").on(table.severity),
  requestIdx: index("security_ops_events_request_id_idx").on(table.requestId),
  createdAtIdx: index("security_ops_events_created_at_idx").on(table.createdAt),
}));

export const siemDeliveriesTable = pgTable("siem_deliveries", {
  id: serial("id").primaryKey(),
  eventId: text("event_id").notNull(),
  targetUrlHash: text("target_url_hash").notNull(),
  status: text("status").notNull().default("pending"),
  httpStatus: integer("http_status"),
  attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error"),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, table => ({
  eventIdIdx: index("siem_deliveries_event_id_idx").on(table.eventId),
  statusIdx: index("siem_deliveries_status_idx").on(table.status),
}));

export type SecurityOperationsEvent = typeof securityOperationsEventsTable.$inferSelect;
export type SiemDelivery = typeof siemDeliveriesTable.$inferSelect;
