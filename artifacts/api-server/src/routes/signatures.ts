import { Router, type IRouter, type Request } from "express";
import { rateLimit } from "express-rate-limit";
import {
  db,
  signatureTemplatesTable,
  signatureRequestsTable,
  signatureRecipientsTable,
  completedSignaturesTable,
  formResponsesTable,
  auditLogsTable,
  usersTable,
  casesTable,
} from "@workspace/db";
import { eq, desc, and, count, sql, ilike, or, lt } from "drizzle-orm";
import { requireAuth } from "../lib/require-auth";
import { sendSigningEmail, verifySmtpConnection, isEmailConfigured } from "../lib/email";
import crypto from "crypto";

const router: IRouter = Router();

const ELECTRONIC_RECORD_CONSENT_TEXT =
  "I agree to use electronic records and electronic signatures for this document and understand that my electronic signature has the same legal effect as a handwritten signature.";

const publicSigningLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many signing requests. Please try again later." },
});

const signingCompletionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many signing attempts. Please try again later." },
});

router.use("/sign", publicSigningLimiter);

function getBaseUrl(req: Request): string {
  const explicit = process.env.APP_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const domains = process.env.REPLIT_DOMAINS?.split(",")[0]?.trim();
  if (domains) return `https://${domains}`;
  const dev = process.env.REPLIT_DEV_DOMAIN?.trim();
  if (dev) return `https://${dev}`;
  const host = req.headers.host ?? "localhost";
  return `${req.protocol}://${host}`;
}

function getClientIp(req: Request): string {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string") return fwd.split(",")[0].trim();
  return req.socket?.remoteAddress ?? "unknown";
}

