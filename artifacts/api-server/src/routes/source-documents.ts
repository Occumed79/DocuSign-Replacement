import { Router, type IRouter, type Request } from "express";
import crypto from "crypto";
import { and, desc, eq, lt, sql } from "drizzle-orm";
import {
  auditLogsTable,
  casesTable,
  completedSignaturesTable,
  db,
  formResponsesTable,
  signatureRecipientsTable,
  signatureRequestsTable,
  signatureTemplatesTable,
  usersTable,
} from "@workspace/db";
import { requireAuth } from "../lib/require-auth";
import { encryptEnvelopeField } from "../lib/envelope-encryption";
import { isEmailConfigured, sendSigningEmail } from "../lib/email";
import { buildExecutedSourcePdf } from "../lib/source-document-pdf";

const router: IRouter = Router();
const MAX_SOURCE_PDF_BYTES = 8 * 1024 * 1024;

function sha256Bytes(value: Uint8Array | Buffer): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function sha256Text(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function getClientIp(req: Request): string {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string") return fwd.split(",")[0].trim();
  return req.socket?.remoteAddress ?? "unknown";
}

function getBaseUrl(req: Request): string {
  const explicit = process.env.APP_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const domains = process.env.REPLIT_DOMAINS?.split(",")[0]?.trim();
  if (domains) return `https://${domains}`;
  const dev = process.env.REPLIT_DEV_DOMAIN?.trim();
  if (dev) return `https://${dev}`;
  return `${req.protocol}://${req.headers.host ?? "localhost"}`;
}

function generateSigningToken(): string {
  return crypto.randomBytes(48).toString("base64url");
}

function validateSourcePdf(input: unknown): { base64: string; bytes: Buffer } {
  if (typeof input !== "string" || input.length === 0) throw new Error("sourceDocumentBase64 is required");
  const base64 = input.replace(/^data:application\/pdf;base64,/i, "").replace(/\s+/g, "");
  const bytes = Buffer.from(base64, "base64");
  if (bytes.length === 0) throw new Error("Source PDF is empty");
  if (bytes.length > MAX_SOURCE_PDF_BYTES) throw new Error("Source PDF exceeds the 8 MB limit");
  if (bytes.subarray(0, 5).toString("ascii") !== "%PDF-") throw new Error("Only valid PDF source documents are supported");
  return { base64, bytes };
}

async function logAction(params: {
  userId?: number | null;
  userEmail?: string | null;
  userName?: string | null;
  action: string;
  resourceId: string;
  details: string;
  ip?: string;
  ua?: string;
}) {
  await db.insert(auditLogsTable).values({
    userId: params.userId ?? null,
    userEmail: params.userEmail ?? null,
    userName: params.userName ?? null,
    action: params.action as any,
    resource: "signature_request",
    resourceId: params.resourceId,
    details: `[${params.action}] ${params.details}`,
    ipAddress: params.ip ?? null,
    userAgent: params.ua ?? null,
    phiAccessed: true,
  }).catch(() => undefined);
}

async function findRecipientByToken(token: string) {
  const hash = sha256Text(token);
  const [recipient] = await db
    .select()
    .from(signatureRecipientsTable)
    .where(eq(signatureRecipientsTable.tokenHash, hash))
    .limit(1);
  return recipient ?? null;
}

async function enforceSigningOrder(requestId: number, recipientOrder: number) {
  const blockers = await db
    .select({ id: signatureRecipientsTable.id })
    .from(signatureRecipientsTable)
    .where(and(
      eq(signatureRecipientsTable.requestId, requestId),
      lt(signatureRecipientsTable.order, recipientOrder),
      sql`${signatureRecipientsTable.status} != 'signed'`,
    ))
    .limit(1);
  return blockers.length === 0;
}

// Attach/replace the exact PDF associated with a reusable template.
router.post("/signature-templates/:id/source-document", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  const templateId = Number(req.params.id);
  if (!Number.isFinite(templateId)) { res.status(400).json({ error: "Invalid template id" }); return; }

  try {
    const { base64, bytes } = validateSourcePdf(req.body?.sourceDocumentBase64);
    const fileName = typeof req.body?.fileName === "string" && req.body.fileName.trim()
      ? req.body.fileName.trim().slice(0, 240)
      : `template-${templateId}.pdf`;
    const [updated] = await db.update(signatureTemplatesTable).set({
      sourceDocumentBase64: base64,
      sourceDocumentMimeType: "application/pdf",
      sourceDocumentFileName: fileName,
      updatedAt: new Date(),
    }).where(eq(signatureTemplatesTable.id, templateId)).returning({ id: signatureTemplatesTable.id });
    if (!updated) { res.status(404).json({ error: "Template not found" }); return; }
    res.json({ id: updated.id, fileName, byteLength: bytes.length, sha256: sha256Bytes(bytes) });
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? "Invalid source PDF" });
  }
});

