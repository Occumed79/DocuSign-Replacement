import crypto from "crypto";
import PDFDocument from "pdfkit";
import type { Readable } from "stream";

export interface CertificateSignerRecord {
  recipientId: number;
  name: string;
  email: string;
  role: string;
  order: number;
  status: string;
  signedAt: Date | null;
  viewedAt: Date | null;
  declinedAt: Date | null;
  ipAddress: string | null;
  userAgent: string | null;
  signatureType?: string | null;
  signatureHash?: string | null;
  evidenceHash?: string | null;
  electronicRecordConsent?: boolean | null;
  consentText?: string | null;
}

export interface CertificateInput {
  requestId: number;
  title: string;
  status: string;
  createdAt: Date;
  completedAt: Date | null;
  documentHash: string;
  finalPdfHash: string | null;
  finalEvidenceHash: string | null;
  finalPdfStoragePath: string | null;
  signers: CertificateSignerRecord[];
  verification: {
    valid: boolean;
    tamperDetected: boolean;
    documentHashValid: boolean;
    evidenceHashesValid: boolean;
    finalEvidenceHashValid: boolean;
  };
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return `{${Object.keys(obj).sort().map(k => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256(data: string | Buffer): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function formatDate(value: Date | string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export function buildCertificateOfCompletion(input: CertificateInput) {
  const generatedAt = new Date().toISOString();
  const certificateId = `PKT-CERT-${String(input.requestId).padStart(6, "0")}`;

  const certificate = {
    version: 1,
    certificateId,
    generatedAt,
    platform: "PacketPath E-Signature Platform",
    organization: "Occu-Med Occupational Health",
    request: {
      requestId: input.requestId,
      title: input.title,
      status: input.status,
      createdAt: input.createdAt.toISOString(),
      completedAt: input.completedAt?.toISOString() ?? null,
    },
    integrity: {
      documentHash: input.documentHash,
      finalPdfHash: input.finalPdfHash,
      finalEvidenceHash: input.finalEvidenceHash,
      finalPdfStoragePath: input.finalPdfStoragePath,
    },
    verification: input.verification,
    signers: input.signers.map(s => ({
      recipientId: s.recipientId,
      name: s.name,
      email: s.email,
      role: s.role,
      order: s.order,
      status: s.status,
      viewedAt: s.viewedAt?.toISOString() ?? null,
      signedAt: s.signedAt?.toISOString() ?? null,
      declinedAt: s.declinedAt?.toISOString() ?? null,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      signatureType: s.signatureType ?? null,
      signatureHash: s.signatureHash ?? null,
      evidenceHash: s.evidenceHash ?? null,
      electronicRecordConsent: s.electronicRecordConsent ?? null,
      consentText: s.consentText ?? null,
    })),
  };

  const certificateHash = sha256(canonicalJson(certificate));

  return {
    certificate,
    certificateId,
    certificateHash,
    algorithm: "SHA-256",
    canonicalization: "stable-json-recursive-key-sort-v1",
  };
}

export function generateCertificateOfCompletionPdf(input: CertificateInput): Readable {
  const cert = buildCertificateOfCompletion(input);
  const doc = new PDFDocument({
    size: "LETTER",
    margins: { top: 56, bottom: 56, left: 56, right: 56 },
    info: {
      Title: `Certificate of Completion ${cert.certificateId}`,
      Author: "Occu-Med PacketPath",
      Subject: "Certificate of Completion",
      Creator: "PacketPath E-Signature Platform",
    },
  });

  const W = doc.page.width - 112;
  const ML = 56;
  let y = 56;

  doc.rect(0, 0, doc.page.width, 86).fill("#5046E5");
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(20).text("Certificate of Completion", ML, 24);
  doc.fillColor("#E0E7FF").font("Helvetica").fontSize(10).text("PacketPath E-Signature Platform · Occu-Med Occupational Health", ML, 50);
  y = 110;

  doc.fillColor("#0F172A").font("Helvetica-Bold").fontSize(16).text(input.title, ML, y, { width: W });
  y += doc.heightOfString(input.title, { width: W }) + 18;

  doc.rect(ML, y, W, 86).fill("#F8FAFC");
  doc.fillColor("#64748B").font("Helvetica-Bold").fontSize(8).text("CERTIFICATE ID", ML + 12, y + 10);
  doc.fillColor("#0F172A").font("Helvetica").fontSize(10).text(cert.certificateId, ML + 12, y + 22);
  doc.fillColor("#64748B").font("Helvetica-Bold").fontSize(8).text("REQUEST ID", ML + 210, y + 10);
  doc.fillColor("#0F172A").font("Helvetica").fontSize(10).text(`PKT-SIG-${String(input.requestId).padStart(5, "0")}`, ML + 210, y + 22);
  doc.fillColor("#64748B").font("Helvetica-Bold").fontSize(8).text("STATUS", ML + 380, y + 10);
  doc.fillColor(input.verification.valid ? "#059669" : "#DC2626").font("Helvetica-Bold").fontSize(10).text(input.verification.valid ? "VERIFIED" : "REVIEW REQUIRED", ML + 380, y + 22);
  doc.fillColor("#64748B").font("Helvetica-Bold").fontSize(8).text("COMPLETED", ML + 12, y + 50);
  doc.fillColor("#0F172A").font("Helvetica").fontSize(9).text(formatDate(input.completedAt), ML + 12, y + 62, { width: 210 });
  doc.fillColor("#64748B").font("Helvetica-Bold").fontSize(8).text("GENERATED", ML + 250, y + 50);
  doc.fillColor("#0F172A").font("Helvetica").fontSize(9).text(formatDate(new Date()), ML + 250, y + 62, { width: 220 });
  y += 108;

  doc.fillColor("#0F172A").font("Helvetica-Bold").fontSize(12).text("Integrity Summary", ML, y);
  y += 18;
  const rows: [string, string | null | boolean][] = [
    ["Document Hash", input.documentHash],
    ["Final PDF Hash", input.finalPdfHash],
    ["Final Evidence Hash", input.finalEvidenceHash],
    ["Certificate Hash", cert.certificateHash],
    ["Document Hash Valid", input.verification.documentHashValid],
    ["Signer Evidence Valid", input.verification.evidenceHashesValid],
    ["Final Evidence Valid", input.verification.finalEvidenceHashValid],
    ["Tamper Detected", input.verification.tamperDetected],
  ];

  for (const [label, value] of rows) {
    if (y > doc.page.height - 80) { doc.addPage(); y = 56; }
    doc.fillColor("#64748B").font("Helvetica-Bold").fontSize(7.5).text(label.toUpperCase(), ML, y);
    doc.fillColor("#0F172A").font(typeof value === "string" && value?.length > 40 ? "Courier" : "Helvetica").fontSize(8.2)
      .text(value === null || value === undefined ? "—" : String(value), ML + 150, y, { width: W - 150 });
    y += 22;
  }

  y += 8;
  doc.fillColor("#0F172A").font("Helvetica-Bold").fontSize(12).text("Signer Records", ML, y);
  y += 18;

  for (const signer of input.signers) {
    if (y > doc.page.height - 145) { doc.addPage(); y = 56; }
    doc.rect(ML, y, W, 112).fill("#F8FAFC");
    doc.rect(ML, y, 4, 112).fill(signer.status === "signed" ? "#059669" : signer.status === "declined" ? "#DC2626" : "#D97706");
    doc.fillColor("#0F172A").font("Helvetica-Bold").fontSize(10).text(`${signer.order}. ${signer.name}`, ML + 12, y + 8);
    doc.fillColor("#64748B").font("Helvetica").fontSize(8.5).text(`${signer.email} · ${signer.role}`, ML + 12, y + 22);
    doc.fillColor("#64748B").font("Helvetica-Bold").fontSize(7.5).text("STATUS", ML + 12, y + 42);
    doc.fillColor("#0F172A").font("Helvetica").fontSize(8.5).text(signer.status, ML + 12, y + 53);
    doc.fillColor("#64748B").font("Helvetica-Bold").fontSize(7.5).text("SIGNED", ML + 120, y + 42);
    doc.fillColor("#0F172A").font("Helvetica").fontSize(8.5).text(formatDate(signer.signedAt), ML + 120, y + 53, { width: 150 });
    doc.fillColor("#64748B").font("Helvetica-Bold").fontSize(7.5).text("IP ADDRESS", ML + 290, y + 42);
    doc.fillColor("#0F172A").font("Helvetica").fontSize(8.5).text(signer.ipAddress ?? "—", ML + 290, y + 53, { width: 160 });
    doc.fillColor("#64748B").font("Helvetica-Bold").fontSize(7.5).text("EVIDENCE HASH", ML + 12, y + 76);
    doc.fillColor("#0F172A").font("Courier").fontSize(7.3).text(signer.evidenceHash ?? signer.signatureHash ?? "—", ML + 12, y + 88, { width: W - 24 });
    y += 124;
  }

  if (y > doc.page.height - 100) { doc.addPage(); y = 56; }
  doc.fillColor("#0F172A").font("Helvetica-Bold").fontSize(12).text("Electronic Records Consent", ML, y);
  y += 18;
  const consentTexts = input.signers.map(s => s.consentText).filter(Boolean);
  const consentText = consentTexts[0] ?? "Electronic records and electronic signature consent captured by PacketPath at the time of signing.";
  doc.fillColor("#334155").font("Helvetica").fontSize(9).text(consentText, ML, y, { width: W });
  y += doc.heightOfString(consentText, { width: W }) + 20;

  const verifyUrl = `${process.env.APP_BASE_URL?.replace(/\/$/, "") ?? "https://packetpath.app"}/api/signature-requests/${input.requestId}/verify`;
  doc.fillColor("#64748B").font("Helvetica").fontSize(8)
    .text(`Verification endpoint: ${verifyUrl}`, ML, doc.page.height - 84, { width: W, align: "center" });
  doc.fillColor("#64748B").font("Helvetica").fontSize(8)
    .text(`Certificate hash: ${cert.certificateHash}`, ML, doc.page.height - 68, { width: W, align: "center" });

  doc.end();
  return doc as unknown as Readable;
}
