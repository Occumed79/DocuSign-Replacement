import { Router, type IRouter } from "express";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import {
  db,
  signatureRequestsTable,
  signatureRecipientsTable,
  completedSignaturesTable,
  formResponsesTable,
  auditLogsTable,
  usersTable,
  casesTable,
} from "@workspace/db";
import { storeFinalizedPdfArtifact, isArtifactStorageConfigured } from "../lib/artifact-storage";
import { calculateSigningAnomalyScore } from "../lib/anomaly-detection";
import { alertTamperDetected, alertHighRiskSigning } from "../lib/security-alerts";
import { requirePermission, logPrivilegedAction } from "../lib/rbac";
import { requirePrivilegedStepUp } from "../lib/privileged-step-up";
import { appendIntegrityLedgerEvent } from "../lib/integrity-ledger";

const router: IRouter = Router();

function sha256(data: string | Buffer): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return `{${Object.keys(obj).sort().map(k => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on("data", chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

async function getSignatureBundle(requestId: number) {
  const [request] = await db.select().from(signatureRequestsTable).where(eq(signatureRequestsTable.id, requestId)).limit(1);
  if (!request) return null;

  const [recipients, signatures, formResponses, auditEvents] = await Promise.all([
    db.select().from(signatureRecipientsTable).where(eq(signatureRecipientsTable.requestId, requestId)).orderBy(signatureRecipientsTable.order),
    db.select().from(completedSignaturesTable).where(eq(completedSignaturesTable.requestId, requestId)).orderBy(completedSignaturesTable.id),
    db.select().from(formResponsesTable).where(eq(formResponsesTable.requestId, requestId)),
    db.select().from(auditLogsTable).where(eq(auditLogsTable.resourceId, String(requestId))).orderBy(auditLogsTable.createdAt),
  ]);

  return { request, recipients, signatures, formResponses, auditEvents };
}

function verifyEvidencePayload(signature: any, expectedDocumentHash: string) {
  const payload = signature.evidencePayload as Record<string, unknown> | null;
  const evidenceHash = signature.evidenceHash as string | null;

  if (!payload || !evidenceHash) {
    return {
      signatureId: signature.id,
      valid: false,
      reason: "Missing evidence payload or evidence hash",
      storedEvidenceHash: evidenceHash,
      recomputedEvidenceHash: null,
    };
  }

  const recomputedEvidenceHash = sha256(canonicalJson(payload));
  const payloadDocumentHash = payload.documentHash;
  const payloadConsent = payload.electronicRecordConsent;

  const valid =
    recomputedEvidenceHash === evidenceHash &&
    payloadDocumentHash === expectedDocumentHash &&
    payloadConsent === true &&
    signature.electronicRecordConsent === true;

  return {
    signatureId: signature.id,
    recipientId: signature.recipientId,
    valid,
    storedEvidenceHash: evidenceHash,
    recomputedEvidenceHash,
    documentHashValid: payloadDocumentHash === expectedDocumentHash,
    consentValid: payloadConsent === true && signature.electronicRecordConsent === true,
  };
}

function computeFinalEvidenceHash(request: any, signatures: any[]) {
  const signerEvidenceHashes = signatures
    .map(s => s.evidenceHash)
    .filter(Boolean)
    .sort();

  return sha256(canonicalJson({
    version: 1,
    requestId: request.id,
    documentHash: request.documentHash,
    status: request.status,
    completedAt: request.completedAt?.toISOString?.() ?? null,
    signerEvidenceHashes,
  }));
}

router.post("/signature-requests/:id/verify", async (req, res): Promise<void> => {
  const user = await requirePermission(req, res, "signature:verify_evidence");
  if (!user) return;

  const stepUpOk = await requirePrivilegedStepUp({
    req,
    res,
    user,
    purpose: "evidence_verification",
    consume: true,
  });
  if (!stepUpOk) return;

  const requestId = Number(req.params.id);
  const bundle = await getSignatureBundle(requestId);
  if (!bundle) {
    res.status(404).json({ error: "Signature request not found" });
    return;
  }

  const { request, recipients, signatures } = bundle;
  const recomputedDocumentHash = sha256(request.documentContent);
  const documentHashValid = recomputedDocumentHash === request.documentHash;
  const signerResults = signatures.map(sig => verifyEvidencePayload(sig, request.documentHash));
  const evidenceHashesValid = signerResults.every(r => r.valid);
  const signedRecipientIds = new Set(signatures.map(s => s.recipientId));
  const allSignedRecipientsHaveEvidence = recipients
    .filter(r => r.status === "signed")
    .every(r => signedRecipientIds.has(r.id));
  const recomputedFinalEvidenceHash = computeFinalEvidenceHash(request, signatures);
  const finalEvidenceHashValid = request.finalEvidenceHash
    ? request.finalEvidenceHash === recomputedFinalEvidenceHash
    : request.status !== "completed";

  const tamperDetected =
    !documentHashValid ||
    !evidenceHashesValid ||
    !allSignedRecipientsHaveEvidence ||
    !finalEvidenceHashValid;

  const anomaly = calculateSigningAnomalyScore({
    failedAttempts: tamperDetected ? 5 : 0,
    rapidSigning: signatures.length >= 3,
    ipChanges: new Set(signatures.map(s => s.ipAddress).filter(Boolean)).size,
  });

  if (tamperDetected) {
    await alertTamperDetected({
      requestId,
      details: {
        anomaly,
        documentHashValid,
        evidenceHashesValid,
        finalEvidenceHashValid,
      },
    }).catch(() => {});
  }

  if (anomaly.severity === "high" || anomaly.severity === "critical") {
    await alertHighRiskSigning({
      requestId,
      score: anomaly.score,
      flags: anomaly.flags,
    }).catch(() => {});
  }

  await appendIntegrityLedgerEvent({
    requestId,
    actorUserId: user.id,
    eventType: tamperDetected ? "evidence_verification_failed" : "evidence_verified",
    eventPayload: {
      documentHashValid,
      evidenceHashesValid,
      allSignedRecipientsHaveEvidence,
      finalEvidenceHashValid,
      tamperDetected,
      anomalyScore: anomaly.score,
      anomalySeverity: anomaly.severity,
      anomalyFlags: anomaly.flags,
      recomputedFinalEvidenceHash,
    },
  }).catch(() => {});

  await logPrivilegedAction({
    user,
    action: tamperDetected ? "evidence_verification_failed" : "evidence_verified",
    resource: "signature_request",
    resourceId: String(requestId),
    details: tamperDetected
      ? "Evidence verification found one or more integrity problems"
      : "Evidence verification completed successfully",
    phiAccessed: true,
  });

  res.json({
    valid: !tamperDetected,
    tamperDetected,
    anomaly,
    requestId,
    status: request.status,
    documentHashValid,
    storedDocumentHash: request.documentHash,
    recomputedDocumentHash,
    evidenceHashesValid,
    signerResults,
    allSignedRecipientsHaveEvidence,
    finalEvidenceHashValid,
    storedFinalEvidenceHash: request.finalEvidenceHash ?? null,
    recomputedFinalEvidenceHash,
    finalizedPdf: {
      finalPdfHash: request.finalPdfHash ?? null,
      finalPdfStoragePath: request.finalPdfStoragePath ?? null,
      durableStorageConfigured: isArtifactStorageConfigured(),
    },
  });
});

router.post("/signature-requests/:id/finalize-artifact", async (req, res): Promise<void> => {
  const user = await requirePermission(req, res, "signature:finalize_artifact");
  if (!user) return;

  const stepUpOk = await requirePrivilegedStepUp({
    req,
    res,
    user,
    purpose: "artifact_finalization",
    consume: true,
  });
  if (!stepUpOk) return;

  const requestId = Number(req.params.id);
  const bundle = await getSignatureBundle(requestId);
  if (!bundle) {
    res.status(404).json({ error: "Signature request not found" });
    return;
  }

  const { request, recipients, signatures, auditEvents, formResponses } = bundle;
  if (request.status !== "completed") {
    res.status(409).json({ error: "Only completed signature requests can be finalized" });
    return;
  }

  const evidenceResults = signatures.map(sig => verifyEvidencePayload(sig, request.documentHash));
  if (!evidenceResults.every(r => r.valid)) {
    res.status(409).json({ error: "Cannot finalize artifact because signer evidence verification failed", evidenceResults });
    return;
  }

  let patientName: string | null = null;
  if (request.caseId) {
    const [c] = await db.select({ patientName: casesTable.patientName }).from(casesTable).where(eq(casesTable.id, request.caseId));
    patientName = c?.patientName ?? null;
  }

  let creatorName: string | null = null;
  let creatorEmail: string | null = null;
  if (request.createdById) {
    const [creator] = await db.select({ name: usersTable.name, email: usersTable.email }).from(usersTable).where(eq(usersTable.id, request.createdById));
    creatorName = creator?.name ?? null;
    creatorEmail = creator?.email ?? null;
  }

  const formResponsesForPdf = formResponses.map(fr => ({
    recipientId: fr.recipientId,
    recipientName: recipients.find(r => r.id === fr.recipientId)?.name ?? "Unknown",
    responses: (fr.responses as { fieldId: string; label: string; value: string }[]) ?? [],
  }));

  const { generateSignedDocumentPdf } = await import("../lib/pdf.js");
  const pdfStream = generateSignedDocumentPdf({
    requestId: request.id,
    title: request.title,
    message: request.message,
    documentContent: request.documentContent,
    documentHash: request.documentHash,
    status: request.status,
    createdAt: request.createdAt,
    completedAt: request.completedAt,
    voidReason: request.voidReason,
    patientName,
    creatorName,
    creatorEmail,
    formResponses: formResponsesForPdf,
    recipients: recipients.map(r => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role,
      order: r.order,
      status: r.status,
      signedAt: r.signedAt,
      ipAddress: r.ipAddress,
      userAgent: r.userAgent,
      declinedAt: r.declinedAt,
      declineReason: r.declineReason,
    })),
    completedSignatures: signatures.map(s => ({
      recipientId: s.recipientId,
      signatureType: s.signatureType,
      signatureData: s.signatureData,
      fullName: s.fullName,
      documentHash: s.documentHash,
      signatureHash: s.evidenceHash ?? s.signatureHash,
      signedAt: s.signedAt,
      ipAddress: s.ipAddress,
    })),
    auditEvents: auditEvents.map(e => ({ action: e.action, details: e.details, createdAt: e.createdAt })),
  });

  const pdfBuffer = await streamToBuffer(pdfStream as any);
  const finalPdfHash = sha256(pdfBuffer);
  const finalEvidenceHash = computeFinalEvidenceHash(request, signatures);

  const storageResult = await storeFinalizedPdfArtifact({
    requestId,
    pdfBuffer,
    finalPdfHash,
  });

  await db.update(signatureRequestsTable)
    .set({
      finalPdfHash,
      finalEvidenceHash,
      finalPdfStoragePath: storageResult.path,
    })
    .where(eq(signatureRequestsTable.id, request.id));

  await appendIntegrityLedgerEvent({
    requestId,
    actorUserId: user.id,
    eventType: "final_artifact_hashed",
    eventPayload: {
      finalPdfHash,
      finalEvidenceHash,
      artifactStoragePath: storageResult.path,
      artifactStorageProvider: storageResult.provider,
      durableStorageConfigured: isArtifactStorageConfigured(),
    },
  }).catch(() => {});

  await logPrivilegedAction({
    user,
    action: "final_artifact_hashed",
    resource: "signature_request",
    resourceId: String(requestId),
    details: `Final PDF artifact hash generated: ${finalPdfHash}`,
    phiAccessed: true,
  });

  res.json({
    finalized: true,
    requestId,
    finalPdfHash,
    finalEvidenceHash,
    artifactStorage: storageResult,
    durableStorageConfigured: isArtifactStorageConfigured(),
  });
});

export default router;
