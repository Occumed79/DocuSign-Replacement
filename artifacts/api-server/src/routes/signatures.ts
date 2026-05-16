import { Router, type IRouter, type Request } from "express";
import { db, signatureTemplatesTable, signatureRequestsTable, signatureRecipientsTable, completedSignaturesTable, formResponsesTable, auditLogsTable, usersTable, casesTable } from "@workspace/db";
import { eq, desc, and, count, sql, or, ilike } from "drizzle-orm";
import { requireAuth } from "../lib/require-auth";
import { sendSigningEmail, verifySmtpConnection, isEmailConfigured } from "../lib/email";
import crypto from "crypto";

function getBaseUrl(req: Request): string {
  // Prefer explicit deploy URL first (Render/production), then Replit domains, then request host.
  const explicit = process.env.APP_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const domains = process.env.REPLIT_DOMAINS?.split(",")[0]?.trim();
  if (domains) return `https://${domains}`;
  const dev = process.env.REPLIT_DEV_DOMAIN?.trim();
  if (dev) return `https://${dev}`;
  const host = req.headers.host ?? "localhost";
  return `${req.protocol}://${host}`;
}

const router: IRouter = Router();

function getClientIp(req: Request): string {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string") return fwd.split(",")[0].trim();
  return req.socket?.remoteAddress ?? "unknown";
}

function sha256(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function generateSigningToken(): string {
  return crypto.randomBytes(48).toString("base64url");
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

// ─── TEMPLATES ───────────────────────────────────────────────────────────────

// GET /api/signature-templates
router.get("/signature-templates", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const rows = await db
    .select()
    .from(signatureTemplatesTable)
    .where(eq(signatureTemplatesTable.isActive, true))
    .orderBy(desc(signatureTemplatesTable.updatedAt));

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

// GET /api/signature-templates/:id
router.get("/signature-templates/:id", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  const [t] = await db.select().from(signatureTemplatesTable).where(eq(signatureTemplatesTable.id, Number(req.params.id)));
  if (!t) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: t.id, name: t.name, description: t.description, category: t.category, content: t.content, formSchema: t.formSchema ?? [], isActive: t.isActive });
});

// POST /api/signature-templates
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

// PUT /api/signature-templates/:id
router.put("/signature-templates/:id", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  const { name, description, category, content, formSchema, isActive, changeNote } = req.body;
  const templateId = Number(req.params.id);

  // Snapshot current version before overwriting
  const [current] = await db.select().from(signatureTemplatesTable).where(eq(signatureTemplatesTable.id, templateId)).limit(1);
  if (!current) { res.status(404).json({ error: "Not found" }); return; }

  // Determine next version number
  const { templateVersionsTable } = await import("@workspace/db/schema");
  const [latestVer] = await db
    .select({ version: templateVersionsTable.version })
    .from(templateVersionsTable)
    .where(eq(templateVersionsTable.templateId, templateId))
    .orderBy(desc(templateVersionsTable.version))
    .limit(1);
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

  const [t] = await db
    .update(signatureTemplatesTable)
    .set({
      name: name?.trim(), description: description?.trim() || null, category,
      content: content?.trim(),
      formSchema: Array.isArray(formSchema) ? formSchema : undefined,
      isActive,
    })
    .where(eq(signatureTemplatesTable.id, templateId))
    .returning();
  if (!t) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: t.id, name: t.name, version: nextVersion });
});

// DELETE /api/signature-templates/:id
router.delete("/signature-templates/:id", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  await db.update(signatureTemplatesTable).set({ isActive: false }).where(eq(signatureTemplatesTable.id, Number(req.params.id)));
  res.json({ message: "Template deleted" });
});

// ─── REQUESTS ────────────────────────────────────────────────────────────────