router.get("/signature-templates/:id/source-document", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  const [template] = await db.select({
    sourceDocumentBase64: signatureTemplatesTable.sourceDocumentBase64,
    sourceDocumentMimeType: signatureTemplatesTable.sourceDocumentMimeType,
    sourceDocumentFileName: signatureTemplatesTable.sourceDocumentFileName,
  }).from(signatureTemplatesTable).where(eq(signatureTemplatesTable.id, Number(req.params.id))).limit(1);
  if (!template?.sourceDocumentBase64) { res.status(404).json({ error: "No source PDF attached" }); return; }
  const bytes = Buffer.from(template.sourceDocumentBase64, "base64");
  res.setHeader("Content-Type", template.sourceDocumentMimeType || "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${(template.sourceDocumentFileName || "template.pdf").replace(/["\r\n]/g, "_")}"`);
  res.setHeader("Cache-Control", "private, no-store");
  res.send(bytes);
});

// Source-PDF request creation. Requests without a source PDF deliberately fall
// through to the existing HTML request route for backward compatibility.
router.post("/signature-requests", async (req, res, next): Promise<void> => {
  const templateId = req.body?.templateId ? Number(req.body.templateId) : null;
  let template: any = null;
  if (templateId) {
    const [row] = await db.select().from(signatureTemplatesTable).where(eq(signatureTemplatesTable.id, templateId)).limit(1);
    template = row ?? null;
  }

  const explicitSource = typeof req.body?.sourceDocumentBase64 === "string" && req.body.sourceDocumentBase64.length > 0;
  const templateSource = Boolean(template?.sourceDocumentBase64);
  if (!explicitSource && !templateSource) {
    next();
    return;
  }

  const userId = await requireAuth(req, res);
  if (!userId) return;

  const { title, message, caseId, expiryDays, recipients } = req.body;
  if (!title?.trim()) { res.status(400).json({ error: "title is required" }); return; }
  if (!Array.isArray(recipients) || recipients.length === 0) { res.status(400).json({ error: "At least one recipient is required" }); return; }

  try {
    const rawBase64 = explicitSource ? req.body.sourceDocumentBase64 : template.sourceDocumentBase64;
    const { base64, bytes } = validateSourcePdf(rawBase64);
    const fileName = (
      (explicitSource ? req.body?.sourceDocumentFileName : template?.sourceDocumentFileName) || `${title.trim()}.pdf`
    ).toString().trim().slice(0, 240);
    const mimeType = "application/pdf";
    const sourceHash = sha256Bytes(bytes);
    const fallbackContent = `<p><strong>Original PDF document:</strong> ${fileName.replace(/[<>&]/g, "")}</p>`;
    const resolvedFormSchema = Array.isArray(req.body?.formSchema) && req.body.formSchema.length > 0
      ? req.body.formSchema
      : Array.isArray(template?.formSchema) ? template.formSchema : [];
    const expiresAt = new Date(Date.now() + (Number(expiryDays) || 7) * 24 * 60 * 60 * 1000);

    const documentEncryption = encryptEnvelopeField(fallbackContent);
    const formSchemaEncryption = resolvedFormSchema.length > 0 ? encryptEnvelopeField(JSON.stringify(resolvedFormSchema)) : null;
    const [user] = await db.select({ email: usersTable.email, name: usersTable.name }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);

    const [request] = await db.insert(signatureRequestsTable).values({
      title: title.trim(),
      message: message?.trim() || null,
      templateId: templateId || null,
      caseId: caseId || null,
      documentContent: fallbackContent,
      sourceDocumentBase64: base64,
      sourceDocumentMimeType: mimeType,
      sourceDocumentFileName: fileName,
      encryptedDocumentContent: documentEncryption.encryptedPayload,
      wrappedDocumentKey: documentEncryption.wrappedDataKey,
      encryptionKeyId: process.env.DB_ENCRYPTION_KEY_ID || "db-master-key-v1",
      documentHash: sourceHash,
      formSchema: resolvedFormSchema,
      encryptedFormSchema: formSchemaEncryption?.encryptedPayload,
      wrappedFormSchemaKey: formSchemaEncryption?.wrappedDataKey,
      status: "pending",
      expiresAt,
      createdById: userId,
    }).returning();

    const baseUrl = getBaseUrl(req);
    const emailResults: { name: string; email: string; sent: boolean; error?: string }[] = [];
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      if (!recipient?.name?.trim() || !recipient?.email?.trim()) continue;
      const token = generateSigningToken();
      const email = recipient.email.trim().toLowerCase();
      await db.insert(signatureRecipientsTable).values({
        requestId: request.id,
        name: recipient.name.trim(),
        email,
        role: recipient.role || "signer",
        order: Number(recipient.order) || i + 1,
        token,
        tokenHash: sha256Text(token),
        tokenExpiresAt: expiresAt,
      });
      const emailResult = await sendSigningEmail({
        recipientName: recipient.name.trim(),
        recipientEmail: email,
        senderName: user?.name ?? "Occu-Med",
        requestTitle: title.trim(),
        message: message?.trim() || null,
        signingToken: token,
        expiresAt,
        isReminder: false,
        baseUrl,
      });
      emailResults.push({ name: recipient.name.trim(), email, ...emailResult });
      await logAction({
        userId,
        userEmail: user?.email,
        userName: user?.name,
        action: emailResult.sent ? "invitation_sent" : "invitation_failed",
        resourceId: String(request.id),
        details: `${recipient.name.trim()} <${email}> ${emailResult.sent ? "invite sent" : `invite failed (${emailResult.error ?? "unknown error"})`}`,
        ip: getClientIp(req),
        ua: req.headers["user-agent"],
      });
    }

    await logAction({
      userId,
      userEmail: user?.email,
      userName: user?.name,
      action: "created",
      resourceId: String(request.id),
      details: `Exact-source PDF request "${title.trim()}" created from ${fileName}; SHA-256 ${sourceHash}.`,
      ip: getClientIp(req),
      ua: req.headers["user-agent"],
    });

    res.status(201).json({
      id: request.id,
      title: request.title,
      status: request.status,
      exactSourceDocument: true,
      sourceDocumentFileName: fileName,
      sourceDocumentHash: sourceHash,
      emailsSent: emailResults.filter(r => r.sent).length,
      emailsTotal: emailResults.length,
      emailConfigured: isEmailConfigured(),
      perRecipient: emailResults,
    });
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? "Unable to create source-PDF request" });
  }
});

