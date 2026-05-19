import crypto from "crypto";
import { desc, eq } from "drizzle-orm";
import { db, integrityLedgerTable } from "@workspace/db";

export interface IntegrityLedgerPayload {
  [key: string]: unknown;
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return `{${Object.keys(obj).sort().map(k => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

export function computeLedgerEntryHash(params: {
  requestId: number | null;
  actorUserId: number | null;
  eventType: string;
  eventPayloadHash: string;
  previousEntryHash: string | null;
  createdAt: string;
}) {
  return sha256(canonicalJson({
    version: 1,
    requestId: params.requestId,
    actorUserId: params.actorUserId,
    eventType: params.eventType,
    eventPayloadHash: params.eventPayloadHash,
    previousEntryHash: params.previousEntryHash,
    createdAt: params.createdAt,
  }));
}

export async function appendIntegrityLedgerEvent(params: {
  requestId?: number | null;
  actorUserId?: number | null;
  eventType: string;
  eventPayload: IntegrityLedgerPayload;
}) {
  const requestId = params.requestId ?? null;

  const [previous] = await db
    .select()
    .from(integrityLedgerTable)
    .where(requestId === null
      ? eq(integrityLedgerTable.eventType, params.eventType)
      : eq(integrityLedgerTable.requestId, requestId))
    .orderBy(desc(integrityLedgerTable.createdAt), desc(integrityLedgerTable.id))
    .limit(1);

  const createdAt = new Date();
  const eventPayloadHash = sha256(canonicalJson(params.eventPayload));
  const previousEntryHash = previous?.entryHash ?? null;
  const entryHash = computeLedgerEntryHash({
    requestId,
    actorUserId: params.actorUserId ?? null,
    eventType: params.eventType,
    eventPayloadHash,
    previousEntryHash,
    createdAt: createdAt.toISOString(),
  });

  const [entry] = await db.insert(integrityLedgerTable).values({
    requestId,
    actorUserId: params.actorUserId ?? null,
    eventType: params.eventType,
    eventPayload: params.eventPayload,
    eventPayloadHash,
    previousEntryHash,
    entryHash,
    createdAt,
  }).returning();

  return entry;
}

export async function verifyIntegrityLedgerChain(requestId: number) {
  const entries = await db
    .select()
    .from(integrityLedgerTable)
    .where(eq(integrityLedgerTable.requestId, requestId))
    .orderBy(integrityLedgerTable.createdAt, integrityLedgerTable.id);

  let expectedPreviousHash: string | null = null;
  const results = entries.map(entry => {
    const recomputedPayloadHash = sha256(canonicalJson(entry.eventPayload));
    const recomputedEntryHash = computeLedgerEntryHash({
      requestId: entry.requestId,
      actorUserId: entry.actorUserId,
      eventType: entry.eventType,
      eventPayloadHash: entry.eventPayloadHash,
      previousEntryHash: entry.previousEntryHash,
      createdAt: entry.createdAt.toISOString(),
    });

    const payloadHashValid = entry.eventPayloadHash === recomputedPayloadHash;
    const entryHashValid = entry.entryHash === recomputedEntryHash;
    const previousEntryHashValid = entry.previousEntryHash === expectedPreviousHash;
    const valid = payloadHashValid && entryHashValid && previousEntryHashValid;

    expectedPreviousHash = entry.entryHash;

    return {
      id: entry.id,
      eventType: entry.eventType,
      valid,
      payloadHashValid,
      entryHashValid,
      previousEntryHashValid,
      storedPayloadHash: entry.eventPayloadHash,
      recomputedPayloadHash,
      storedEntryHash: entry.entryHash,
      recomputedEntryHash,
      previousEntryHash: entry.previousEntryHash,
      createdAt: entry.createdAt,
    };
  });

  return {
    requestId,
    valid: results.every(r => r.valid),
    headHash: entries.at(-1)?.entryHash ?? null,
    entries: results,
  };
}