// GET /api/signature-requests
router.get("/signature-requests", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const status = req.query.status as string | undefined;
  const search = req.query.search as string | undefined;

  const conditions: any[] = [];
  if (status) conditions.push(eq(signatureRequestsTable.status, status as any));
  if (search) conditions.push(ilike(signatureRequestsTable.title, `%${search}%`));

  const requests = await db
    .select({
      id: signatureRequestsTable.id,
      title: signatureRequestsTable.title,
      message: signatureRequestsTable.message,
      status: signatureRequestsTable.status,
      caseId: signatureRequestsTable.caseId,
      expiresAt: signatureRequestsTable.expiresAt,
      completedAt: signatureRequestsTable.completedAt,
      createdAt: signatureRequestsTable.createdAt,
    })
    .from(signatureRequestsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(signatureRequestsTable.createdAt));

  const requestsWithRecipients = await Promise.all(
    requests.map(async r => {
      const recipients = await db
        .select({ id: signatureRecipientsTable.id, name: signatureRecipientsTable.name, email: signatureRecipientsTable.email, role: signatureRecipientsTable.role, status: signatureRecipientsTable.status, token: signatureRecipientsTable.token })
        .from(signatureRecipientsTable)
        .where(eq(signatureRecipientsTable.requestId, r.id))
        .orderBy(signatureRecipientsTable.order);

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
    })
  );

  const [statsResult] = await Promise.all([
    db.select({
      total: count(),
    }).from(signatureRequestsTable),
  ]);

  const statusCounts = await db
    .select({ status: signatureRequestsTable.status, count: count() })
    .from(signatureRequestsTable)
    .groupBy(signatureRequestsTable.status);

  const stats = {
    total: statsResult[0]?.total ?? 0,
    pending: (statusCounts.find(s => s.status === "pending")?.count ?? 0) + (statusCounts.find(s => s.status === "partially_signed")?.count ?? 0),
    completed: statusCounts.find(s => s.status === "completed")?.count ?? 0,
    voided: statusCounts.find(s => s.status === "voided")?.count ?? 0,
  };

  res.json({ requests: requestsWithRecipients, stats });
});

// GET /api/signature-requests/:id
router.get("/signature-requests/:id", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const id = Number(req.params.id);
  const [request] = await db.select().from(signatureRequestsTable).where(eq(signatureRequestsTable.id, id));
  if (!request) { res.status(404).json({ error: "Not found" }); return; }

  const [recipients, completedSigs, auditEvents, allFormResponses] = await Promise.all([
    db.select().from(signatureRecipientsTable).where(eq(signatureRecipientsTable.requestId, id)).orderBy(signatureRecipientsTable.order),
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
      signedAt: s.signedAt.toISOString(),
      ipAddress: s.ipAddress,
    })),
    formResponses,
    auditEvents: auditEvents.map(e => ({
      id: e.id,
      action: e.action,
      details: e.details,
      createdAt: e.createdAt.toISOString(),
    })),
  });
});

// POST /api/signature-requests
router.post("/signature-requests", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const { title, message, templateId, caseId, documentContent, formSchema, expiryDays, recipients } = req.body;
  if (!title?.trim()) { res.status(400).json({ error: "title is required" }); return; }
  if (!Array.isArray(recipients) || recipients.length === 0) { res.status(400).json({ error: "At least one recipient is required" }); return; }

  const [user] = await db.select({ email: usersTable.email, name: usersTable.name }).from(usersTable).where(eq(usersTable.id, userId));

  // Resolve template-backed content/schema when caller only provides templateId.
  let templateContent: string | null = null;
  let templateFormSchema: any[] = [];
  if (templateId) {
    const [tmpl] = await db.select({ content: signatureTemplatesTable.content, formSchema: signatureTemplatesTable.formSchema }).from(signatureTemplatesTable).where(eq(signatureTemplatesTable.id, templateId));
    if (tmpl) {
      templateContent = tmpl.content;
      if (Array.isArray(tmpl.formSchema)) templateFormSchema = tmpl.formSchema as any[];
    }
  }

  const resolvedContent = (typeof documentContent === "string" && documentContent.trim().length > 0)
    ? documentContent.trim()
    : (templateContent?.trim() ?? "");
  if (!resolvedContent) { res.status(400).json({ error: "documentContent is required (or provide a valid templateId)" }); return; }

  let resolvedFormSchema: any[] = Array.isArray(formSchema) && formSchema.length > 0 ? formSchema : templateFormSchema;

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

  // Create recipients with secure tokens, then send signing emails
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
      tokenExpiresAt,
    });

    // Send signing email (non-blocking — don't fail the request if email fails)
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

    await logSigAction({
      userId,
      userEmail: user?.email,
      userName: user?.name,
      action: emailResult.sent ? "invitation_sent" : "invitation_failed",
      resourceId: String(request.id),
      details: `${r.name.trim()} <${r.email.trim().toLowerCase()}> ${emailResult.sent ? "invite sent" : `invite failed (${emailResult.error ?? "unknown error"})`}`,
      ip: getClientIp(req),
      ua: req.headers["user-agent"],
    });
  }

  const emailsSent = emailResults.filter(e => e.sent).length;
  const emailDetail = emailResults.map(e => `${e.name} <${e.email}>: ${e.sent ? "pending" : `failed (${e.error})`}`).join("; ");

  await logSigAction({
    userId,
    userEmail: user?.email,
    userName: user?.name,
    action: "created",
    resourceId: String(request.id),
    details: `Signature request "${title}" created with ${recipients.length} recipient(s). Emails: ${emailDetail}`,
    ip: getClientIp(req),
    ua: req.headers["user-agent"],
  });

  res.status(201).json({
    id: request.id,
    title: request.title,
    status: request.status,
    emailsSent,
    emailsTotal: recipients.length,
    emailConfigured: isEmailConfigured(),
    perRecipient: emailResults,
  });
});

