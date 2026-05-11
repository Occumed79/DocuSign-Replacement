import nodemailer from "nodemailer";

interface MailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromAddress: string;
  fromName: string;
}

function getMailConfig(): MailConfig | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  return {
    host,
    port: Number(process.env.SMTP_PORT ?? "587"),
    secure: process.env.SMTP_SECURE === "true",
    user,
    pass,
    fromAddress: process.env.SMTP_FROM ?? user,
    fromName: process.env.SMTP_FROM_NAME ?? "Occu-Med PacketPath",
  };
}

function createTransport(cfg: MailConfig) {
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
    tls: { rejectUnauthorized: false },
  });
}

function signingEmailHtml({
  recipientName,
  senderName,
  requestTitle,
  message,
  signingUrl,
  expiresAt,
  isReminder,
}: {
  recipientName: string;
  senderName: string;
  requestTitle: string;
  message: string | null;
  signingUrl: string;
  expiresAt: Date | null;
  isReminder: boolean;
}) {
  const expiry = expiresAt
    ? expiresAt.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    : "7 days from now";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${isReminder ? "Reminder: " : ""}Please Sign: ${requestTitle}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f0f4f8; color: #1e293b; }
  .wrapper { max-width: 560px; margin: 40px auto; }
  .card { background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #3b4fce 0%, #7c3aed 100%); padding: 32px 40px; }
  .header-logo { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
  .logo-icon { width: 36px; height: 36px; background: rgba(255,255,255,0.2); border-radius: 10px; display: flex; align-items: center; justify-content: center; }
  .logo-text { color: rgba(255,255,255,0.9); font-size: 15px; font-weight: 600; }
  .logo-sub { color: rgba(255,255,255,0.5); font-size: 12px; }
  .header h1 { color: #ffffff; font-size: 22px; font-weight: 700; line-height: 1.3; }
  .header p { color: rgba(255,255,255,0.7); font-size: 14px; margin-top: 6px; }
  .badge { display: inline-block; background: rgba(255,255,255,0.2); color: #ffffff; border-radius: 999px; padding: 4px 12px; font-size: 12px; font-weight: 600; margin-bottom: 16px; }
  .body { padding: 36px 40px; }
  .greeting { font-size: 17px; font-weight: 600; margin-bottom: 12px; color: #0f172a; }
  .text { font-size: 14px; color: #475569; line-height: 1.7; margin-bottom: 16px; }
  .doc-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; }
  .doc-label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
  .doc-title { font-size: 15px; font-weight: 600; color: #0f172a; }
  .doc-msg { font-size: 13px; color: #64748b; margin-top: 6px; font-style: italic; }
  .btn-wrap { text-align: center; margin: 28px 0; }
  .btn { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #4f63e7, #7c3aed); color: #ffffff !important; text-decoration: none; border-radius: 12px; font-size: 15px; font-weight: 700; letter-spacing: 0.02em; box-shadow: 0 4px 16px rgba(79,99,231,0.35); }
  .link-box { background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; }
  .link-label { font-size: 11px; color: #94a3b8; margin-bottom: 4px; font-weight: 600; text-transform: uppercase; }
  .link-url { font-size: 12px; color: #4f63e7; word-break: break-all; font-family: monospace; }
  .expiry { display: flex; align-items: flex-start; gap: 10px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 12px 16px; margin-bottom: 24px; }
  .expiry-icon { font-size: 16px; }
  .expiry-text { font-size: 13px; color: #92400e; }
  .security-section { border-top: 1px solid #e2e8f0; padding-top: 24px; margin-top: 8px; }
  .security-title { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px; }
  .security-items { display: flex; flex-wrap: wrap; gap: 8px; }
  .security-item { display: flex; align-items: center; gap: 6px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 999px; padding: 4px 12px; font-size: 12px; color: #166534; font-weight: 500; }
  .footer { padding: 20px 40px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; }
  .footer p { font-size: 12px; color: #94a3b8; line-height: 1.6; }
  .footer a { color: #4f63e7; text-decoration: none; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="card">
    <!-- Header -->
    <div class="header">
      <div class="header-logo">
        <div class="logo-icon">
          <svg width="18" height="18" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        </div>
        <div>
          <div class="logo-text">PacketPath</div>
          <div class="logo-sub">Occu-Med E-Signatures</div>
        </div>
      </div>
      ${isReminder ? '<div class="badge">⏰ Reminder</div>' : '<div class="badge">✍️ Signature Requested</div>'}
      <h1>${isReminder ? "Your signature is still needed" : "You have a document to sign"}</h1>
      <p>${senderName} has ${isReminder ? "resent" : "sent"} you a document for your electronic signature.</p>
    </div>

    <!-- Body -->
    <div class="body">
      <p class="greeting">Hello, ${recipientName}</p>
      <p class="text">
        ${isReminder
          ? `This is a friendly reminder that the document below is still awaiting your signature. Please review and sign at your earliest convenience.`
          : `${senderName} from Occu-Med Occupational Health has sent you a document that requires your electronic signature. Please review it carefully before signing.`
        }
      </p>

      <!-- Document card -->
      <div class="doc-card">
        <div class="doc-label">Document</div>
        <div class="doc-title">📄 ${requestTitle}</div>
        ${message ? `<div class="doc-msg">"${message}"</div>` : ""}
      </div>

      <!-- CTA -->
      <div class="btn-wrap">
        <a href="${signingUrl}" class="btn">Review &amp; Sign Document →</a>
      </div>

      <!-- Fallback link -->
      <div class="link-box">
        <div class="link-label">Or copy this link into your browser</div>
        <div class="link-url">${signingUrl}</div>
      </div>

      <!-- Expiry warning -->
      ${expiresAt ? `
      <div class="expiry">
        <div class="expiry-icon">⏳</div>
        <div class="expiry-text">
          <strong>This link expires on ${expiry}.</strong> After that, you will need to contact the sender for a new link.
        </div>
      </div>` : ""}

      <!-- Security badges -->
      <div class="security-section">
        <div class="security-title">Security &amp; Compliance</div>
        <div class="security-items">
          <div class="security-item">✓ ESIGN Act Compliant</div>
          <div class="security-item">✓ HIPAA Secure</div>
          <div class="security-item">✓ 256-bit Encrypted</div>
          <div class="security-item">✓ Audit Trail</div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>
        This email was sent by Occu-Med Occupational Health via PacketPath.<br />
        Your signature is legally binding under the Electronic Signatures in Global and National Commerce Act (ESIGN Act).<br />
        If you did not expect this email, you may safely ignore it — no account is required to decline.
      </p>
    </div>
  </div>

  <!-- Bottom note -->
  <p style="text-align:center;font-size:12px;color:#94a3b8;margin-top:16px;">
    Sent securely by <strong>PacketPath</strong> · Occu-Med Occupational Health
  </p>
</div>
</body>
</html>`;
}

function signingEmailText({
  recipientName,
  senderName,
  requestTitle,
  message,
  signingUrl,
  expiresAt,
  isReminder,
}: {
  recipientName: string;
  senderName: string;
  requestTitle: string;
  message: string | null;
  signingUrl: string;
  expiresAt: Date | null;
  isReminder: boolean;
}) {
  const expiry = expiresAt
    ? expiresAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : null;

  return [
    `Hello ${recipientName},`,
    "",
    isReminder
      ? `This is a reminder that the following document still requires your signature:`
      : `${senderName} from Occu-Med Occupational Health has sent you a document to sign:`,
    "",
    `Document: ${requestTitle}`,
    message ? `Message: "${message}"` : "",
    "",
    `To review and sign, visit:`,
    signingUrl,
    "",
    expiry ? `This link expires on ${expiry}.` : "",
    "",
    `This signature is legally binding under the ESIGN Act (15 U.S.C. § 7001).`,
    "",
    `If you did not expect this email, you may safely ignore it.`,
    "",
    `-- Occu-Med Occupational Health via PacketPath`,
  ].filter(l => l !== undefined).join("\n");
}

export interface SendSigningEmailParams {
  recipientName: string;
  recipientEmail: string;
  senderName: string;
  requestTitle: string;
  message: string | null;
  signingToken: string;
  expiresAt: Date | null;
  isReminder?: boolean;
  baseUrl: string;
}

export async function sendSigningEmail(params: SendSigningEmailParams): Promise<{ sent: boolean; error?: string }> {
  const cfg = getMailConfig();
  if (!cfg) {
    return { sent: false, error: "SMTP not configured — set SMTP_HOST, SMTP_USER, SMTP_PASS environment variables" };
  }

  const {
    recipientName, recipientEmail, senderName, requestTitle,
    message, signingToken, expiresAt, isReminder = false, baseUrl,
  } = params;

  const signingUrl = `${baseUrl}/sign/${signingToken}`;

  const html = signingEmailHtml({ recipientName, senderName, requestTitle, message, signingUrl, expiresAt, isReminder });
  const text = signingEmailText({ recipientName, senderName, requestTitle, message, signingUrl, expiresAt, isReminder });

  try {
    const transport = createTransport(cfg);
    await transport.sendMail({
      from: `"${cfg.fromName}" <${cfg.fromAddress}>`,
      to: `"${recipientName}" <${recipientEmail}>`,
      subject: isReminder
        ? `Reminder: Please sign "${requestTitle}"`
        : `Action Required: Please sign "${requestTitle}"`,
      html,
      text,
    });
    return { sent: true };
  } catch (err: any) {
    return { sent: false, error: err?.message ?? "Email send failed" };
  }
}

export async function verifySmtpConnection(): Promise<{ ok: boolean; error?: string }> {
  const cfg = getMailConfig();
  if (!cfg) return { ok: false, error: "SMTP not configured" };
  try {
    const transport = createTransport(cfg);
    await transport.verify();
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "Connection failed" };
  }
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

// ─── Progress Save Email ──────────────────────────────────────────────────────

export interface SendProgressSaveEmailParams {
  recipientName: string;
  recipientEmail: string;
  requestTitle: string;
  resumeUrl: string;
  expiresAt: Date;
}

export async function sendProgressSaveEmail(params: SendProgressSaveEmailParams): Promise<{ sent: boolean; error?: string }> {
  const cfg = getMailConfig();
  if (!cfg) return { sent: false, error: "SMTP not configured" };

  const { recipientName, recipientEmail, requestTitle, resumeUrl, expiresAt } = params;
  const expiry = expiresAt.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const html = `<!DOCTYPE html><html><body style="font-family:Inter,sans-serif;background:#f8fafc;margin:0;padding:24px;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,.1);">
  <h2 style="color:#1e293b;margin-top:0;">Your progress has been saved</h2>
  <p style="color:#475569;">Hello ${recipientName},</p>
  <p style="color:#475569;">Your progress on <strong>"${requestTitle}"</strong> has been saved. You can return to complete it at any time before the link expires.</p>
  <div style="text-align:center;margin:32px 0;">
    <a href="${resumeUrl}" style="background:#2563eb;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Resume Where I Left Off →</a>
  </div>
  <p style="color:#94a3b8;font-size:13px;">This resume link expires on <strong>${expiry}</strong>.</p>
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
  <p style="color:#94a3b8;font-size:12px;">Sent securely by PacketPath · Occu-Med Occupational Health</p>
</div></body></html>`;

  try {
    const transport = createTransport(cfg);
    await transport.sendMail({
      from: `"${cfg.fromName}" <${cfg.fromAddress}>`,
      to: `"${recipientName}" <${recipientEmail}>`,
      subject: `Your progress on "${requestTitle}" has been saved`,
      html,
      text: `Hello ${recipientName},\n\nYour progress on "${requestTitle}" has been saved.\n\nResume here: ${resumeUrl}\n\nThis link expires on ${expiry}.\n\n-- Occu-Med Occupational Health via PacketPath`,
    });
    return { sent: true };
  } catch (err: any) {
    return { sent: false, error: err?.message ?? "Email send failed" };
  }
}
