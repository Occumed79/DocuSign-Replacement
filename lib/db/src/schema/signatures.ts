import {
  pgTable, text, serial, timestamp, integer, pgEnum, boolean, jsonb, uniqueIndex
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
  documentContent: text("document_content").notNull(), // legacy/plaintext snapshot retained for backward-compatible migration
  encryptedDocumentContent: jsonb("encrypted_document_content"), // AES-256-GCM encrypted document snapshot
  wrappedDocumentKey: jsonb("wrapped_document_key"), // encrypted per-request data key
  encryptionKeyId: text("encryption_key_id"),
  documentHash: text("document_hash").notNull(), // SHA-256 of plaintext document content for tamper detection
  formSchema: jsonb("form_schema").notNull().default([]), // snapshot of form fields at time of send
  encryptedFormSchema: jsonb("encrypted_form_schema"),
  wrappedFormSchemaKey: jsonb("wrapped_form_schema_key"),
  status: sigRequestStatusEnum("status").notNull().default("draft"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdById: integer("created_by_id").references(() => usersTable.id),
  voidedAt: timestamp("voided_at", { withTimezone: true }),
  voidReason: text("void_reason"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  finalEvidenceHash: text("final_evidence_hash"), // SHA-256 hash of the executed evidence bundle
  finalPdfHash: text("final_pdf_hash"), // reserved for stored finalized PDF artifact hash
  finalPdfStoragePath: text("final_pdf_storage_path"), // reserved for durable PDF storage path
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
  token: text("token"), // legacy plaintext token column kept temporarily for backward-compatible migration
  tokenHash: text("token_hash").unique(), // SHA-256 of secure 48-byte random token for signing link
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
  signatureData: text("signature_data").notNull(), // legacy/plaintext base64 PNG or typed name retained for migration
  encryptedSignatureData: jsonb("encrypted_signature_data"),
  wrappedSignatureKey: jsonb("wrapped_signature_key"),
  fullName: text("full_name").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  documentHash: text("document_hash").notNull(), // SHA-256 of document at time of signing
  signatureHash: text("signature_hash").notNull(), // legacy/simple signature hash
  evidenceHash: text("evidence_hash"), // canonical SHA-256 hash of full signing evidence payload
  evidencePayload: jsonb("evidence_payload"), // immutable signing evidence payload used to produce evidenceHash
  encryptedEvidencePayload: jsonb("encrypted_evidence_payload"),
  wrappedEvidenceKey: jsonb("wrapped_evidence_key"),
  electronicRecordConsent: boolean("electronic_record_consent").notNull().default(false),
  consentText: text("consent_text"),
  signedAt: timestamp("signed_at", { withTimezone: true }).notNull().defaultNow(),
}, table => ({
  uniqueRecipientSignature: uniqueIndex("completed_signatures_recipient_id_unique").on(table.recipientId),
}));

// Form responses — each recipient's filled-in answers
export const formResponsesTable = pgTable("form_responses", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => signatureRequestsTable.id, { onDelete: "cascade" }),
  recipientId: integer("recipient_id").notNull().references(() => signatureRecipientsTable.id, { onDelete: "cascade" }),
  responses: jsonb("responses").notNull().default([]), // legacy/plaintext [{ fieldId, label, value }]
  encryptedResponses: jsonb("encrypted_responses"),
  wrappedResponsesKey: jsonb("wrapped_responses_key"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
}, table => ({
  uniqueRecipientResponses: uniqueIndex("form_responses_request_recipient_unique").on(table.requestId, table.recipientId),
}));

export type SignatureTemplate = typeof signatureTemplatesTable.$inferSelect;
export type SignatureRequest = typeof signatureRequestsTable.$inferSelect;
export type SignatureRecipient = typeof signatureRecipientsTable.$inferSelect;
export type CompletedSignature = typeof completedSignaturesTable.$inferSelect;
export type FormResponse = typeof formResponsesTable.$inferSelect;
