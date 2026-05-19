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
import { requirePermission, logPrivilegedAction } from "../lib/rbac";
import { requirePrivilegedStepUp } from "../lib/privileged-step-up";
import { appendIntegrityLedgerEvent } from "../lib/integrity-ledger";
import { buildAuditEvidenceBundle } from "../lib/audit-bundle";

const router: IRouter = Router();

router.get("/signature-requests/:id/audit-bundle", async (req, res): Promise<void> => {
  const user = await requirePermission(req, res, "signature:export_audit_bundle");
  if (!user) return;

  const stepUpOk = await requirePrivilegedStepUp({
    req,
    res,
    user,
    purpose: "audit_bundle_export",
    consume: true,
  });
  if (!stepUpOk) return;

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

  await appendIntegrityLedgerEvent({
    requestId,
    actorUserId: user.id,
    eventType: "audit_bundle_exported",
    eventPayload: {
      bundleHash: bundle.bundleHash,
      recipientsCount: recipients.length,
      signaturesCount: signatures.length,
      formResponsesCount: formResponses.length,
      auditEventsCount: auditEvents.length,
    },
  }).catch(() => {});

  await logPrivilegedAction({
    user,
    action: "audit_bundle_exported",
    resource: "signature_request",
    resourceId: String(requestId),
    details: `Audit evidence bundle exported with hash: ${bundle.bundleHash}`,
    phiAccessed: true,
  });

  res.json(bundle);
});

export default router;