router.get("/sign/:token/source-document", async (req, res): Promise<void> => {
  const recipient = await findRecipientByToken(req.params.token as string);
  if (!recipient) { res.status(404).json({ error: "Invalid signing link" }); return; }
  if (recipient.status === "declined") { res.status(410).json({ error: "Signing request declined" }); return; }
  if (recipient.tokenExpiresAt < new Date()) { res.status(410).json({ error: "Signing link expired" }); return; }
  const [request] = await db.select().from(signatureRequestsTable).where(eq(signatureRequestsTable.id, recipient.requestId)).limit(1);
  if (!request || request.status === "voided") { res.status(410).json({ error: "Request unavailable" }); return; }
  if (!request.sourceDocumentBase64) { res.status(404).json({ error: "No exact source PDF attached" }); return; }
  if (!(await enforceSigningOrder(request.id, recipient.order))) {
    res.status(409).json({ error: "Waiting for a prior signer" });
    return;
  }
  const bytes = Buffer.from(request.sourceDocumentBase64, "base64");
  res.setHeader("Content-Type", request.sourceDocumentMimeType || "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${(request.sourceDocumentFileName || "document.pdf").replace(/["\r\n]/g, "_")}"`);
  res.setHeader("Cache-Control", "private, no-store");
  res.send(bytes);
});

