import { pgTable, text, serial, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { signatureTemplatesTable } from "./signatures";

// Immutable version snapshots of signature templates
export const templateVersionsTable = pgTable("template_versions", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull().references(() => signatureTemplatesTable.id, { onDelete: "cascade" }),
  version: integer("version").notNull(), // monotonically increasing per templateId
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  content: text("content").notNull(),
  formSchema: jsonb("form_schema").notNull().default([]),
  changeNote: text("change_note"), // optional description of what changed
  createdById: integer("created_by_id").references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type TemplateVersion = typeof templateVersionsTable.$inferSelect;