// POST /api/signature-requests/:id/void
router.post("/signature-requests/:id/void", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const id = Number(req.params.id);
  const { reason } = req.body;

  const [user] = await db.select({ email: usersTable.email, name: usersTable.name }).from(usersTable).where(eq(usersTable.id, userId));

  const [request] = await db
    .update(signatureRequestsTable)
    .set({ status: "voided", voidedAt: new Date(), voidReason: reason || "Voided by admin" })
    .where(eq(signatureRequestsTable.id, id))
    .returning();

  if (!request) { res.status(404).json({ error: "Not found" }); return; }

  await logSigAction({
    userId, userEmail: user?.email, userName: user?.name,
    action: "voided", resourceId: String(id),
    details: `Request voided: ${reason}`, ip: getClientIp(req), ua: req.headers["user-agent"],
  });

  res.json({ message: "Request voided" });
});

// POST /api/signature-requests/:id/remind
router.post("/signature-requests/:id/remind", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const id = Number(req.params.id);
  const [user] = await db.select({ email: usersTable.email, name: usersTable.name }).from(usersTable).where(eq(usersTable.id, userId));

  const [request] = await db.select().from(signatureRequestsTable).where(eq(signatureRequestsTable.id, id));
  if (!request) { res.status(404).json({ error: "Not found" }); return; }

  const pendingRecipients = await db
    .select()
    .from(signatureRecipientsTable)
    .where(and(eq(signatureRecipientsTable.requestId, id), eq(signatureRecipientsTable.status, "pending")));

  const viewedRecipients = await db
    .select()
    .from(signatureRecipientsTable)
    .where(and(eq(signatureRecipientsTable.requestId, id), eq(signatureRecipientsTable.status, "viewed")));

  const toRemind = [...pendingRecipients, ...viewedRecipients];
  if (toRemind.length === 0) {
    res.json({ message: "No pending signers to remind", emailsSent: 0 });
    return;
  }

  const baseUrl = getBaseUrl(req);
  const emailResults: { name: string; email: string; sent: boolean; error?: string }[] = [];

  for (const r of toRemind) {
    const result = await sendSigningEmail({
      recipientName: r.name,
      recipientEmail: r.email,
      senderName: user?.name ?? "Occu-Med",
      requestTitle: request.title,
      message: request.message,
      signingToken: r.token,
      expiresAt: r.tokenExpiresAt,
      isReminder: true,
      baseUrl,
    });
    emailResults.push({ name: r.name, email: r.email, ...result });

    await logSigAction({
      userId,
      userEmail: user?.email,
      userName: user?.name,
      action: result.sent ? "reminder_sent" : "reminder_failed",
      resourceId: String(id),
      details: `${r.name} <${r.email}> ${result.sent ? "reminder sent" : `reminder failed (${result.error ?? "unknown error"})`}`,
      ip: getClientIp(req),
      ua: req.headers["user-agent"],
    });
  }

  const emailsSent = emailResults.filter(e => e.sent).length;
  const emailDetail = emailResults.map(e => `${e.name} <${e.email}>: ${e.sent ? "reminded" : `failed (${e.error})`}`).join("; ");

  await logSigAction({
    userId, userEmail: user?.email, userName: user?.name,
    action: "reminder_sent", resourceId: String(id),
    details: `Reminder sent to ${toRemind.length} signer(s). ${emailDetail}`,
    ip: getClientIp(req), ua: req.headers["user-agent"],
  });

  res.json({
    message: emailsSent > 0
      ? `Reminder sent to ${emailsSent} of ${toRemind.length} signer(s) via email`
      : "Reminder logged — configure SMTP to send emails automatically",
    emailsSent,
    emailsTotal: toRemind.length,
    emailConfigured: isEmailConfigured(),
    perRecipient: emailResults,
  });
});

