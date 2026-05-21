import { PgTableWithColumns } from 'drizzle-orm/pg-core';
export declare const integrityLedgerTable: PgTableWithColumns<any>;
export type IntegrityLedgerEntry = typeof integrityLedgerTable.$inferSelect;
