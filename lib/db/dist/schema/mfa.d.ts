import { PgTableWithColumns } from 'drizzle-orm/pg-core';
export declare const mfaSecretsTable: PgTableWithColumns<any>;
export declare const mfaBackupCodesTable: PgTableWithColumns<any>;
export declare const mfaChallengesTable: PgTableWithColumns<any>;
export type MfaSecret = typeof mfaSecretsTable.$inferSelect;
export type MfaBackupCode = typeof mfaBackupCodesTable.$inferSelect;
export type MfaChallenge = typeof mfaChallengesTable.$inferSelect;
