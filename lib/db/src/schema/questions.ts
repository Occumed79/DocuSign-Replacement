import { pgTable, text, serial, timestamp, integer, boolean, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const answerTypeEnum = pgEnum("answer_type", ["text", "yes_no", "dropdown", "date", "number", "multi_select"]);

export const questionsTable = pgTable("questions", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  answerType: answerTypeEnum("answer_type").notNull().default("text"),
  required: boolean("required").notNull().default(true),
  section: text("section").notNull().default("General"),
  orderIndex: integer("order_index").notNull().default(0),
  examTypeIds: jsonb("exam_type_ids").notNull().default([]).$type<number[]>(),
  options: jsonb("options").notNull().default([]).$type<string[]>(),
  triggerValue: text("trigger_value"),
  followUpIds: jsonb("follow_up_ids").notNull().default([]).$type<number[]>(),
  helpText: text("help_text"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertQuestionSchema = createInsertSchema(questionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questionsTable.$inferSelect;
