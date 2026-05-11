/**
 * Webhook delivery system
 * Signs payloads with HMAC-SHA256 and delivers to registered endpoints.
 * Implements exponential backoff retry logic (up to 3 attempts).
 */

import crypto from "crypto";
import { db, webhooksTable, webhookDeliveriesTable } from "@workspace/db";
import { eq, and, lte, lt } from "drizzle-orm";
import { logger } from "./logger.js";

export type WebhookEventType =
  | "packet.completed"
  | "packet.voided"
  | "packet.sent"
  | "recipient.signed"
  | "recipient.declined"
  | "case.submitted";

export interface WebhookPayload {
  event: WebhookEventType;
  timestamp: string;
  data: Record<string, unknown>;
}

/** Build the HMAC-SHA256 signature header for a payload */
function signPayload(secret: string, body: string): string {
  return `sha256=${crypto.createHmac("sha256", secret).update(body).digest("hex")}`;
}

/** Fire a webhook event to all active registered endpoints that subscribe to it */
export async function fireWebhookEvent(
  eventType: WebhookEventType,
  data: Record<string, unknown>
): Promise<void> {
  // Find all active webhooks subscribed to this event
  const hooks = await db
    .select()
    .from(webhooksTable)
    .where(eq(webhooksTable.isActive, true));

  const subscribedHooks = hooks.filter((h) => {
    const events = (h.events as string[]) ?? [];
    return events.includes(eventType) || events.includes("*");
  });

  if (subscribedHooks.length === 0) return;

  const payload: WebhookPayload = {
    event: eventType,
    timestamp: new Date().toISOString(),
    data,
  };
  const body = JSON.stringify(payload);

  for (const hook of subscribedHooks) {
    // Create a delivery record
    const [delivery] = await db
      .insert(webhookDeliveriesTable)
      .values({
        webhookId: hook.id,
        eventType,
        payload,
        status: "pending",
        attemptCount: 0,
      })
      .returning();

    if (!delivery) continue;

    // Attempt delivery immediately (fire-and-forget with error handling)
    deliverWebhook(hook.id, delivery.id, hook.url, hook.secret, body).catch((err) => {
      logger.error({ err, webhookId: hook.id, deliveryId: delivery.id }, "Webhook delivery error");
    });
  }
}

/** Deliver a single webhook payload to a URL */
export async function deliverWebhook(
  webhookId: number,
  deliveryId: number,
  url: string,
  secret: string,
  body: string
): Promise<void> {
  const signature = signPayload(secret, body);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000); // 10s timeout

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-PacketPath-Signature": signature,
        "X-PacketPath-Event": "webhook",
        "User-Agent": "PacketPath-Webhooks/1.0",
      },
      body,
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    const responseText = await response.text().catch(() => "");

    if (response.ok) {
      await db
        .update(webhookDeliveriesTable)
        .set({
          status: "delivered",
          httpStatus: response.status,
          responseBody: responseText.slice(0, 1000),
          deliveredAt: new Date(),
          attemptCount: 1,
        })
        .where(eq(webhookDeliveriesTable.id, deliveryId));
    } else {
      // Schedule retry
      const nextRetry = new Date(Date.now() + 5 * 60 * 1000); // 5 min
      await db
        .update(webhookDeliveriesTable)
        .set({
          status: "retrying",
          httpStatus: response.status,
          responseBody: responseText.slice(0, 1000),
          attemptCount: 1,
          nextRetryAt: nextRetry,
        })
        .where(eq(webhookDeliveriesTable.id, deliveryId));
    }
  } catch (err: any) {
    const nextRetry = new Date(Date.now() + 5 * 60 * 1000);
    await db
      .update(webhookDeliveriesTable)
      .set({
        status: "retrying",
        responseBody: err?.message ?? "Network error",
        attemptCount: 1,
        nextRetryAt: nextRetry,
      })
      .where(eq(webhookDeliveriesTable.id, deliveryId));
  }
}

/** Process pending retries (call this from a periodic job or on startup) */
export async function processWebhookRetries(): Promise<void> {
  const now = new Date();
  const pending = await db
    .select()
    .from(webhookDeliveriesTable)
    .where(
      and(
        eq(webhookDeliveriesTable.status, "retrying"),
        lte(webhookDeliveriesTable.nextRetryAt, now),
        lt(webhookDeliveriesTable.attemptCount, 3)
      )
    );

  for (const delivery of pending) {
    const [hook] = await db
      .select()
      .from(webhooksTable)
      .where(eq(webhooksTable.id, delivery.webhookId))
      .limit(1);
    if (!hook) continue;

    const body = JSON.stringify(delivery.payload);
    const attemptCount = delivery.attemptCount + 1;
    const backoffMs = Math.pow(2, attemptCount) * 5 * 60 * 1000; // 10min, 20min
    const nextRetry = new Date(Date.now() + backoffMs);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);
      const signature = signPayload(hook.secret, body);
      const response = await fetch(hook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-PacketPath-Signature": signature,
          "X-PacketPath-Event": "webhook",
          "User-Agent": "PacketPath-Webhooks/1.0",
        },
        body,
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      const responseText = await response.text().catch(() => "");

      if (response.ok) {
        await db
          .update(webhookDeliveriesTable)
          .set({ status: "delivered", httpStatus: response.status, responseBody: responseText.slice(0, 1000), deliveredAt: now, attemptCount })
          .where(eq(webhookDeliveriesTable.id, delivery.id));
      } else if (attemptCount >= 3) {
        await db
          .update(webhookDeliveriesTable)
          .set({ status: "failed", httpStatus: response.status, responseBody: responseText.slice(0, 1000), attemptCount })
          .where(eq(webhookDeliveriesTable.id, delivery.id));
      } else {
        await db
          .update(webhookDeliveriesTable)
          .set({ status: "retrying", httpStatus: response.status, attemptCount, nextRetryAt: nextRetry })
          .where(eq(webhookDeliveriesTable.id, delivery.id));
      }
    } catch {
      if (attemptCount >= 3) {
        await db
          .update(webhookDeliveriesTable)
          .set({ status: "failed", attemptCount })
          .where(eq(webhookDeliveriesTable.id, delivery.id));
      } else {
        await db
          .update(webhookDeliveriesTable)
          .set({ status: "retrying", attemptCount, nextRetryAt: nextRetry })
          .where(eq(webhookDeliveriesTable.id, delivery.id));
      }
    }
  }
}
