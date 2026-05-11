/**
 * SMS notification library using Twilio REST API.
 * Sends signing request notifications and reminders via SMS.
 * Falls back gracefully if Twilio credentials are not configured.
 *
 * Required environment variables:
 *   TWILIO_ACCOUNT_SID — Twilio Account SID
 *   TWILIO_AUTH_TOKEN  — Twilio Auth Token
 *   TWILIO_FROM_NUMBER — Twilio phone number (E.164 format, e.g. +15551234567)
 */

export interface SmsConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

function getSmsConfig(): SmsConfig | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  if (!accountSid || !authToken || !fromNumber) return null;
  return { accountSid, authToken, fromNumber };
}

export function isSmsConfigured(): boolean {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER);
}

async function sendTwilioSms(to: string, body: string): Promise<{ sent: boolean; sid?: string; error?: string }> {
  const cfg = getSmsConfig();
  if (!cfg) return { sent: false, error: "Twilio not configured — set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER" };

  const url = `https://api.twilio.com/2010-04-01/Accounts/${cfg.accountSid}/Messages.json`;
  const credentials = Buffer.from(`${cfg.accountSid}:${cfg.authToken}`).toString("base64");

  const params = new URLSearchParams({ To: to, From: cfg.fromNumber, Body: body });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = await response.json() as any;

    if (!response.ok) {
      return { sent: false, error: data?.message ?? `Twilio error ${response.status}` };
    }

    return { sent: true, sid: data.sid };
  } catch (err: any) {
    return { sent: false, error: err?.message ?? "SMS send failed" };
  }
}

export interface SendSigningSmsParams {
  recipientName: string;
  recipientPhone: string;
  requestTitle: string;
  signingToken: string;
  baseUrl: string;
  isReminder?: boolean;
}

/** Send an SMS signing request notification */
export async function sendSigningSms(params: SendSigningSmsParams): Promise<{ sent: boolean; sid?: string; error?: string }> {
  const { recipientName, recipientPhone, requestTitle, signingToken, baseUrl, isReminder = false } = params;
  const signingUrl = `${baseUrl}/sign/${signingToken}`;

  const firstName = recipientName.split(" ")[0];
  const body = isReminder
    ? `Hi ${firstName}, reminder: please sign "${requestTitle}" from Occu-Med. Link: ${signingUrl}`
    : `Hi ${firstName}, Occu-Med needs your signature on "${requestTitle}". Sign here: ${signingUrl}`;

  return sendTwilioSms(recipientPhone, body);
}

export interface SendBulkReminderSmsParams {
  recipients: Array<{
    name: string;
    phone: string;
    token: string;
    requestTitle: string;
  }>;
  baseUrl: string;
}

/** Send bulk SMS reminders to multiple recipients */
export async function sendBulkReminderSms(params: SendBulkReminderSmsParams): Promise<{
  sent: number;
  failed: number;
  results: Array<{ name: string; sent: boolean; error?: string }>;
}> {
  const results = [];
  let sent = 0;
  let failed = 0;

  for (const recipient of params.recipients) {
    const result = await sendSigningSms({
      recipientName: recipient.name,
      recipientPhone: recipient.phone,
      requestTitle: recipient.requestTitle,
      signingToken: recipient.token,
      baseUrl: params.baseUrl,
      isReminder: true,
    });

    results.push({ name: recipient.name, sent: result.sent, error: result.error });
    if (result.sent) sent++;
    else failed++;

    // Rate limiting: 1 SMS per 100ms to avoid Twilio rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return { sent, failed, results };
}
