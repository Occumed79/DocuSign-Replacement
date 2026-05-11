/**
 * Form progress saving routes for patient intake
 * POST /api/sign/:token/save-progress   — save partial form responses
 * GET  /api/sign/:token/progress        — get saved progress
 * POST /api/sign/resume/:saveToken      — resume from a save token
 */

import { Router, type IRouter } from "express";
import { z } from "zod/v4";
import crypto from "crypto";
import { db, formProgressTable, signatureRecipientsTable, signatureRequestsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { sendProgressSaveEmail } from "../lib/email.js";

const router: IRouter = Router();

// POST /api/sign/:token/save-progress
router.post("/sign/:token/save-progress", async (req, res): Promise<void> => {
  const { token } = req.params;

  const parsed = z.object({
    partialResponses: z.array(z.any()).optional().default([]),
    currentStep: z.enum(["document", "form", "sign"]).optional().default("document"),
    currentFieldIndex: z.number().int().min(0).optional().default(0),
    sendEmail: z.boolean().optional().default(false),
  }).safeParse(req.body);

  if (!parsed.success) { res.status(400).json({ error: "Invalid request" }); return; }

  const [recipient] = await db
    .select()
    .from(signatureRecipientsTable)
    .where(eq(signatureRecipientsTable.token, token))
    .limit(1);

  if (!recipient) { res.status(404).json({ error: "Signing session not found" }); return; }
  if (recipient.status !== "pending") { res.status(400).json({ error: "This signing request is no longer pending" }); return; }

  const saveToken = crypto.randomBytes(32).toString("base64url");
  const saveTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Upsert progress record
  const existing = await db
    .select()
    .from(formProgressTable)
    .where(eq(formProgressTable.recipientToken, token))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(formProgressTable)
      .set({
        partialResponses: parsed.data.partialResponses,
        currentStep: parsed.data.currentStep,
        currentFieldIndex: parsed.data.currentFieldIndex,
        saveToken,
        saveTokenExpiresAt,
      })
      .where(eq(formProgressTable.recipientToken, token));
  } else {
    await db.insert(formProgressTable).values({
      requestId: recipient.requestId,
      recipientToken: token,
      partialResponses: parsed.data.partialResponses,
      currentStep: parsed.data.currentStep,
      currentFieldIndex: parsed.data.currentFieldIndex,
      saveToken,
      saveTokenExpiresAt,
    });
  }

  // Optionally send resume email
  if (parsed.data.sendEmail) {
    const [request] = await db
      .select()
      .from(signatureRequestsTable)
      .where(eq(signatureRequestsTable.id, recipient.requestId))
      .limit(1);

    if (request) {
      const baseUrl = process.env.APP_BASE_URL ?? `https://${process.env.REPLIT_DOMAINS?.split(",")[0]?.trim() ?? "localhost"}`;
      const resumeUrl = `${baseUrl}/sign/${token}?resume=${saveToken}`;

      await sendProgressSaveEmail({
        recipientName: recipient.name,
        recipientEmail: recipient.email,
        requestTitle: request.title,
        resumeUrl,
        expiresAt: saveTokenExpiresAt,
      }).catch(() => {});

      await db
        .update(formProgressTable)
        .set({ emailSentAt: new Date() })
        .where(eq(formProgressTable.recipientToken, token));
    }
  }

  res.json({ saveToken, expiresAt: saveTokenExpiresAt.toISOString() });
});

// GET /api/sign/:token/progress
router.get("/sign/:token/progress", async (req, res): Promise<void> => {
  const { token } = req.params;

  const [progress] = await db
    .select()
    .from(formProgressTable)
    .where(eq(formProgressTable.recipientToken, token))
    .limit(1);

  if (!progress) { res.json(null); return; }

  // Validate save token if provided
  const saveToken = req.query.resume as string | undefined;
  if (saveToken && progress.saveToken !== saveToken) {
    res.status(401).json({ error: "Invalid resume token" });
    return;
  }

  if (new Date() > progress.saveTokenExpiresAt) {
    res.status(410).json({ error: "Resume link has expired" });
    return;
  }

  res.json({
    partialResponses: progress.partialResponses,
    currentStep: progress.currentStep,
    currentFieldIndex: progress.currentFieldIndex,
    savedAt: progress.updatedAt.toISOString(),
  });
});

export default router;