// GET /api/signature-settings/smtp-status
router.get("/signature-settings/smtp-status", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const configured = isEmailConfigured();
  if (!configured) {
    res.json({
      configured: false,
      connected: false,
      message: "SMTP not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables.",
      vars: {
        SMTP_HOST: Boolean(process.env.SMTP_HOST),
        SMTP_PORT: Boolean(process.env.SMTP_PORT),
        SMTP_USER: Boolean(process.env.SMTP_USER),
        SMTP_PASS: Boolean(process.env.SMTP_PASS),
        SMTP_FROM: Boolean(process.env.SMTP_FROM),
        SMTP_FROM_NAME: Boolean(process.env.SMTP_FROM_NAME),
        SMTP_SECURE: Boolean(process.env.SMTP_SECURE),
      },
    });
    return;
  }

  const result = await verifySmtpConnection();
  res.json({
    configured: true,
    connected: result.ok,
    message: result.ok ? "SMTP connection verified" : `SMTP connection failed: ${result.error}`,
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ?? "587",
    user: process.env.SMTP_USER,
    fromAddress: process.env.SMTP_FROM ?? process.env.SMTP_USER,
  });
});

// POST /api/signature-settings/test-email
router.post("/signature-settings/test-email", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const [user] = await db.select({ email: usersTable.email, name: usersTable.name }).from(usersTable).where(eq(usersTable.id, userId));
  const { testEmail } = req.body;
  const toEmail = testEmail?.trim() || user?.email;

  if (!toEmail) { res.status(400).json({ error: "No email address" }); return; }

  const baseUrl = getBaseUrl(req);
  const result = await sendSigningEmail({
    recipientName: user?.name ?? "Occu-Med User",
    recipientEmail: toEmail,
    senderName: "PacketPath System",
    requestTitle: "SMTP Test — Email Delivery Verification",
    message: "This is a test email to verify your SMTP configuration is working correctly.",
    signingToken: "test-token-not-valid",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    isReminder: false,
    baseUrl,
  });

  res.json({ sent: result.sent, error: result.error, toEmail });
});

// ─── PUBLIC SIGNING ENDPOINTS (no auth) ──────────────────────────────────────

// GET /api/sign/:token
router.get("/sign/:token", async (req, res): Promise<void> => {
  const { token } = req.params;

  const [recipient] = await db
    .select()
    .from(signatureRecipientsTable)
    .where(eq(signatureRecipientsTable.token, token))
    .limit(1);

  if (!recipient) {
    res.status(404).json({ error: "Invalid signing link" });
    return;
  }

  if (recipient.status === "signed") {
    res.status(409).json({ status: "already_signed", error: "Already signed" });
    return;
  }
  if (recipient.status === "declined") {
    res.status(410).json({ status: "declined", error: "Declined" });
    return;
  }
  if (recipient.tokenExpiresAt < new Date()) {
    res.status(410).json({ status: "expired", error: "Signing link expired" });
    return;
  }

  const [request] = await db
    .select()
    .from(signatureRequestsTable)
    .where(eq(signatureRequestsTable.id, recipient.requestId))
    .limit(1);

  if (!request || request.status === "voided") {
    res.status(410).json({ status: "voided", error: "Request voided" });
    return;
  }
  if (request.status === "completed") {
    res.status(409).json({ status: "completed", error: "Already completed" });
    return;
  }

  res.json({
    requestId: request.id,
    requestTitle: request.title,
    message: request.message,
    documentContent: request.documentContent,
    formSchema: request.formSchema ?? [],
    recipientName: recipient.name,
    recipientEmail: recipient.email,
    recipientRole: recipient.role,
    status: recipient.status,
    organizationName: "Occu-Med Occupational Health",
  });
});

