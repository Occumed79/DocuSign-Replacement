import {
  pgTable, text, serial, timestamp, integer, pgEnum, boolean, jsonb
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { casesTable } from "./cases";

export const sigRequestStatusEnum = pgEnum("sig_request_status", [
  "draft", "pending", "partially_signed", "completed", "voided", "expired"
]);

export const sigRecipientStatusEnum = pgEnum("sig_recipient_status", [
  "pending", "viewed", "signed", "declined"
]);

export const sigFieldTypeEnum = pgEnum("sig_field_type", [
  "signature", "initials", "full_name", "date", "text", "checkbox"
]);

// Reusable document templates
export const signatureTemplatesTable = pgTable("signature_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull().default("general"),
  content: text("content").notNull(), // HTML/rich text of the document body
  fields: jsonb("fields").notNull().default([]), // legacy field definitions
  formSchema: jsonb("form_schema").notNull().default([]), // interactive form fields with conditional logic
  createdById: integer("created_by_id").references(() => usersTable.id),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

// A specific document sent for signature
export const signatureRequestsTable = pgTable("signature_requests", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  message: text("message"),
  templateId: integer("template_id").references(() => signatureTemplatesTable.id),
  caseId: integer("case_id").references(() => casesTable.id),
  documentContent: text("document_content").notNull(), // snapshot of document at time of send
  documentHash: text("document_hash").notNull(), // SHA-256 of document content for tamper detection
  formSchema: jsonb("form_schema").notNull().default([]), // snapshot of form fields at time of send
  status: sigRequestStatusEnum("status").notNull().default("draft"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdById: integer("created_by_id").references(() => usersTable.id),
  voidedAt: timestamp("voided_at", { withTimezone: true }),
  voidReason: text("void_reason"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

// Each person who needs to sign
export const signatureRecipientsTable = pgTable("signature_recipients", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => signatureRequestsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("signer"), // signer, witness, approver
  order: integer("order").notNull().default(1), // signing order
  token: text("token").notNull().unique(), // secure 48-byte random token for signing link
  tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }).notNull(),
  status: sigRecipientStatusEnum("status").notNull().default("pending"),
  viewedAt: timestamp("viewed_at", { withTimezone: true }),
  signedAt: timestamp("signed_at", { withTimezone: true }),
  declinedAt: timestamp("declined_at", { withTimezone: true }),
  declineReason: text("decline_reason"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Actual completed signature data
export const completedSignaturesTable = pgTable("completed_signatures", {
  id: serial("id").primaryKey(),
  recipientId: integer("recipient_id").notNull().references(() => signatureRecipientsTable.id, { onDelete: "cascade" }),
  requestId: integer("request_id").notNull().references(() => signatureRequestsTable.id, { onDelete: "cascade" }),
  signatureType: text("signature_type").notNull(), // "drawn" | "typed"
  signatureData: text("signature_data").notNull(), // base64 PNG for drawn, typed name for typed
  fullName: text("full_name").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  documentHash: text("document_hash").notNull(), // SHA-256 of document at time of signing
  signatureHash: text("signature_hash").notNull(), // SHA-256 of signature data
  signedAt: timestamp("signed_at", { withTimezone: true }).notNull().defaultNow(),
});

// Form responses — each recipient's filled-in answers
export const formResponsesTable = pgTable("form_responses", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => signatureRequestsTable.id, { onDelete: "cascade" }),
  recipientId: integer("recipient_id").notNull().references(() => signatureRecipientsTable.id, { onDelete: "cascade" }),
  responses: jsonb("responses").notNull().default([]), // [{ fieldId, label, value }]
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SignatureTemplate = typeof signatureTemplatesTable.$inferSelect;
export type SignatureRequest = typeof signatureRequestsTable.$inferSelect;
export type SignatureRecipient = typeof signatureRecipientsTable.$inferSelect;
export type CompletedSignature = typeof completedSignaturesTable.$inferSelect;
export type FormResponse = typeof formResponsesTable.$inferSelect;
