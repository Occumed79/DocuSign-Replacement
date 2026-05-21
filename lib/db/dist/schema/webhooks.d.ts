import { PgTableWithColumns, PgEnum } from 'drizzle-orm/pg-core';
export declare const webhookEventTypeEnum: PgEnum<any>;
export declare const webhookDeliveryStatusEnum: PgEnum<any>;
export declare const webhooksTable: PgTableWithColumns<any>;
export declare const webhookDeliveriesTable: PgTableWithColumns<any>;
export type Webhook = typeof webhooksTable.$inferSelect;
export type WebhookDelivery = typeof webhookDeliveriesTable.$inferSelect;