function sha256(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function stableJson(value: unknown): string {
  return JSON.stringify(value, Object.keys(value as any).sort());
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return `{${Object.keys(obj).sort().map(k => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function generateSigningToken(): string {
  return crypto.randomBytes(48).toString("base64url");
}

function signingTokenHash(token: string): string {
  return sha256(token);
}

async function findRecipientByToken(token: string) {
  const tokenHash = signingTokenHash(token);
  const [recipient] = await db
    .select()
    .from(signatureRecipientsTable)
    .where(or(eq(signatureRecipientsTable.tokenHash, tokenHash), eq(signatureRecipientsTable.token, token)))
    .limit(1);
  return recipient ?? null;
}

async function getRequestAuditEvents(requestId: number) {
  return db
    .select({ id: auditLogsTable.id, action: auditLogsTable.action, details: auditLogsTable.details, createdAt: auditLogsTable.createdAt })
    .from(auditLogsTable)
    .where(and(eq(auditLogsTable.resource, "signature_request"), eq(auditLogsTable.resourceId, String(requestId))))
    .orderBy(desc(auditLogsTable.createdAt));
}

async function logSigAction(params: {
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
  }).catch(() => {});
}

async function getRequestOrNull(requestId: number) {
  const [request] = await db.select().from(signatureRequestsTable).where(eq(signatureRequestsTable.id, requestId)).limit(1);
  return request ?? null;
}

async function enforceSigningOrder(requestId: number, recipientOrder: number): Promise<{ ok: true } | { ok: false; message: string }> {
  const blockers = await db
    .select({ id: signatureRecipientsTable.id, name: signatureRecipientsTable.name, status: signatureRecipientsTable.status })
    .from(signatureRecipientsTable)
    .where(and(
      eq(signatureRecipientsTable.requestId, requestId),
      lt(signatureRecipientsTable.order, recipientOrder),
      sql`${signatureRecipientsTable.status} != 'signed'`
    ))
    .limit(1);

  if (blockers.length > 0) {
    return { ok: false, message: `Waiting for prior signer: ${blockers[0].name}` };
  }
  return { ok: true };
}

function buildEvidencePayload(params: {
  requestId: number;
  recipientId: number;
  recipientEmail: string;
  documentHash: string;
  signatureType: string;
  signatureData: string;
  fullName: string;
  ipAddress: string;
  userAgent: string | undefined;
  signedAt: Date;
  formResponses: unknown[];
}) {
  const formResponsesHash = sha256(canonicalJson(params.formResponses ?? []));
  const signatureDataHash = sha256(params.signatureData);
  const payload = {
    version: 1,
    requestId: params.requestId,
    recipientId: params.recipientId,
    recipientEmail: params.recipientEmail.toLowerCase(),
    documentHash: params.documentHash,
    signatureType: params.signatureType,
    signatureDataHash,
    fullName: params.fullName.trim(),
    ipAddress: params.ipAddress,
    userAgent: params.userAgent ?? null,
    signedAt: params.signedAt.toISOString(),
    electronicRecordConsent: true,
    consentText: ELECTRONIC_RECORD_CONSENT_TEXT,
    formResponsesHash,
  };
  return { payload, evidenceHash: sha256(canonicalJson(payload)), signatureDataHash, formResponsesHash };
}

async function getRequestRecipients(requestId: number) {
  return db.select().from(signatureRecipientsTable).where(eq(signatureRecipientsTable.requestId, requestId)).orderBy(signatureRecipientsTable.order);
}

// ─── TEMPLATES ───────────────────────────────────────────────────────────────

router.get("/signature-templates", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  const rows = await db.select().from(signatureTemplatesTable).where(eq(signatureTemplatesTable.isActive, true)).orderBy(desc(signatureTemplatesTable.updatedAt));
  res.json(rows.map(t => ({
    id: t.id,
    name: t.name,
    description: t.description,
    category: t.category,
    content: t.content,
    formSchema: t.formSchema ?? [],
    isActive: t.isActive,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  })));
});

router.get("/signature-templates/:id", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  const [t] = await db.select().from(signatureTemplatesTable).where(eq(signatureTemplatesTable.id, Number(req.params.id)));
  if (!t) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: t.id, name: t.name, description: t.description, category: t.category, content: t.content, formSchema: t.formSchema ?? [], isActive: t.isActive });
});

router.post("/signature-templates", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  const { name, description, category, content, formSchema } = req.body;
  if (!name?.trim() || !content?.trim()) { res.status(400).json({ error: "name and content are required" }); return; }
  const [t] = await db.insert(signatureTemplatesTable).values({
    name: name.trim(),
    description: description?.trim() || null,
    category: category?.trim() || "General",
    content: content.trim(),
    formSchema: Array.isArray(formSchema) ? formSchema : [],
    createdById: userId,
  }).returning();
  res.status(201).json({ id: t.id, name: t.name });
});

router.put("/signature-templates/:id", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  const { name, description, category, content, formSchema, isActive, changeNote } = req.body;
  const templateId = Number(req.params.id);
  const [current] = await db.select().from(signatureTemplatesTable).where(eq(signatureTemplatesTable.id, templateId)).limit(1);
  if (!current) { res.status(404).json({ error: "Not found" }); return; }
  const { templateVersionsTable } = await import("@workspace/db/schema");
  const [latestVer] = await db.select({ version: templateVersionsTable.version }).from(templateVersionsTable).where(eq(templateVersionsTable.templateId, templateId)).orderBy(desc(templateVersionsTable.version)).limit(1);
  const nextVersion = (latestVer?.version ?? 0) + 1;
  await db.insert(templateVersionsTable).values({
    templateId,
    version: nextVersion,
    name: current.name,
    description: current.description ?? null,
    category: current.category,
    content: current.content,
    formSchema: current.formSchema,
    changeNote: changeNote ?? null,
    createdById: userId,
  });
  const [t] = await db.update(signatureTemplatesTable).set({
    name: name?.trim(),
    description: description?.trim() || null,
    category,
    content: content?.trim(),
    formSchema: Array.isArray(formSchema) ? formSchema : undefined,
    isActive,
  }).where(eq(signatureTemplatesTable.id, templateId)).returning();
  if (!t) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: t.id, name: t.name, version: nextVersion });
});

router.delete("/signature-templates/:id", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  await db.update(signatureTemplatesTable).set({ isActive: false }).where(eq(signatureTemplatesTable.id, Number(req.params.id)));
  res.json({ message: "Template deleted" });
});

// ─── REQUESTS ────────────────────────────────────────────────────────────────

router.get("/signature-requests", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  const status = req.query.status as string | undefined;
  const search = req.query.search as string | undefined;
  const conditions: any[] = [];
  if (status) conditions.push(eq(signatureRequestsTable.status, status as any));
  if (search) conditions.push(ilike(signatureRequestsTable.title, `%${search}%`));
  const requests = await db.select({
    id: signatureRequestsTable.id,
    title: signatureRequestsTable.title,
    message: signatureRequestsTable.message,
    status: signatureRequestsTable.status,
    caseId: signatureRequestsTable.caseId,
    expiresAt: signatureRequestsTable.expiresAt,
    completedAt: signatureRequestsTable.completedAt,
    createdAt: signatureRequestsTable.createdAt,
  }).from(signatureRequestsTable).where(conditions.length > 0 ? and(...conditions) : undefined).orderBy(desc(signatureRequestsTable.createdAt));
  const requestsWithRecipients = await Promise.all(requests.map(async r => {
    const recipients = await db.select({ id: signatureRecipientsTable.id, name: signatureRecipientsTable.name, email: signatureRecipientsTable.email, role: signatureRecipientsTable.role, status: signatureRecipientsTable.status, token: signatureRecipientsTable.token }).from(signatureRecipientsTable).where(eq(signatureRecipientsTable.requestId, r.id)).orderBy(signatureRecipientsTable.order);
    let patientName: string | null = null;
    if (r.caseId) {
      const [c] = await db.select({ patientName: casesTable.patientName }).from(casesTable).where(eq(casesTable.id, r.caseId));
      patientName = c?.patientName ?? null;
    }
    return {
      ...r,
      patientName,
      recipientCount: recipients.length,
      signedCount: recipients.filter(r => r.status === "signed").length,
      expiresAt: r.expiresAt?.toISOString() ?? null,
      completedAt: r.completedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
      recipients,
    };
  }));
  const [statsResult] = await Promise.all([db.select({ total: count() }).from(signatureRequestsTable)]);
  const statusCounts = await db.select({ status: signatureRequestsTable.status, count: count() }).from(signatureRequestsTable).groupBy(signatureRequestsTable.status);
  res.json({
    requests: requestsWithRecipients,
    stats: {
      total: statsResult[0]?.total ?? 0,
      pending: (statusCounts.find(s => s.status === "pending")?.count ?? 0) + (statusCounts.find(s => s.status === "partially_signed")?.count ?? 0),
      completed: statusCounts.find(s => s.status === "completed")?.count ?? 0,
      voided: statusCounts.find(s => s.status === "voided")?.count ?? 0,
    },
  });
});

router.get("/signature-requests/:id", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  const id = Number(req.params.id);
  const request = await getRequestOrNull(id);
  if (!request) { res.status(404).json({ error: "Not found" }); return; }
  const [recipients, completedSigs, auditEvents, allFormResponses] = await Promise.all([
    getRequestRecipients(id),
    db.select().from(completedSignaturesTable).where(eq(completedSignaturesTable.requestId, id)),
    getRequestAuditEvents(id),
    db.select().from(formResponsesTable).where(eq(formResponsesTable.requestId, id)),
  ]);
  let patientName: string | null = null;
  if (request.caseId) {
    const [c] = await db.select({ patientName: casesTable.patientName }).from(casesTable).where(eq(casesTable.id, request.caseId));
    patientName = c?.patientName ?? null;
  }
  const formResponses = allFormResponses.map(fr => {
    const rec = recipients.find(r => r.id === fr.recipientId);
    return {
      recipientId: fr.recipientId,
      recipientName: rec?.name ?? "Unknown",
      submittedAt: fr.submittedAt?.toISOString?.() ?? null,
      responses: (fr.responses as { fieldId?: string; label?: string; name?: string; value: string | boolean }[]) ?? [],
    };
  });
  res.json({
    id: request.id,
    title: request.title,
    message: request.message,
    status: request.status,
    documentContent: request.documentContent,
    documentHash: request.documentHash,
    finalEvidenceHash: request.finalEvidenceHash ?? null,
    caseId: request.caseId,
    patientName,
    expiresAt: request.expiresAt?.toISOString() ?? null,
    completedAt: request.completedAt?.toISOString() ?? null,
    voidReason: request.voidReason,
    createdAt: request.createdAt.toISOString(),
    recipients: recipients.map(r => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role,
      order: r.order,
      status: r.status,
      token: r.token,
      viewedAt: r.viewedAt?.toISOString() ?? null,
      signedAt: r.signedAt?.toISOString() ?? null,
      declinedAt: r.declinedAt?.toISOString() ?? null,
      declineReason: r.declineReason,
      ipAddress: r.ipAddress,
      userAgent: r.userAgent,
    })),
    completedSignatures: completedSigs.map(s => ({
      id: s.id,
      recipientId: s.recipientId,
      signatureType: s.signatureType,
      fullName: s.fullName,
      documentHash: s.documentHash,
      signatureHash: s.signatureHash,
      evidenceHash: s.evidenceHash ?? null,
      electronicRecordConsent: s.electronicRecordConsent,
      signedAt: s.signedAt.toISOString(),
      ipAddress: s.ipAddress,
    })),
    formResponses,
    auditEvents: auditEvents.map(e => ({ id: e.id, action: e.action, details: e.details, createdAt: e.createdAt.toISOString() })),
  });
});

router.post("/signature-requests", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  const { title, message, templateId, caseId, documentContent, formSchema, expiryDays, recipients } = req.body;
  if (!title?.trim()) { res.status(400).json({ error: "title is required" }); return; }
  if (!Array.isArray(recipients) || recipients.length === 0) { res.status(400).json({ error: "At least one recipient is required" }); return; }
  const [user] = await db.select({ email: usersTable.email, name: usersTable.name }).from(usersTable).where(eq(usersTable.id, userId));
  let templateContent: string | null = null;
  let templateFormSchema: any[] = [];
  if (templateId) {
    const [tmpl] = await db.select({ content: signatureTemplatesTable.content, formSchema: signatureTemplatesTable.formSchema }).from(signatureTemplatesTable).where(eq(signatureTemplatesTable.id, templateId));
    if (tmpl) {
      templateContent = tmpl.content;
      if (Array.isArray(tmpl.formSchema)) templateFormSchema = tmpl.formSchema as any[];
    }
  }
  const resolvedContent = (typeof documentContent === "string" && documentContent.trim().length > 0) ? documentContent.trim() : (templateContent?.trim() ?? "");
  if (!resolvedContent) { res.status(400).json({ error: "documentContent is required (or provide a valid templateId)" }); return; }
  const resolvedFormSchema: any[] = Array.isArray(formSchema) && formSchema.length > 0 ? formSchema : templateFormSchema;
  const docHash = sha256(resolvedContent);
  const expiresAt = new Date(Date.now() + (expiryDays ?? 7) * 24 * 60 * 60 * 1000);
  const [request] = await db.insert(signatureRequestsTable).values({
    title: title.trim(),
    message: message?.trim() || null,
    templateId: templateId || null,
    caseId: caseId || null,
    documentContent: resolvedContent,
    documentHash: docHash,
    formSchema: resolvedFormSchema,
    status: "pending",
    expiresAt,
    createdById: userId,
  }).returning();
  const baseUrl = getBaseUrl(req);
  const emailResults: { name: string; email: string; sent: boolean; error?: string }[] = [];
  for (const r of recipients) {
    const token = generateSigningToken();
    const tokenExpiresAt = expiresAt;
    await db.insert(signatureRecipientsTable).values({
      requestId: request.id,
      name: r.name.trim(),
      email: r.email.trim().toLowerCase(),
      role: r.role || "signer",
      order: r.order || 1,
      token,
      tokenHash: signingTokenHash(token),
      tokenExpiresAt,
    });
    const emailResult = await sendSigningEmail({
      recipientName: r.name.trim(),
      recipientEmail: r.email.trim().toLowerCase(),
      senderName: user?.name ?? "Occu-Med",
      requestTitle: title.trim(),
      message: message?.trim() || null,
      signingToken: token,
      expiresAt,
      isReminder: false,
      baseUrl,
    });
    emailResults.push({ name: r.name.trim(), email: r.email.trim().toLowerCase(), ...emailResult });
    await logSigAction({ userId, userEmail: user?.email, userName: user?.name, action: emailResult.sent ? "invitation_sent" : "invitation_failed", resourceId: String(request.id), details: `${r.name.trim()} <${r.email.trim().toLowerCase()}> ${emailResult.sent ? "invite sent" : `invite failed (${emailResult.error ?? "unknown error"})`}`, ip: getClientIp(req), ua: req.headers["user-agent"] });
  }
  const emailsSent = emailResults.filter(e => e.sent).length;
  await logSigAction({ userId, userEmail: user?.email, userName: user?.name, action: "created", resourceId: String(request.id), details: `Signature request "${title}" created with ${recipients.length} recipient(s).`, ip: getClientIp(req), ua: req.headers["user-agent"] });
  res.status(201).json({ id: request.id, title: request.title, status: request.status, emailsSent, emailsTotal: recipients.length, emailConfigured: isEmailConfigured(), perRecipient: emailResults });
});

router.post("/signature-requests/:id/void", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  const id = Number(req.params.id);
  const { reason } = req.body;
  const [user] = await db.select({ email: usersTable.email, name: usersTable.name }).from(usersTable).where(eq(usersTable.id, userId));
  const [request] = await db.update(signatureRequestsTable).set({ status: "voided", voidedAt: new Date(), voidReason: reason || "Voided by admin" }).where(eq(signatureRequestsTable.id, id)).returning();
  if (!request) { res.status(404).json({ error: "Not found" }); return; }
  await logSigAction({ userId, userEmail: user?.email, userName: user?.name, action: "voided", resourceId: String(id), details: `Request voided: ${reason}`, ip: getClientIp(req), ua: req.headers["user-agent"] });
  res.json({ message: "Request voided" });
});

router.post("/signature-requests/:id/remind", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  const id = Number(req.params.id);
  const [user] = await db.select({ email: usersTable.email, name: usersTable.name }).from(usersTable).where(eq(usersTable.id, userId));
  const request = await getRequestOrNull(id);
  if (!request) { res.status(404).json({ error: "Not found" }); return; }
  const toRemind = await db.select().from(signatureRecipientsTable).where(and(eq(signatureRecipientsTable.requestId, id), sql`${signatureRecipientsTable.status} IN ('pending', 'viewed')`));
  if (toRemind.length === 0) { res.json({ message: "No pending signers to remind", emailsSent: 0 }); return; }
  const baseUrl = getBaseUrl(req);
  const emailResults: { name: string; email: string; sent: boolean; error?: string }[] = [];
  for (const r of toRemind) {
    const token = r.token ?? "";
    const result = await sendSigningEmail({ recipientName: r.name, recipientEmail: r.email, senderName: user?.name ?? "Occu-Med", requestTitle: request.title, message: request.message, signingToken: token, expiresAt: r.tokenExpiresAt, isReminder: true, baseUrl });
    emailResults.push({ name: r.name, email: r.email, ...result });
    await logSigAction({ userId, userEmail: user?.email, userName: user?.name, action: result.sent ? "reminder_sent" : "reminder_failed", resourceId: String(id), details: `${r.name} <${r.email}> ${result.sent ? "reminder sent" : `reminder failed (${result.error ?? "unknown error"})`}`, ip: getClientIp(req), ua: req.headers["user-agent"] });
  }
  const emailsSent = emailResults.filter(e => e.sent).length;
  res.json({ message: emailsSent > 0 ? `Reminder sent to ${emailsSent} of ${toRemind.length} signer(s) via email` : "Reminder logged — configure SMTP to send emails automatically", emailsSent, emailsTotal: toRemind.length, emailConfigured: isEmailConfigured(), perRecipient: emailResults });
});

// ─── SETTINGS ────────────────────────────────────────────────────────────────

router.get("/signature-settings/smtp-status", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  const configured = isEmailConfigured();
  if (!configured) {
    res.json({ configured: false, connected: false, message: "SMTP not configured.", vars: { SMTP_HOST: Boolean(process.env.SMTP_HOST), SMTP_PORT: Boolean(process.env.SMTP_PORT), SMTP_USER: Boolean(process.env.SMTP_USER), SMTP_PASS: Boolean(process.env.SMTP_PASS), SMTP_FROM: Boolean(process.env.SMTP_FROM), SMTP_FROM_NAME: Boolean(process.env.SMTP_FROM_NAME), SMTP_SECURE: Boolean(process.env.SMTP_SECURE) } });
    return;
  }
  const result = await verifySmtpConnection();
  res.json({ configured: true, connected: result.ok, message: result.ok ? "SMTP connection verified" : `SMTP connection failed: ${result.error}`, host: process.env.SMTP_HOST, port: process.env.SMTP_PORT ?? "587", user: process.env.SMTP_USER, fromAddress: process.env.SMTP_FROM ?? process.env.SMTP_USER });
});

router.post("/signature-settings/test-email", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  const [user] = await db.select({ email: usersTable.email, name: usersTable.name }).from(usersTable).where(eq(usersTable.id, userId));
  const { testEmail } = req.body;
  const toEmail = testEmail?.trim() || user?.email;
  if (!toEmail) { res.status(400).json({ error: "No email address" }); return; }
  const result = await sendSigningEmail({ recipientName: user?.name ?? "Occu-Med User", recipientEmail: toEmail, senderName: "PacketPath System", requestTitle: "SMTP Test — Email Delivery Verification", message: "This is a test email to verify your SMTP configuration is working correctly.", signingToken: "test-token-not-valid", expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), isReminder: false, baseUrl: getBaseUrl(req) });
  res.json({ sent: result.sent, error: result.error, toEmail });
});

// ─── PUBLIC SIGNING ENDPOINTS ────────────────────────────────────────────────

router.get("/sign/:token", async (req, res): Promise<void> => {
  const recipient = await findRecipientByToken(req.params.token);
  if (!recipient) { res.status(404).json({ error: "Invalid signing link" }); return; }
  if (recipient.status === "signed") { res.status(409).json({ status: "already_signed", error: "Already signed" }); return; }
  if (recipient.status === "declined") { res.status(410).json({ status: "declined", error: "Declined" }); return; }
  if (recipient.tokenExpiresAt < new Date()) { res.status(410).json({ status: "expired", error: "Signing link expired" }); return; }
  const request = await getRequestOrNull(recipient.requestId);
  if (!request || request.status === "voided") { res.status(410).json({ status: "voided", error: "Request voided" }); return; }
  if (request.status === "completed") { res.status(409).json({ status: "completed", error: "Already completed" }); return; }
  const order = await enforceSigningOrder(request.id, recipient.order);
  res.json({ requestId: request.id, requestTitle: request.title, message: request.message, documentContent: request.documentContent, documentHash: request.documentHash, formSchema: request.formSchema ?? [], recipientName: recipient.name, recipientEmail: recipient.email, recipientRole: recipient.role, status: recipient.status, signingOrderReady: order.ok, signingOrderMessage: order.ok ? null : order.message, electronicRecordConsentText: ELECTRONIC_RECORD_CONSENT_TEXT, organizationName: "Occu-Med Occupational Health" });
});

router.post("/sign/:token/view", async (req, res): Promise<void> => {
  const recipient = await findRecipientByToken(req.params.token);
  const ip = getClientIp(req);
  const ua = req.headers["user-agent"];
  if (!recipient) { res.status(404).json({ error: "Not found" }); return; }
  if (recipient.status === "pending") {
    await db.update(signatureRecipientsTable).set({ status: "viewed", viewedAt: new Date(), ipAddress: ip, userAgent: ua }).where(eq(signatureRecipientsTable.id, recipient.id));
    await logSigAction({ action: "viewed", resourceId: String(recipient.requestId), details: `${recipient.name} (${recipient.email}) viewed the document from ${ip}`, ip, ua });
  }
  res.json({ message: "Viewed" });
});

router.post("/sign/:token/complete", signingCompletionLimiter, async (req, res): Promise<void> => {
  const { signatureType, signatureData, fullName, formResponses, electronicRecordConsent } = req.body;
  const ip = getClientIp(req);
  const ua = req.headers["user-agent"];
  if (!signatureType || !signatureData || !fullName) { res.status(400).json({ error: "signatureType, signatureData, and fullName are required" }); return; }
  if (electronicRecordConsent !== true) { res.status(400).json({ error: "Electronic records and signature consent is required" }); return; }
  const recipient = await findRecipientByToken(req.params.token);
  if (!recipient) { res.status(404).json({ error: "Invalid signing link" }); return; }
  if (recipient.status === "signed") { res.status(409).json({ error: "Already signed" }); return; }
  if (recipient.status === "declined") { res.status(410).json({ error: "Recipient declined" }); return; }
  if (recipient.tokenExpiresAt < new Date()) { res.status(410).json({ error: "Token expired" }); return; }
  const request = await getRequestOrNull(recipient.requestId);
  if (!request || request.status === "voided") { res.status(410).json({ error: "Request voided or not found" }); return; }
  if (request.status === "completed") { res.status(409).json({ error: "Request already completed" }); return; }
  const order = await enforceSigningOrder(request.id, recipient.order);
  if (!order.ok) { res.status(409).json({ error: order.message }); return; }
  const signedAt = new Date();
  const normalizedResponses = Array.isArray(formResponses) ? formResponses : [];
  const { payload, evidenceHash, signatureDataHash } = buildEvidencePayload({ requestId: request.id, recipientId: recipient.id, recipientEmail: recipient.email, documentHash: request.documentHash, signatureType, signatureData, fullName, ipAddress: ip, userAgent: ua, signedAt, formResponses: normalizedResponses });
  const sigHash = sha256(signatureData + fullName.trim() + ip + request.documentHash);
  const txResult = await (db as any).transaction(async (tx: any) => {
    await tx.insert(completedSignaturesTable).values({ recipientId: recipient.id, requestId: request.id, signatureType, signatureData, fullName: fullName.trim(), ipAddress: ip, userAgent: ua, documentHash: request.documentHash, signatureHash: sigHash, evidenceHash, evidencePayload: payload, electronicRecordConsent: true, consentText: ELECTRONIC_RECORD_CONSENT_TEXT, signedAt });
    if (normalizedResponses.length > 0) {
      await tx.insert(formResponsesTable).values({ requestId: request.id, recipientId: recipient.id, responses: normalizedResponses }).onConflictDoNothing();
    }
    await tx.update(signatureRecipientsTable).set({ status: "signed", signedAt, ipAddress: ip, userAgent: ua }).where(eq(signatureRecipientsTable.id, recipient.id));
    const allRecipients = await tx.select({ id: signatureRecipientsTable.id, status: signatureRecipientsTable.status }).from(signatureRecipientsTable).where(eq(signatureRecipientsTable.requestId, request.id));
    const allSigned = allRecipients.every((r: { status: string }) => r.status === "signed");
    const anySigned = allRecipients.some((r: { status: string }) => r.status === "signed");
    const newStatus = allSigned ? "completed" : anySigned ? "partially_signed" : "pending";
    const finalEvidenceHash = allSigned ? sha256(canonicalJson({ requestId: request.id, documentHash: request.documentHash, completedAt: signedAt.toISOString(), signerEvidenceHash: evidenceHash })) : null;
    await tx.update(signatureRequestsTable).set({ status: newStatus, completedAt: allSigned ? signedAt : null, finalEvidenceHash }).where(eq(signatureRequestsTable.id, request.id));
    return { newStatus, allSigned, finalEvidenceHash };
  });
  await logSigAction({ action: "signed", resourceId: String(request.id), details: `${recipient.name} (${recipient.email}) signed from ${ip}; evidence hash: ${evidenceHash}; signature data hash: ${signatureDataHash}`, ip, ua });
  if (txResult.allSigned) await logSigAction({ action: "completed", resourceId: String(request.id), details: `All recipients have signed. Final evidence hash: ${txResult.finalEvidenceHash}` });
  res.json({ message: "Signature recorded", status: txResult.newStatus, evidenceHash, finalEvidenceHash: txResult.finalEvidenceHash });
});

router.post("/sign/:token/decline", async (req, res): Promise<void> => {
  const recipient = await findRecipientByToken(req.params.token);
  const { reason } = req.body;
  const ip = getClientIp(req);
  const ua = req.headers["user-agent"];
  if (!recipient) { res.status(404).json({ error: "Not found" }); return; }
  await db.update(signatureRecipientsTable).set({ status: "declined", declinedAt: new Date(), declineReason: reason || null, ipAddress: ip, userAgent: ua }).where(eq(signatureRecipientsTable.id, recipient.id));
  await logSigAction({ action: "declined", resourceId: String(recipient.requestId), details: `${recipient.name} (${recipient.email}) declined; reason: ${reason ?? "none provided"}`, ip, ua });
  res.json({ message: "Declined" });
});

// ─── PDF ─────────────────────────────────────────────────────────────────────

router.get("/signature-requests/:id/pdf", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  const id = Number(req.params.id);
  const request = await getRequestOrNull(id);
  if (!request) { res.status(404).json({ error: "Not found" }); return; }
  const [recipients, completedSigs, auditEvents, allFormResponses] = await Promise.all([
    getRequestRecipients(id),
    db.select().from(completedSignaturesTable).where(eq(completedSignaturesTable.requestId, id)),
    getRequestAuditEvents(id),
    db.select().from(formResponsesTable).where(eq(formResponsesTable.requestId, id)),
  ]);
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
  const formResponsesForPdf = allFormResponses.map(fr => ({ recipientId: fr.recipientId, recipientName: recipients.find(r => r.id === fr.recipientId)?.name ?? "Unknown", responses: (fr.responses as { fieldId: string; label: string; value: string }[]) ?? [] }));
  const { generateSignedDocumentPdf } = await import("../lib/pdf.js");
  const safeFileName = request.title.replace(/[^a-z0-9]/gi, "_").toLowerCase().slice(0, 60);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="PacketPath_${safeFileName}_PKT-SIG-${String(id).padStart(5, "0")}.pdf"`);
  res.setHeader("Cache-Control", "no-store");
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
    recipients: recipients.map(r => ({ id: r.id, name: r.name, email: r.email, role: r.role, order: r.order, status: r.status, signedAt: r.signedAt, ipAddress: r.ipAddress, userAgent: r.userAgent, declinedAt: r.declinedAt, declineReason: r.declineReason })),
    completedSignatures: completedSigs.map(s => ({ recipientId: s.recipientId, signatureType: s.signatureType, signatureData: s.signatureData, fullName: s.fullName, documentHash: s.documentHash, signatureHash: s.evidenceHash ?? s.signatureHash, signedAt: s.signedAt, ipAddress: s.ipAddress })),
    auditEvents: auditEvents.map(e => ({ action: e.action, details: e.details, createdAt: e.createdAt })),
  });
  (pdfStream as any).pipe(res);
  await logSigAction({ userId, action: "pdf_downloaded", resourceId: String(id), details: `PDF downloaded for "${request.title}"`, ip: getClientIp(req), ua: req.headers["user-agent"] });
});

