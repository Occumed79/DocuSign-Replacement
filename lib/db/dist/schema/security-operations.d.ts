import { PgTableWithColumns } from 'drizzle-orm/pg-core';
export declare const securityOperationsEventsTable: PgTableWithColumns<any>;
export declare const siemDeliveriesTable: PgTableWithColumns<any>;
export type SecurityOperationsEvent = typeof securityOperationsEventsTable.$inferSelect;
export type SiemDelivery = typeof siemDeliveriesTable.$inferSelect;
