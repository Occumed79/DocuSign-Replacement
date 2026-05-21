import { PgTableWithColumns } from 'drizzle-orm/pg-core';
export declare const templateVersionsTable: PgTableWithColumns<any>;
export type TemplateVersion = typeof templateVersionsTable.$inferSelect;
