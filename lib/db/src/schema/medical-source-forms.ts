import { boolean, index, integer, jsonb, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { examTypesTable } from "./exam-types";
import { usersTable } from "./users";

export type MedicalSourceFieldMap = Record<string, unknown>;

/**
 * Exact source PDF + a separately validated sourceKey -> PDF mapping.
 *
 * Source PDFs are uploaded at runtime and are never source-controlled. A source
 * can become renderable only after its SHA-256 matches the registry fingerprint
 * and its mapping has been validated against the uploaded PDF.
 */
export const medicalSourceFormsTable = pgTable("medical_source_forms", {
  id: serial("id").primaryKey(),
  examTypeId: integer("exam_type_id").notNull().references(() => examTypesTable.id, { onDelete: "cascade" }),
  sourceFamily: text("source_family").notNull(),
  sourceSha256: text("source_sha256").notNull(),
  sourceMimeType: text("source_mime_type").notNull().default("application/pdf"),
  sourceFileName: text("source_file_name").notNull(),
  sourceDocumentBase64: text("source_document_base64").notNull(),
  pageCount: integer("page_count").notNull(),
  mappingVersion: integer("mapping_version").notNull().default(1),
  fieldMap: jsonb("field_map").notNull().default({}).$type<MedicalSourceFieldMap>(),
  mappingValidatedAt: timestamp("mapping_validated_at", { withTimezone: true }),
  mappingValidatedById: integer("mapping_validated_by_id").references(() => usersTable.id),
  uploadedById: integer("uploaded_by_id").references(() => usersTable.id),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, table => ({
  activeExamFamily: uniqueIndex("medical_source_forms_exam_family_unique").on(table.examTypeId, table.sourceFamily),
  examTypeIdx: index("medical_source_forms_exam_type_idx").on(table.examTypeId),
  shaIdx: index("medical_source_forms_sha256_idx").on(table.sourceSha256),
}));

export type MedicalSourceForm = typeof medicalSourceFormsTable.$inferSelect;
