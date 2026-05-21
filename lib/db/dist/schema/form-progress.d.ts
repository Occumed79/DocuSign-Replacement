import { PgTableWithColumns } from 'drizzle-orm/pg-core';
export declare const formProgressTable: PgTableWithColumns<any>;
export type FormProgress = typeof formProgressTable.$inferSelect;
