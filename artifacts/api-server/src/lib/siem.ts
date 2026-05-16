import { logger } from "./logger";

export interface SecurityEvent {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  timestamp: string;
  requestId?: number | null;
  userId?: number | null;
  ipAddress?: string | null;
  details?: Record<string, unknown>;
}

function getWebhookTargets(): string[] {
  return process.env.SIEM_WEBHOOK_URLS
    ?.split(",")
    .map(v => v.trim())
    .filter(Boolean) ?? [];
}

export function isSiemConfigured(): boolean {
  return getWebhookTargets().length > 0;
}

export async function forwardSecurityEvent(event: SecurityEvent): Promise<void> {
  const targets = getWebhookTargets();

  if (targets.length === 0) {
    return;
  }

  await Promise.allSettled(
    targets.map(async target => {
      try {
        const response = await fetch(target, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event),
        });

        if (!response.ok) {
          throw new Error(`SIEM forward failed: ${response.status}`);
        }
      } catch (err) {
        logger.error({ err, target, eventType: event.type }, "Failed to forward SIEM event");
      }
    }),
  );
}
