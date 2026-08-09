import nodemailer from "nodemailer";

function smtpConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM?.trim() || user;
  const fromName = process.env.SMTP_FROM_NAME?.trim() || "Occu-Med";
  return { host, port, user, pass, from, fromName };
}

export function isMedicalQuestionnaireEmailConfigured(): boolean {
  const cfg = smtpConfig();
  return Boolean(cfg.host && cfg.user && cfg.pass && cfg.from);
}

export async function sendMedicalQuestionnaireEmail(params: {
  recipientName: string;
  recipientEmail: string;
  examTypeName: string;
  questionnaireToken: string;
  expiresAt: Date;
  baseUrl: string;
}) {
  const cfg = smtpConfig();
  if (!cfg.host || !cfg.user || !cfg.pass || !cfg.from) {
    return { sent: false, error: "SMTP not configured" };
  }

  const secure = process.env.SMTP_SECURE === "true" || cfg.port === 465;
  const transport = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure,
    auth: { user: cfg.user, pass: cfg.pass },
  });
  const link = `${params.baseUrl.replace(/\/$/, "")}/questionnaire/${encodeURIComponent(params.questionnaireToken)}`;
  const subject = `Occu-Med medical history questionnaire — ${params.examTypeName}`;
  const text = [
    `Hello ${params.recipientName},`,
    "",
    "Occu-Med has requested that you complete a secure medical history questionnaire.",
    `Questionnaire: ${params.examTypeName}`,
    `Secure link: ${link}`,
    `Link expires: ${params.expiresAt.toLocaleString()}`,
    "",
    "For privacy, you may be asked to verify your date of birth before the questionnaire opens.",
    "If you did not expect this request, please contact Occu-Med instead of using the link.",
  ].join("\n");

  const html = `
  <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.55;max-width:640px;margin:auto">
    <h2 style="color:#052a32;margin-bottom:8px">Medical History Questionnaire</h2>
    <p>Hello ${escapeHtml(params.recipientName)},</p>
    <p>Occu-Med has requested that you complete a secure medical history questionnaire for <strong>${escapeHtml(params.examTypeName)}</strong>.</p>
    <p style="margin:28px 0"><a href="${escapeHtml(link)}" style="display:inline-block;background:#527b78;color:white;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">Open secure questionnaire</a></p>
    <p style="font-size:13px;color:#475569">This link expires ${escapeHtml(params.expiresAt.toLocaleString())}. For privacy, you may be asked to verify your date of birth before the questionnaire opens.</p>
    <p style="font-size:13px;color:#475569">If you did not expect this request, contact Occu-Med instead of using the link.</p>
  </div>`;

  try {
    await transport.sendMail({
      from: `"${cfg.fromName.replace(/"/g, "")}" <${cfg.from}>`,
      to: params.recipientEmail,
      subject,
      text,
      html,
    });
    return { sent: true };
  } catch (err: any) {
    return { sent: false, error: err?.message ?? "Email delivery failed" };
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[char] || char));
}
