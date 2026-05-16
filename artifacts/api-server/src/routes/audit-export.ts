import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  db,
  signatureRequestsTable,
  signatureRecipientsTable,
  completedSignaturesTable,
  formResponsesTable,
  auditLogsTable,
} from "@workspace/db";
import { requireAuth } from "../lib/require-auth";
import { buildAuditEvidenceBundle } from "../lib/audit-bundle";

const router: IRouter = Router();

router.get("/signature-requests/:id/audit-bundle", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const requestId = Number(req.params.id);

  const [request] = await db
    .select()
    .from(signatureRequestsTable)
    .where(eq(signatureRequestsTable.id, requestId))
    .limit(1);

  if (!request) {
    res.status(404).json({ error: "Signature request not found" });
    return;
  }

  const [recipients, signatures, formResponses, auditEvents] = await Promise.all([
    db.select().from(signatureRecipientsTable).where(eq(signatureRecipientsTable.requestId, requestId)),
    db.select().from(completedSignaturesTable).where(eq(completedSignaturesTable.requestId, requestId)),
    db.select().from(formResponsesTable).where(eq(formResponsesTable.requestId, requestId)),
    db.select().from(auditLogsTable).where(eq(auditLogsTable.resourceId, String(requestId))),
  ]);

  const bundle = buildAuditEvidenceBundle({
    request,
    recipients,
    signatures,
    formResponses,
    auditEvents,
  });

  res.json(bundle);
});

export default router;