// POST /api/sign/:token/view
router.post("/sign/:token/view", async (req, res): Promise<void> => {
  const { token } = req.params;
  const ip = getClientIp(req);
  const ua = req.headers["user-agent"];

  const [recipient] = await db
    .select()
    .from(signatureRecipientsTable)
    .where(eq(signatureRecipientsTable.token, token))
    .limit(1);

  if (!recipient) { res.status(404).json({ error: "Not found" }); return; }

  if (recipient.status === "pending") {
    await db.update(signatureRecipientsTable)
      .set({ status: "viewed", viewedAt: new Date(), ipAddress: ip, userAgent: ua })
      .where(eq(signatureRecipientsTable.token, token));

    await logSigAction({
      action: "viewed", resourceId: String(recipient.requestId),
      details: `${recipient.name} (${recipient.email}) viewed the document from ${ip}`,
      ip, ua,
    });
  }

  res.json({ message: "Viewed" });
});

// POST /api/sign/:token/complete
router.post("/sign/:token/complete", async (req, res): Promise<void> => {
  const { token } = req.params;
  const { signatureType, signatureData, fullName, formResponses } = req.body;
  const ip = getClientIp(req);
  const ua = req.headers["user-agent"];

  if (!signatureType || !signatureData || !fullName) {
    res.status(400).json({ error: "signatureType, signatureData, and fullName are required" });
    return;
  }

  const [recipient] = await db
    .select()
    .from(signatureRecipientsTable)
    .where(eq(signatureRecipientsTable.token, token))
    .limit(1);

  if (!recipient) { res.status(404).json({ error: "Invalid signing link" }); return; }
  if (recipient.status === "signed") { res.status(409).json({ error: "Already signed" }); return; }
  if (recipient.tokenExpiresAt < new Date()) { res.status(410).json({ error: "Token expired" }); return; }

  const [request] = await db
    .select()
    .from(signatureRequestsTable)
    .where(eq(signatureRequestsTable.id, recipient.requestId))
    .limit(1);

  if (!request || request.status === "voided") {
    res.status(410).json({ error: "Request voided or not found" });
    return;
  }

  const sigHash = sha256(signatureData + fullName + ip);

  // Save the completed signature
  await db.insert(completedSignaturesTable).values({
    recipientId: recipient.id,
    requestId: request.id,
    signatureType,
    signatureData,
    fullName,
    ipAddress: ip,
    userAgent: ua,
    documentHash: request.documentHash,
    signatureHash: sigHash,
  });

  // Save form responses if provided
  if (Array.isArray(formResponses) && formResponses.length > 0) {
    await db.insert(formResponsesTable).values({
      requestId: request.id,
      recipientId: recipient.id,
      responses: formResponses,
    }).onConflictDoNothing();
  }

  // Update recipient
  await db.update(signatureRecipientsTable)
    .set({ status: "signed", signedAt: new Date(), ipAddress: ip, userAgent: ua })
    .where(eq(signatureRecipientsTable.id, recipient.id));

  await logSigAction({
    action: "signed", resourceId: String(request.id),
    details: `${recipient.name} (${recipient.email}) signed from ${ip} — hash: ${sigHash.slice(0, 16)}...`,
    ip, ua,
  });

  // Check if all recipients have signed → mark request completed
  const allRecipients = await db
    .select({ status: signatureRecipientsTable.status })
    .from(signatureRecipientsTable)
    .where(eq(signatureRecipientsTable.requestId, request.id));

  const allSigned = allRecipients.every(r => r.status === "signed");
  const anySigned = allRecipients.some(r => r.status === "signed");

  const newStatus = allSigned ? "completed" : anySigned ? "partially_signed" : "pending";
  await db.update(signatureRequestsTable)
    .set({
      status: newStatus as any,
      completedAt: allSigned ? new Date() : null,
    })
    .where(eq(signatureRequestsTable.id, request.id));

  if (allSigned) {
    await logSigAction({
      action: "completed", resourceId: String(request.id),
      details: `All recipients have signed. Request "${request.title}" is fully executed.`,
    });
  }

  res.json({ message: "Signature recorded", status: newStatus });
});

