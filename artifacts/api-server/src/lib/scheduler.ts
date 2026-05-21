import { db, signatureRequestsTable, signatureRecipientsTable, usersTable } from "@workspace/db";
import { eq, and, sql, lt } from "drizzle-orm";
import { sendSigningEmail, isEmailConfigured } from "./email";
import { logger } from "./logger";

/**
 * Auto-reminder scheduler — runs every 48 hours.
 * Finds all pending/partially_signed requests and reminds unsigned recipients.
 * Also expires requests past their expiresAt date.
 */
export function startScheduler(getBaseUrl: () => string): void {
  // Run immediately on boot, then every 48 hours
  runScheduledTasks(getBaseUrl).catch((e) =>
    logger.error({ err: e }, "scheduler: initial run failed")
  );

  const INTERVAL_MS = 48 * 60 * 60 * 1000; // 48 hours
  setInterval(() => {
    runScheduledTasks(getBaseUrl).catch((e) =>
      logger.error({ err: e }, "scheduler: periodic run failed")
    );
  }, INTERVAL_MS);

  logger.info("scheduler: auto-reminder + expiry scheduler started (48h cadence)");
}

async function runScheduledTasks(getBaseUrl: () => string): Promise<void> {
  logger.info("scheduler: running tasks");
  await expireOverdueRequests();
  if (isEmailConfigured()) {
    await sendAutoReminders(getBaseUrl);
  } else {
    logger.info("scheduler: SMTP not configured — skipping auto-reminders");
  }
}

async function expireOverdueRequests(): Promise<void> {
  try {
    const now = new Date();
    // Mark all pending/partially_signed requests past expiresAt as expired
    const result = await db
      .update(signatureRequestsTable)
      .set({ status: "expired", updatedAt: now })
      .where(
        and(
          sql`${signatureRequestsTable.status} IN ('pending', 'partially_signed')`,
          lt(signatureRequestsTable.expiresAt, now)
        )
      )
      .returning({ id: signatureRequestsTable.id });

    if (result.length > 0) {
      logger.info({ count: result.length }, "scheduler: expired overdue requests");
    }
  } catch (e) {
    logger.error({ err: e }, "scheduler: expiry task failed");
  }
}

async function sendAutoReminders(getBaseUrl: () => string): Promise<void> {
  try {
    // Find all active pending/partially_signed requests
    const activeRequests = await db
      .select({
        id: signatureRequestsTable.id,
        title: signatureRequestsTable.title,
        message: signatureRequestsTable.message,
        createdById: signatureRequestsTable.createdById,
      })
      .from(signatureRequestsTable)
      .where(
        sql`${signatureRequestsTable.status} IN ('pending', 'partially_signed')`
      );

    let totalSent = 0;
    let totalFailed = 0;
    const baseUrl = getBaseUrl();

    for (const request of activeRequests) {
      // Get sender name
      let senderName = "Occu-Med";
      if (request.createdById) {
        const [sender] = await db
          .select({ name: usersTable.name })
          .from(usersTable)
          .where(eq(usersTable.id, request.createdById))
          .limit(1);
        if (sender?.name) senderName = sender.name;
      }

      // Get pending recipients with valid (non-expired) tokens
      const pendingRecipients = await db
        .select()
        .from(signatureRecipientsTable)
        .where(
          and(
            eq(signatureRecipientsTable.requestId, request.id),
            sql`${signatureRecipientsTable.status} IN ('pending', 'viewed')`,
            sql`${signatureRecipientsTable.tokenExpiresAt} > NOW()`
          )
        );

      for (const recipient of pendingRecipients) {
        // Use tokenHash as token proxy — public token is needed for the link.
        // We use the legacy `token` column if present, otherwise skip (token not stored in plaintext).
        const signingToken = recipient.token;
        if (!signingToken) continue;

        const result = await sendSigningEmail({
          recipientName: recipient.name,
          recipientEmail: recipient.email,
          senderName,
          requestTitle: request.title,
          message: request.message,
          signingToken,
          expiresAt: recipient.tokenExpiresAt,
          isReminder: true,
          baseUrl,
        });

        if (result.sent) {
          totalSent++;
        } else {
          totalFailed++;
          logger.warn(
            { requestId: request.id, recipientEmail: recipient.email, error: result.error },
            "scheduler: auto-reminder email failed"
          );
        }
      }
    }

    logger.info(
      { totalSent, totalFailed, requestsChecked: activeRequests.length },
      "scheduler: auto-reminders complete"
    );
  } catch (e) {
    logger.error({ err: e }, "scheduler: auto-reminder task failed");
  }
}
