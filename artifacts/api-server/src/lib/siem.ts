import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db, securityOperationsEventsTable, siemDeliveriesTable } from "@workspace/db";
import { logger } from "./logger";

export type SecuritySeverity = "low" | "medium" | "high" | "critical";

export interface SecurityEvent {
  eventId?: string;
  type: string;
  category?: string;
  severity: SecuritySeverity;
  timestamp?: string;
  requestId?: number | null;
  userId?: number | null;
  ipAddress?: string | null;
  correlationId?: string | null;
  details?: Record<string, unknown>;
}

function getWebhookTargets(): string[] {
  return process.env.SIEM_WEBHOOK_URLS
    ?.split(",")
    .map(v => v.trim())
    .filter(Boolean) ?? [];
}

function getSigningSecret(): string | null {
  return process.env.SIEM_WEBHOOK_SIGNING_SECRET || null;
}

function sha256(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function hmac(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export function isSiemConfigured(): boolean {
  return getWebhookTargets().length > 0;
}

export function normalizeSecurityEvent(event: SecurityEvent) {
  return {
    eventId: event.eventId ?? crypto.randomUUID(),
    type: event.type,
    category: event.category ?? "security",
    severity: event.severity,
    timestamp: event.timestamp ?? new Date().toISOString(),
    requestId: event.requestId ?? null,
    userId: event.userId ?? null,
    ipAddress: event.ipAddress ?? null,
    correlationId: event.correlationId ?? null,
    details: event.details ?? {},
    source: "packetpath",
    schemaVersion: 1,
  };
}

export async function recordSecurityOperationsEvent(event: SecurityEvent) {
  const normalized = normalizeSecurityEvent(event);

  await db.insert(securityOperationsEventsTable).values({
    eventId: normalized.eventId,
    eventType: normalized.type,
    category: normalized.category,
    severity: normalized.severity,
    requestId: normalized.requestId,
    actorUserId: normalized.userId,
    source: normalized.source,
    correlationId: normalized.correlationId,
    details: normalized.details,
  }).catch(err => {
    logger.error({ err, eventType: normalized.type }, "Failed to record security operations event");
  });

  return normalized;
}

export async function forwardSecurityEvent(event: SecurityEvent): Promise<void> {
  const normalized = await recordSecurityOperationsEvent(event);
  const targets = getWebhookTargets();

  if (targets.length === 0) {
    return;
  }

  const payload = JSON.stringify(normalized);
  const secret = getSigningSecret();
  const signature = secret ? hmac(payload, secret) : null;

  await Promise.allSettled(
    targets.map(async target => {
      const targetUrlHash = sha256(target);
      const [delivery] = await db.insert(siemDeliveriesTable).values({
        eventId: normalized.eventId,
        targetUrlHash,
        status: "pending",
        attempts: 1,
      }).returning().catch(() => [null as any]);

      try {
        const response = await fetch(target, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(signature ? { "X-PacketPath-Signature-SHA256": signature } : {}),
            "X-PacketPath-Event-ID": normalized.eventId,
            "X-PacketPath-Event-Type": normalized.type,
          },
          body: payload,
        });

        if (!response.ok) {
          throw new Error(`SIEM forward failed: ${response.status}`);
        }

        if (delivery?.id) {
          await db.update(siemDeliveriesTable)
            .set({ status: "delivered", httpStatus: response.status, deliveredAt: new Date() })
            .where(eq(siemDeliveriesTable.id, delivery.id));
        }
      } catch (err: any) {
        if (delivery?.id) {
          await db.update(siemDeliveriesTable)
            .set({ status: "failed", lastError: err?.message ?? String(err) })
            .where(eq(siemDeliveriesTable.id, delivery.id));
        }
        logger.error({ err, targetUrlHash, eventType: normalized.type }, "Failed to forward SIEM event");
      }
    }),
  );
}