// GET /api/signature-requests/:id/pdf
router.get("/signature-requests/:id/pdf", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const id = Number(req.params.id);

  const [request] = await db.select().from(signatureRequestsTable).where(eq(signatureRequestsTable.id, id));
  if (!request) { res.status(404).json({ error: "Not found" }); return; }

  const [recipients, completedSigs, auditEvents, allFormResponses] = await Promise.all([
    db.select().from(signatureRecipientsTable).where(eq(signatureRecipientsTable.requestId, id)).orderBy(signatureRecipientsTable.order),
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

  // Map form responses to include recipient name
  const formResponsesForPdf = allFormResponses.map(fr => {
    const rec = recipients.find(r => r.id === fr.recipientId);
    return {
      recipientId: fr.recipientId,
      recipientName: rec?.name ?? "Unknown",
      responses: (fr.responses as { fieldId: string; label: string; value: string }[]) ?? [],
    };
  });

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
    completedSignatures: completedSigs.map(s => ({
      recipientId: s.recipientId,
      signatureType: s.signatureType,
      signatureData: s.signatureData,
      fullName: s.fullName,
      documentHash: s.documentHash,
      signatureHash: s.signatureHash,
      signedAt: s.signedAt,
      ipAddress: s.ipAddress,
    })),
    auditEvents: auditEvents.map(e => ({
      action: e.action,
      details: e.details,
      createdAt: e.createdAt,
    })),
  });

  (pdfStream as any).pipe(res);

  await logSigAction({
    userId,
    action: "pdf_downloaded",
    resourceId: String(id),
    details: `PDF downloaded for "${request.title}"`,
    ip: getClientIp(req),
    ua: req.headers["user-agent"],
  });
});

// POST /api/sign/:token/decline
router.post("/sign/:token/decline", async (req, res): Promise<void> => {
  const { token } = req.params;
  const { reason } = req.body;
  const ip = getClientIp(req);
  const ua = req.headers["user-agent"];

  const [recipient] = await db
    .select()
    .from(signatureRecipientsTable)
    .where(eq(signatureRecipientsTable.token, token))
    .limit(1);

  if (!recipient) { res.status(404).json({ error: "Not found" }); return; }

  await db.update(signatureRecipientsTable)
    .set({ status: "declined", declinedAt: new Date(), declineReason: reason || null, ipAddress: ip, userAgent: ua })
    .where(eq(signatureRecipientsTable.id, recipient.id));

  await logSigAction({
    action: "declined", resourceId: String(recipient.requestId),
    details: `${recipient.name} (${recipient.email}) declined — reason: ${reason}`, ip, ua,
  });

  res.json({ message: "Declined" });
});

// ─── BULK ACTIONS ────────────────────────────────────────────────────────────

// POST /api/signature-requests/bulk/void
router.post("/signature-requests/bulk/void", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const { ids, reason } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ error: "ids array required" });
    return;
  }

  const [user] = await db.select({ email: usersTable.email, name: usersTable.name }).from(usersTable).where(eq(usersTable.id, userId));
  const results: { id: number; success: boolean }[] = [];

  for (const id of ids.slice(0, 50)) { // Max 50 at a time
    const [updated] = await db
      .update(signatureRequestsTable)
      .set({ status: "voided", voidedAt: new Date(), voidReason: reason || "Bulk voided by admin" })
      .where(and(eq(signatureRequestsTable.id, Number(id)), sql`${signatureRequestsTable.status} != 'voided'`))
      .returning();
    if (updated) {
      await logSigAction({
        userId, userEmail: user?.email, userName: user?.name,
        action: "bulk_voided", resourceId: String(id),
        details: `Bulk voided: ${reason || "No reason"}`, ip: getClientIp(req), ua: req.headers["user-agent"],
      });
    }
    results.push({ id: Number(id), success: Boolean(updated) });
  }

  res.json({ voided: results.filter(r => r.success).length, results });
});