router.get("/signature-requests/:id/source-document", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  const [request] = await db.select().from(signatureRequestsTable).where(eq(signatureRequestsTable.id, Number(req.params.id))).limit(1);
  if (!request?.sourceDocumentBase64) { res.status(404).json({ error: "No source PDF attached" }); return; }
  res.setHeader("Content-Type", request.sourceDocumentMimeType || "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${(request.sourceDocumentFileName || "document.pdf").replace(/["\r\n]/g, "_")}"`);
  res.setHeader("Cache-Control", "private, no-store");
  res.send(Buffer.from(request.sourceDocumentBase64, "base64"));
});

// Intercept the existing PDF endpoint only for exact-source requests. HTML
// requests call next() and retain the legacy renderer unchanged.
router.get("/signature-requests/:id/pdf", async (req, res, next): Promise<void> => {
  const [request] = await db.select().from(signatureRequestsTable).where(eq(signatureRequestsTable.id, Number(req.params.id))).limit(1);
  if (!request?.sourceDocumentBase64) {
    next();
    return;
  }
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const [recipients, signatures, responseRows, auditEvents] = await Promise.all([
    db.select().from(signatureRecipientsTable).where(eq(signatureRecipientsTable.requestId, request.id)).orderBy(signatureRecipientsTable.order),
    db.select().from(completedSignaturesTable).where(eq(completedSignaturesTable.requestId, request.id)),
    db.select().from(formResponsesTable).where(eq(formResponsesTable.requestId, request.id)),
    db.select({ action: auditLogsTable.action, details: auditLogsTable.details, createdAt: auditLogsTable.createdAt })
      .from(auditLogsTable)
      .where(and(eq(auditLogsTable.resource, "signature_request"), eq(auditLogsTable.resourceId, String(request.id))))
      .orderBy(desc(auditLogsTable.createdAt)),
  ]);

  const formResponses = responseRows.map(row => ({
    recipientId: row.recipientId,
    recipientName: recipients.find(r => r.id === row.recipientId)?.name ?? "Unknown",
    responses: Array.isArray(row.responses) ? row.responses as any[] : [],
  }));

  try {
    const pdf = await buildExecutedSourcePdf({
      sourceDocumentBase64: request.sourceDocumentBase64,
      sourceDocumentFileName: request.sourceDocumentFileName,
      requestId: request.id,
      title: request.title,
      status: request.status,
      documentHash: request.documentHash,
      createdAt: request.createdAt,
      completedAt: request.completedAt,
      recipients: recipients.map(r => ({
        id: r.id,
        name: r.name,
        email: r.email,
        role: r.role,
        order: r.order,
        status: r.status,
        signedAt: r.signedAt,
        ipAddress: r.ipAddress,
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
      formResponses,
      auditEvents: auditEvents.map(e => ({ action: e.action, details: e.details, createdAt: e.createdAt })),
    });

    const safeFileName = request.title.replace(/[^a-z0-9]/gi, "_").toLowerCase().slice(0, 60);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="PacketPath_${safeFileName}_PKT-SIG-${String(request.id).padStart(5, "0")}.pdf"`);
    res.setHeader("Content-Length", String(pdf.length));
    res.setHeader("Cache-Control", "private, no-store");
    res.send(pdf);
    await logAction({
      userId,
      action: "pdf_downloaded",
      resourceId: String(request.id),
      details: `Exact-source PDF downloaded for "${request.title}" with execution appendix.`,
      ip: getClientIp(req),
      ua: req.headers["user-agent"],
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? "Unable to render source PDF" });
  }
});

export default router;
