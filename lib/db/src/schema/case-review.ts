import { index, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { casesTable } from "./cases";
import { usersTable } from "./users";

/** Reviewer-authored case notes and disposition events. */
export const caseReviewActionsTable = pgTable("case_review_actions", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull().references(() => casesTable.id, { onDelete: "cascade" }),
  reviewerId: integer("reviewer_id").references(() => usersTable.id),
  action: text("action").notNull(), // note | flag | approved
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, table => ({
  caseCreatedIdx: index("case_review_actions_case_created_idx").on(table.caseId, table.createdAt),
}));

export type CaseReviewAction = typeof caseReviewActionsTable.$inferSelect;