// POST /api/signature-requests/bulk/remind
router.post("/signature-requests/bulk/remind", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ error: "ids array required" });
    return;
  }

  const [user] = await db.select({ email: usersTable.email, name: usersTable.name }).from(usersTable).where(eq(usersTable.id, userId));
  const baseUrl = getBaseUrl(req);
  let totalSent = 0;
  let totalFailed = 0;

  for (const id of ids.slice(0, 20)) { // Max 20 requests at a time
    const [request] = await db.select().from(signatureRequestsTable).where(eq(signatureRequestsTable.id, Number(id)));
    if (!request || request.status !== "pending") continue;

    const pendingRecipients = await db
      .select()
      .from(signatureRecipientsTable)
      .where(and(
        eq(signatureRecipientsTable.requestId, Number(id)),
        sql`${signatureRecipientsTable.status} IN ('pending', 'viewed')`
      ));

    for (const r of pendingRecipients) {
      const result = await sendSigningEmail({
        recipientName: r.name,
        recipientEmail: r.email,
        senderName: user?.name ?? "Occu-Med",
        requestTitle: request.title,
        message: request.message,
        signingToken: r.token,
        expiresAt: r.tokenExpiresAt,
        isReminder: true,
        baseUrl,
      });
      if (result.sent) totalSent++;
      else totalFailed++;
    }
  }

  res.json({ message: `Bulk reminder: ${totalSent} emails sent, ${totalFailed} failed`, totalSent, totalFailed });
});

// POST /api/signature-requests/:id/sms — send SMS signing notification
router.post("/signature-requests/:id/sms", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const id = Number(req.params.id);
  const { isReminder = false } = req.body;

  const [request] = await db.select().from(signatureRequestsTable).where(eq(signatureRequestsTable.id, id));
  if (!request) { res.status(404).json({ error: "Not found" }); return; }

  const pendingRecipients = await db
    .select()
    .from(signatureRecipientsTable)
    .where(and(
      eq(signatureRecipientsTable.requestId, id),
      sql`${signatureRecipientsTable.status} IN ('pending', 'viewed')`
    ));

  const { sendSigningSms, isSmsConfigured } = await import("../lib/sms.js");

  if (!isSmsConfigured()) {
    res.json({ sent: 0, message: "SMS not configured — set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER" });
    return;
  }

  const baseUrl = getBaseUrl(req);
  const results: { name: string; sent: boolean; error?: string }[] = [];

  for (const r of pendingRecipients) {
    // Phone number must be stored in the recipient's email field prefixed with "sms:" or passed in req.body.phones
    const phones: Record<string, string> = req.body.phones ?? {};
    const phone = phones[String(r.id)];
    if (!phone) { results.push({ name: r.name, sent: false, error: "No phone number" }); continue; }

    const result = await sendSigningSms({
      recipientName: r.name,
      recipientPhone: phone,
      requestTitle: request.title,
      signingToken: r.token,
      baseUrl,
      isReminder,
    });
    results.push({ name: r.name, ...result });
  }

  const sent = results.filter(r => r.sent).length;
  res.json({ sent, total: pendingRecipients.length, results });
});

// GET /api/signature-settings/sms-status
router.get("/signature-settings/sms-status", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  const { isSmsConfigured } = await import("../lib/sms.js");
  res.json({
    configured: isSmsConfigured(),
    vars: {
      TWILIO_ACCOUNT_SID: Boolean(process.env.TWILIO_ACCOUNT_SID),
      TWILIO_AUTH_TOKEN: Boolean(process.env.TWILIO_AUTH_TOKEN),
      TWILIO_FROM_NUMBER: Boolean(process.env.TWILIO_FROM_NUMBER),
    },
  });
});

export default router;
