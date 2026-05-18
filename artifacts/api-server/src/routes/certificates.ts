import { Router, type IRouter } from "express";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import {
  db,
  signatureRequestsTable,
  signatureRecipientsTable,
  completedSignaturesTable,
} from "@workspace/db";
import { requirePermission, logPrivilegedAction } from "../lib/rbac";
import { requirePrivilegedStepUp } from "../lib/privileged-step-up";
import {
  buildCertificateOfCompletion,
  generateCertificateOfCompletionPdf,
  type CertificateInput,
} from "../lib/certificate-of-completion";

const router: IRouter = Router();

function sha256(data: string): string {
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

function verifySignatureEvidence(signature: any, expectedDocumentHash: string) {
  if (!signature.evidencePayload || !signature.evidenceHash) return false;
  const recomputed = sha256(canonicalJson(signature.evidencePayload));
  return recomputed === signature.evidenceHash && signature.documentHash === expectedDocumentHash;
}

function computeFinalEvidenceHash(request: any, signatures: any[]) {
  return sha256(canonicalJson({
    version: 1,
    requestId: request.id,
    documentHash: request.documentHash,
    status: request.status,
    completedAt: request.completedAt?.toISOString?.() ?? null,
    signerEvidenceHashes: signatures.map(s => s.evidenceHash).filter(Boolean).sort(),
  }));
}

async function buildCertificateInput(requestId: number): Promise<CertificateInput | null> {
  const [request] = await db
    .select()
    .from(signatureRequestsTable)
    .where(eq(signatureRequestsTable.id, requestId))
    .limit(1);

  if (!request) return null;

  const [recipients, signatures] = await Promise.all([
    db.select().from(signatureRecipientsTable).where(eq(signatureRecipientsTable.requestId, requestId)).orderBy(signatureRecipientsTable.order),
    db.select().from(completedSignaturesTable).where(eq(completedSignaturesTable.requestId, requestId)),
  ]);

  const recomputedDocumentHash = sha256(request.documentContent);
  const documentHashValid = recomputedDocumentHash === request.documentHash;
  const evidenceHashesValid = signatures.every(sig => verifySignatureEvidence(sig, request.documentHash));
  const recomputedFinalEvidenceHash = computeFinalEvidenceHash(request, signatures);
  const finalEvidenceHashValid = request.finalEvidenceHash
    ? request.finalEvidenceHash === recomputedFinalEvidenceHash
    : request.status !== "completed";
  const tamperDetected = !documentHashValid || !evidenceHashesValid || !finalEvidenceHashValid;

  return {
    requestId: request.id,
    title: request.title,
    status: request.status,
    createdAt: request.createdAt,
    completedAt: request.completedAt,
    documentHash: request.documentHash,
    finalPdfHash: request.finalPdfHash,
    finalEvidenceHash: request.finalEvidenceHash,
    finalPdfStoragePath: request.finalPdfStoragePath,
    verification: {
      valid: !tamperDetected,
      tamperDetected,
      documentHashValid,
      evidenceHashesValid,
      finalEvidenceHashValid,
    },
    signers: recipients.map(recipient => {
      const signature = signatures.find(sig => sig.recipientId === recipient.id);
      return {
        recipientId: recipient.id,
        name: recipient.name,
        email: recipient.email,
        role: recipient.role,
        order: recipient.order,
        status: recipient.status,
        signedAt: recipient.signedAt,
        viewedAt: recipient.viewedAt,
        declinedAt: recipient.declinedAt,
        ipAddress: recipient.ipAddress,
        userAgent: recipient.userAgent,
        signatureType: signature?.signatureType ?? null,
        signatureHash: signature?.signatureHash ?? null,
        evidenceHash: signature?.evidenceHash ?? null,
        electronicRecordConsent: signature?.electronicRecordConsent ?? null,
        consentText: signature?.consentText ?? null,
      };
    }),
  };
}

async function requireCertificateStepUp(req: any, res: any, user: any): Promise<boolean> {
  return requirePrivilegedStepUp({
    req,
    res,
    user,
    purpose: "certificate_export",
    consume: true,
  });
}

router.get("/signature-requests/:id/certificate.json", async (req, res): Promise<void> => {
  const user = await requirePermission(req, res, "signature:export_certificate");
  if (!user) return;
  if (!(await requireCertificateStepUp(req, res, user))) return;

  const requestId = Number(req.params.id);
  const input = await buildCertificateInput(requestId);
  if (!input) {
    res.status(404).json({ error: "Signature request not found" });
    return;
  }

  const certificate = buildCertificateOfCompletion(input);

  await logPrivilegedAction({
    user,
    action: "certificate_json_exported",
    resource: "signature_request",
    resourceId: String(requestId),
    details: `Certificate of Completion JSON exported: ${certificate.certificateId}`,
    phiAccessed: true,
  });

  res.json(certificate);
});

router.get("/signature-requests/:id/certificate.pdf", async (req, res): Promise<void> => {
  const user = await requirePermission(req, res, "signature:export_certificate");
  if (!user) return;
  if (!(await requireCertificateStepUp(req, res, user))) return;

  const requestId = Number(req.params.id);
  const input = await buildCertificateInput(requestId);
  if (!input) {
    res.status(404).json({ error: "Signature request not found" });
    return;
  }

  const certificate = buildCertificateOfCompletion(input);
  const pdfStream = generateCertificateOfCompletionPdf(input);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${certificate.certificateId}.pdf"`);
  res.setHeader("Cache-Control", "no-store");

  await logPrivilegedAction({
    user,
    action: "certificate_pdf_exported",
    resource: "signature_request",
    resourceId: String(requestId),
    details: `Certificate of Completion PDF exported: ${certificate.certificateId}`,
    phiAccessed: true,
  });

  (pdfStream as any).pipe(res);
});

router.post("/signature-requests/:id/certificate", async (req, res): Promise<void> => {
  const user = await requirePermission(req, res, "signature:export_certificate");
  if (!user) return;
  if (!(await requireCertificateStepUp(req, res, user))) return;

  const requestId = Number(req.params.id);
  const input = await buildCertificateInput(requestId);
  if (!input) {
    res.status(404).json({ error: "Signature request not found" });
    return;
  }

  const certificate = buildCertificateOfCompletion(input);

  await logPrivilegedAction({
    user,
    action: "certificate_generated",
    resource: "signature_request",
    resourceId: String(requestId),
    details: `Certificate of Completion generated: ${certificate.certificateId}; hash: ${certificate.certificateHash}`,
    phiAccessed: true,
  });

  res.json(certificate);
});

export default router;
