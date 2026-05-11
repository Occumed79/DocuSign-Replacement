import { pgTable, text, serial, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { signatureRequestsTable } from "./signatures";

// Saved in-progress form responses for patients who haven't completed signing yet
export const formProgressTable = pgTable("form_progress", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => signatureRequestsTable.id, { onDelete: "cascade" }),
  recipientToken: text("recipient_token").notNull().unique(), // matches signatureRecipientsTable.token
  partialResponses: jsonb("partial_responses").notNull().default([]),
  currentStep: text("current_step").notNull().default("document"), // document | form | sign
  currentFieldIndex: integer("current_field_index").notNull().default(0),
  saveToken: text("save_token").notNull().unique(), // 32-byte random token for resume link
  saveTokenExpiresAt: timestamp("save_token_expires_at", { withTimezone: true }).notNull(),
  emailSentAt: timestamp("email_sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type FormProgress = typeof formProgressTable.$inferSelect;