// ─── BULK ACTIONS / SMS ─────────────────────────────────────────────────────

router.post("/signature-requests/bulk/void", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  const { ids, reason } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) { res.status(400).json({ error: "ids array required" }); return; }
  const [user] = await db.select({ email: usersTable.email, name: usersTable.name }).from(usersTable).where(eq(usersTable.id, userId));
  const results: { id: number; success: boolean }[] = [];
  for (const id of ids.slice(0, 50)) {
    const [updated] = await db.update(signatureRequestsTable).set({ status: "voided", voidedAt: new Date(), voidReason: reason || "Bulk voided by admin" }).where(and(eq(signatureRequestsTable.id, Number(id)), sql`${signatureRequestsTable.status} != 'voided'`)).returning();
    if (updated) await logSigAction({ userId, userEmail: user?.email, userName: user?.name, action: "bulk_voided", resourceId: String(id), details: `Bulk voided: ${reason || "No reason"}`, ip: getClientIp(req), ua: req.headers["user-agent"] });
    results.push({ id: Number(id), success: Boolean(updated) });
  }
  res.json({ voided: results.filter(r => r.success).length, results });
});

router.post("/signature-requests/bulk/remind", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) { res.status(400).json({ error: "ids array required" }); return; }
  const [user] = await db.select({ email: usersTable.email, name: usersTable.name }).from(usersTable).where(eq(usersTable.id, userId));
  const baseUrl = getBaseUrl(req);
  let totalSent = 0;
  let totalFailed = 0;
  for (const id of ids.slice(0, 20)) {
    const request = await getRequestOrNull(Number(id));
    if (!request || !["pending", "partially_signed"].includes(request.status)) continue;
    const pendingRecipients = await db.select().from(signatureRecipientsTable).where(and(eq(signatureRecipientsTable.requestId, Number(id)), sql`${signatureRecipientsTable.status} IN ('pending', 'viewed')`));
    for (const r of pendingRecipients) {
      const result = await sendSigningEmail({ recipientName: r.name, recipientEmail: r.email, senderName: user?.name ?? "Occu-Med", requestTitle: request.title, message: request.message, signingToken: r.token ?? "", expiresAt: r.tokenExpiresAt, isReminder: true, baseUrl });
      if (result.sent) totalSent++; else totalFailed++;
    }
  }
  res.json({ message: `Bulk reminder: ${totalSent} emails sent, ${totalFailed} failed`, totalSent, totalFailed });
});

