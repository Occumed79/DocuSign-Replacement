import { pgTable, text, serial, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { examTypesTable } from "./exam-types";
import { usersTable } from "./users";

export const caseStatusEnum = pgEnum("case_status", ["draft", "in_progress", "complete", "submitted"]);

export const casesTable = pgTable("cases", {
  id: serial("id").primaryKey(),
  patientName: text("patient_name").notNull(),
  patientDob: text("patient_dob"),
  examTypeId: integer("exam_type_id").notNull().references(() => examTypesTable.id),
  status: caseStatusEnum("status").notNull().default("draft"),
  completionPercent: integer("completion_percent").notNull().default(0),
  createdById: integer("created_by_id").references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCaseSchema = createInsertSchema(casesTable).omit({ id: true, createdAt: true, updatedAt: true, completionPercent: true });
export type InsertCase = z.infer<typeof insertCaseSchema>;
export type Case = typeof casesTable.$inferSelect;
