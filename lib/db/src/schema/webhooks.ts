import { pgTable, text, serial, timestamp, integer, boolean, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const webhookEventTypeEnum = pgEnum("webhook_event_type", [
  "packet.completed",
  "packet.voided",
  "packet.sent",
  "recipient.signed",
  "recipient.declined",
  "case.submitted",
]);

export const webhookDeliveryStatusEnum = pgEnum("webhook_delivery_status", [
  "pending",
  "delivered",
  "failed",
  "retrying",
]);

// Registered webhook endpoints
export const webhooksTable = pgTable("webhooks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  secret: text("secret").notNull(), // HMAC-SHA256 signing secret
  events: jsonb("events").notNull().default([]), // array of webhookEventTypeEnum values
  isActive: boolean("is_active").notNull().default(true),
  createdById: integer("created_by_id").references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

// Delivery log for each webhook event fired
export const webhookDeliveriesTable = pgTable("webhook_deliveries", {
  id: serial("id").primaryKey(),
  webhookId: integer("webhook_id").notNull().references(() => webhooksTable.id, { onDelete: "cascade" }),
  eventType: webhookEventTypeEnum("event_type").notNull(),
  payload: jsonb("payload").notNull(),
  status: webhookDeliveryStatusEnum("status").notNull().default("pending"),
  httpStatus: integer("http_status"),
  responseBody: text("response_body"),
  attemptCount: integer("attempt_count").notNull().default(0),
  nextRetryAt: timestamp("next_retry_at", { withTimezone: true }),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Webhook = typeof webhooksTable.$inferSelect;
export type WebhookDelivery = typeof webhookDeliveriesTable.$inferSelect;