router.post("/signature-requests/:id/sms", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  const id = Number(req.params.id);
  const { isReminder = false } = req.body;
  const request = await getRequestOrNull(id);
  if (!request) { res.status(404).json({ error: "Not found" }); return; }
  const pendingRecipients = await db.select().from(signatureRecipientsTable).where(and(eq(signatureRecipientsTable.requestId, id), sql`${signatureRecipientsTable.status} IN ('pending', 'viewed')`));
  const { sendSigningSms, isSmsConfigured } = await import("../lib/sms.js");
  if (!isSmsConfigured()) { res.json({ sent: 0, message: "SMS not configured" }); return; }
  const baseUrl = getBaseUrl(req);
  const results: { name: string; sent: boolean; error?: string }[] = [];
  for (const r of pendingRecipients) {
    const phones: Record<string, string> = req.body.phones ?? {};
    const phone = phones[String(r.id)];
    if (!phone) { results.push({ name: r.name, sent: false, error: "No phone number" }); continue; }
    const result = await sendSigningSms({ recipientName: r.name, recipientPhone: phone, requestTitle: request.title, signingToken: r.token ?? "", baseUrl, isReminder });
    results.push({ name: r.name, ...result });
  }
  res.json({ sent: results.filter(r => r.sent).length, total: pendingRecipients.length, results });
});

router.get("/signature-settings/sms-status", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  const { isSmsConfigured } = await import("../lib/sms.js");
  res.json({ configured: isSmsConfigured(), vars: { TWILIO_ACCOUNT_SID: Boolean(process.env.TWILIO_ACCOUNT_SID), TWILIO_AUTH_TOKEN: Boolean(process.env.TWILIO_AUTH_TOKEN), TWILIO_FROM_NUMBER: Boolean(process.env.TWILIO_FROM_NUMBER) } });
});

export default router;
