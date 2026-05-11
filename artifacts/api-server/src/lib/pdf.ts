import PDFDocument from "pdfkit";
import type { Readable } from "stream";

interface Recipient {
  id: number;
  name: string;
  email: string;
  role: string;
  order: number;
  status: string;
  signedAt: Date | null;
  ipAddress: string | null;
  userAgent: string | null;
  declinedAt: Date | null;
  declineReason: string | null;
}

interface CompletedSig {
  recipientId: number;
  signatureType: string;
  signatureData: string;
  fullName: string;
  documentHash: string;
  signatureHash: string;
  signedAt: Date;
  ipAddress: string | null;
}

interface AuditEvent {
  action: string;
  details: string | null;
  createdAt: Date;
}

interface FormResponse {
  recipientId: number;
  recipientName: string;
  responses: { fieldId: string; label: string; value: string }[];
}

export interface PdfInput {
  requestId: number;
  title: string;
  message: string | null;
  documentContent: string;
  documentHash: string;
  status: string;
  createdAt: Date;
  completedAt: Date | null;
  voidReason: string | null;
  patientName: string | null;
  recipients: Recipient[];
  completedSignatures: CompletedSig[];
  auditEvents: AuditEvent[];
  creatorName: string | null;
  creatorEmail: string | null;
  formResponses?: FormResponse[];
}

// Strip HTML to structured blocks for PDFKit rendering
interface TextBlock {
  type: "heading1" | "heading2" | "paragraph" | "bullet" | "spacer";
  text: string;
}

function htmlToBlocks(html: string): TextBlock[] {
  const blocks: TextBlock[] = [];

  // Replace common block elements with markers
  let text = html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gis, "\n__H1__$1__H1END__\n")
    .replace(/<h2[^>]*>(.*?)<\/h2>/gis, "\n__H2__$1__H2END__\n")
    .replace(/<h3[^>]*>(.*?)<\/h3>/gis, "\n__H2__$1__H2END__\n")
    .replace(/<li[^>]*>(.*?)<\/li>/gis, "\n__BULLET__$1__BULLETEND__\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<p[^>]*>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<ul[^>]*>|<\/ul>|<ol[^>]*>|<\/ol>/gi, "\n")
    .replace(/<strong[^>]*>(.*?)<\/strong>/gis, "$1")
    .replace(/<em[^>]*>(.*?)<\/em>/gis, "$1")
    .replace(/<[^>]+>/g, "") // strip remaining tags
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"');

  const lines = text.split("\n");
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) { blocks.push({ type: "spacer", text: "" }); continue; }

    if (line.startsWith("__H1__")) {
      blocks.push({ type: "heading1", text: line.replace(/__H1__|__H1END__/g, "").trim() });
    } else if (line.startsWith("__H2__")) {
      blocks.push({ type: "heading2", text: line.replace(/__H2__|__H2END__/g, "").trim() });
    } else if (line.startsWith("__BULLET__")) {
      blocks.push({ type: "bullet", text: line.replace(/__BULLET__|__BULLETEND__/g, "").trim() });
    } else {
      blocks.push({ type: "paragraph", text: line });
    }
  }

  // Collapse multiple spacers
  return blocks.filter((b, i) => !(b.type === "spacer" && blocks[i - 1]?.type === "spacer"));
}

// Colors
const BRAND_PURPLE = "#5046E5";
const BRAND_VIOLET = "#7C3AED";
const DARK = "#0F172A";
const MEDIUM = "#334155";
const MUTED = "#64748B";
const LIGHT_BG = "#F8FAFC";
const BORDER = "#E2E8F0";
const EMERALD = "#059669";
const RED = "#DC2626";
const AMBER = "#D97706";

function drawHRule(doc: PDFKit.PDFDocument, y: number, color = BORDER) {
  doc.moveTo(50, y).lineTo(doc.page.width - 50, y).strokeColor(color).lineWidth(0.5).stroke();
}

function statusColor(status: string): string {
  if (status === "completed") return EMERALD;
  if (status === "voided") return RED;
  if (status === "pending" || status === "partially_signed") return AMBER;
  return MUTED;
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    draft: "Draft", pending: "Pending", partially_signed: "Partially Signed",
    completed: "Fully Executed", voided: "Voided", expired: "Expired",
  };
  return map[status] ?? status;
}

function formatDate(d: Date | null | string): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit", timeZoneName: "short",
  });
}

export function generateSignedDocumentPdf(input: PdfInput): Readable {
  const doc = new PDFDocument({
    size: "LETTER",
    margins: { top: 60, bottom: 60, left: 60, right: 60 },
    info: {
      Title: input.title,
      Author: "Occu-Med PacketPath",
      Subject: "Signed Document",
      Keywords: "esignature, hipaa, occumed",
      Creator: "PacketPath E-Signature Platform",
    },
  });

  const W = doc.page.width - 120; // usable width
  const ML = 60; // margin left

  // ─── PAGE 1: COVER ───────────────────────────────────────────────────────
  // Header bar
  doc.rect(0, 0, doc.page.width, 80).fill(BRAND_PURPLE);

  // Logo text
  doc.fillColor("#FFFFFF").fontSize(18).font("Helvetica-Bold")
    .text("PacketPath", ML, 24);
  doc.fillColor("rgba(255,255,255,0.6)").fontSize(10).font("Helvetica")
    .text("Occu-Med Occupational Health · E-Signature Platform", ML, 46);

  // Status badge (right side of header)
  const sColor = statusColor(input.status);
  const sLabel = statusLabel(input.status);
  const badgeX = doc.page.width - ML - 120;
  doc.roundedRect(badgeX, 22, 120, 26, 5).fillColor(sColor).fill();
  doc.fillColor("#FFFFFF").fontSize(11).font("Helvetica-Bold")
    .text(sLabel, badgeX, 30, { width: 120, align: "center" });

  // Document title block
  doc.fillColor(DARK).fontSize(22).font("Helvetica-Bold")
    .text(input.title, ML, 110, { width: W });

  const titleH = doc.fontSize(22).heightOfString(input.title, { width: W });
  let y = 110 + titleH + 10;

  if (input.message) {
    doc.fillColor(MUTED).fontSize(11).font("Helvetica-Oblique")
      .text(`"${input.message}"`, ML, y, { width: W });
    y += doc.heightOfString(`"${input.message}"`, { width: W }) + 8;
  }

  drawHRule(doc, y + 10);
  y += 28;

  // Info grid (2-column)
  const col1 = ML;
  const col2 = ML + W / 2;
  const gridItems = ([
    ["Document ID", `PKT-SIG-${String(input.requestId).padStart(5, "0")}`],
    ["Created", formatDate(input.createdAt)],
    ["Status", statusLabel(input.status)],
    input.completedAt ? ["Fully Executed", formatDate(input.completedAt)] : null,
    input.patientName ? ["Patient / Subject", input.patientName] : null,
    ["Total Signers", String(input.recipients.length)],
  ] as ([string, string] | null)[]).filter((x): x is [string, string] => x !== null);

  for (let i = 0; i < gridItems.length; i += 2) {
    const pair = [gridItems[i], gridItems[i + 1]].filter(Boolean) as [string, string][];
    const rowY = y;
    for (let j = 0; j < pair.length; j++) {
      const x = j === 0 ? col1 : col2;
      doc.fillColor(MUTED).fontSize(8).font("Helvetica-Bold")
        .text(pair[j][0].toUpperCase(), x, rowY, { width: W / 2 - 10 });
      doc.fillColor(DARK).fontSize(10).font("Helvetica")
        .text(pair[j][1], x, rowY + 11, { width: W / 2 - 10 });
    }
    y += 36;
  }

  drawHRule(doc, y);
  y += 16;

  // Signers summary on cover
  doc.fillColor(DARK).fontSize(13).font("Helvetica-Bold").text("Signers", ML, y);
  y += 20;

  for (const r of input.recipients) {
    const sig = input.completedSignatures.find(s => s.recipientId === r.id);
    const rColor = r.status === "signed" ? EMERALD : r.status === "declined" ? RED : AMBER;
    const rLabel = r.status === "signed" ? "✓ Signed" : r.status === "declined" ? "✗ Declined" : "⏳ Pending";

    doc.rect(ML, y, W, 32).fillColor(LIGHT_BG).fill();
    doc.rect(ML, y, 4, 32).fillColor(rColor).fill();

    doc.fillColor(DARK).fontSize(10).font("Helvetica-Bold")
      .text(`${r.order}. ${r.name}`, ML + 12, y + 6, { width: W * 0.4 });
    doc.fillColor(MUTED).fontSize(9).font("Helvetica")
      .text(r.email, ML + 12, y + 18, { width: W * 0.4 });
    doc.fillColor(MUTED).fontSize(9).font("Helvetica")
      .text(r.role.charAt(0).toUpperCase() + r.role.slice(1), ML + W * 0.5, y + 10, { width: 80 });
    doc.fillColor(rColor).fontSize(9).font("Helvetica-Bold")
      .text(rLabel, ML + W * 0.75, y + 10, { width: 120 });
    if (r.signedAt) {
      doc.fillColor(MUTED).fontSize(8).font("Helvetica")
        .text(formatDate(r.signedAt), ML + W * 0.75, y + 20, { width: 120 });
    }

    y += 38;
    if (y > doc.page.height - 100) { doc.addPage(); y = 60; }
  }

  // Document hash on cover
  y += 8;
  doc.rect(ML, y, W, 46).fillColor("#EEF2FF").fill();
  doc.rect(ML, y, 3, 46).fillColor(BRAND_PURPLE).fill();
  doc.fillColor(BRAND_PURPLE).fontSize(8).font("Helvetica-Bold")
    .text("DOCUMENT INTEGRITY HASH (SHA-256)", ML + 10, y + 6);
  doc.fillColor(DARK).fontSize(8).font("Courier")
    .text(input.documentHash, ML + 10, y + 18, { width: W - 20 });
  doc.fillColor(MUTED).fontSize(7.5).font("Helvetica")
    .text("This hash uniquely identifies the document at the time of signing. Any modification to the document content will produce a different hash.", ML + 10, y + 32, { width: W - 20 });
  y += 56;

  // ─── PAGE 2+: DOCUMENT BODY ──────────────────────────────────────────────
  doc.addPage();

  doc.fillColor(DARK).fontSize(15).font("Helvetica-Bold").text("Document", ML, 60);
  drawHRule(doc, 82);
  y = 96;

  const blocks = htmlToBlocks(input.documentContent);
  for (const block of blocks) {
    if (y > doc.page.height - 80) { doc.addPage(); y = 60; }

    switch (block.type) {
      case "spacer":
        y += 8;
        break;
      case "heading1":
        y += 4;
        doc.fillColor(DARK).fontSize(16).font("Helvetica-Bold").text(block.text, ML, y, { width: W });
        y += doc.heightOfString(block.text, { width: W }) + 8;
        break;
      case "heading2":
        y += 2;
        doc.fillColor(DARK).fontSize(13).font("Helvetica-Bold").text(block.text, ML, y, { width: W });
        y += doc.heightOfString(block.text, { width: W }) + 6;
        break;
      case "bullet":
        doc.fillColor(MEDIUM).fontSize(10.5).font("Helvetica")
          .text(`•  ${block.text}`, ML + 14, y, { width: W - 14 });
        y += doc.heightOfString(`•  ${block.text}`, { width: W - 14 }) + 5;
        break;
      case "paragraph":
        doc.fillColor(MEDIUM).fontSize(10.5).font("Helvetica")
          .text(block.text, ML, y, { width: W });
        y += doc.heightOfString(block.text, { width: W }) + 6;
        break;
    }
  }

  // ─── FORM RESPONSES PAGE ─────────────────────────────────────────────────
  if (input.formResponses && input.formResponses.length > 0) {
    doc.addPage();
    doc.fillColor(DARK).fontSize(15).font("Helvetica-Bold").text("Form Responses", ML, 60);
    drawHRule(doc, 82);
    y = 96;

    for (const fr of input.formResponses) {
      if (fr.responses.length === 0) continue;
      if (y > doc.page.height - 120) { doc.addPage(); y = 60; }

      // Recipient header
      doc.rect(ML, y, W, 26).fillColor(LIGHT_BG).fill();
      doc.rect(ML, y, 4, 26).fillColor(BRAND_PURPLE).fill();
      doc.fillColor(DARK).fontSize(10).font("Helvetica-Bold")
        .text(`Responses from: ${fr.recipientName}`, ML + 10, y + 8, { width: W - 20 });
      y += 34;

      for (const resp of fr.responses) {
        if (y > doc.page.height - 60) { doc.addPage(); y = 60; }

        doc.fillColor(MUTED).fontSize(8).font("Helvetica-Bold")
          .text(resp.label.toUpperCase(), ML, y, { width: W });
        y += 12;

        const val = resp.value === "yes" ? "✓ Yes"
          : resp.value === "no" ? "✗ No"
          : resp.value === "true" ? "✓ Checked"
          : resp.value === "false" ? "☐ Unchecked"
          : resp.value || "—";

        doc.fillColor(DARK).fontSize(10).font("Helvetica")
          .text(val, ML + 8, y, { width: W - 8 });
        const h = doc.heightOfString(val, { width: W - 8 });
        y += h + 10;

        doc.moveTo(ML, y).lineTo(ML + W, y).strokeColor(BORDER).lineWidth(0.4).stroke();
        y += 8;
      }

      y += 8;
    }
  }

  // ─── SIGNATURE PAGES ─────────────────────────────────────────────────────
  doc.addPage();
  doc.fillColor(DARK).fontSize(15).font("Helvetica-Bold").text("Signatures", ML, 60);
  drawHRule(doc, 82);
  y = 96;

  for (const r of input.recipients) {
    const sig = input.completedSignatures.find(s => s.recipientId === r.id);

    if (y > doc.page.height - 220) { doc.addPage(); y = 60; }

    // Signer header
    doc.rect(ML, y, W, 28).fillColor(LIGHT_BG).fill();
    doc.fillColor(DARK).fontSize(11).font("Helvetica-Bold")
      .text(`${r.order}. ${r.name}`, ML + 8, y + 8, { width: W * 0.5 });
    doc.fillColor(MUTED).fontSize(9).font("Helvetica")
      .text(`${r.email} · ${r.role}`, ML + 8, y + 18, { width: W * 0.5 });
    const rColor = r.status === "signed" ? EMERALD : r.status === "declined" ? RED : AMBER;
    const rLabel = r.status === "signed" ? "SIGNED" : r.status === "declined" ? "DECLINED" : "PENDING";
    doc.fillColor(rColor).fontSize(10).font("Helvetica-Bold")
      .text(rLabel, ML + W - 80, y + 10, { width: 72, align: "right" });
    y += 36;

    if (sig) {
      // Signature box
      doc.rect(ML, y, W, 90).fillColor("#FAFBFF").fill();
      doc.rect(ML, y, W, 90).strokeColor(BRAND_PURPLE).lineWidth(0.8).stroke();

      doc.fillColor(MUTED).fontSize(8).font("Helvetica")
        .text("SIGNATURE", ML + 10, y + 6);

      if (sig.signatureType === "drawn") {
        // Embed drawn signature PNG
        try {
          const imgData = Buffer.from(sig.signatureData.replace(/^data:image\/\w+;base64,/, ""), "base64");
          doc.image(imgData, ML + 10, y + 18, { width: W * 0.55, height: 65, fit: [W * 0.55, 65] });
        } catch {
          doc.fillColor(DARK).fontSize(10).font("Helvetica-Oblique")
            .text("[Drawn signature — see digital record]", ML + 10, y + 45);
        }
      } else {
        // Typed signature in script style
        doc.fillColor(BRAND_PURPLE).fontSize(28).font("Helvetica-Oblique")
          .text(sig.fullName, ML + 10, y + 30, { width: W * 0.6 });
      }

      // X line
      doc.moveTo(ML + 8, y + 85).lineTo(ML + W * 0.65, y + 85).strokeColor(DARK).lineWidth(0.5).stroke();
      doc.fillColor(MUTED).fontSize(7.5).font("Helvetica")
        .text("✕  Signature", ML + 8, y + 87);

      // Info column (right side of sig box)
      const infoX = ML + W * 0.67;
      const infoW = W * 0.31;
      doc.fillColor(MUTED).fontSize(7.5).font("Helvetica-Bold").text("SIGNED BY", infoX, y + 8);
      doc.fillColor(DARK).fontSize(9).font("Helvetica").text(sig.fullName, infoX, y + 18, { width: infoW });
      doc.fillColor(MUTED).fontSize(7.5).font("Helvetica-Bold").text("DATE & TIME", infoX, y + 34);
      doc.fillColor(DARK).fontSize(8).font("Helvetica").text(formatDate(sig.signedAt), infoX, y + 44, { width: infoW });
      if (sig.ipAddress) {
        doc.fillColor(MUTED).fontSize(7.5).font("Helvetica-Bold").text("IP ADDRESS", infoX, y + 60);
        doc.fillColor(DARK).fontSize(8).font("Helvetica").text(sig.ipAddress, infoX, y + 70, { width: infoW });
      }

      y += 98;

      // Signature hashes
      doc.rect(ML, y, W, 34).fillColor("#F0FDF4").fill();
      doc.fillColor(EMERALD).fontSize(7.5).font("Helvetica-Bold")
        .text("SIG HASH (SHA-256)", ML + 8, y + 4);
      doc.fillColor(DARK).fontSize(7.5).font("Courier")
        .text(sig.signatureHash, ML + 8, y + 14, { width: W - 16 });
      doc.fillColor(MUTED).fontSize(7).font("Helvetica")
        .text(`Method: ${sig.signatureType === "drawn" ? "Canvas drawing" : "Typed name"} · ESIGN Act compliant`, ML + 8, y + 26);
      y += 42;

    } else if (r.status === "declined") {
      doc.rect(ML, y, W, 44).fillColor("#FEF2F2").fill();
      doc.fillColor(RED).fontSize(10).font("Helvetica-Bold")
        .text("DECLINED TO SIGN", ML + 10, y + 8);
      if (r.declineReason) {
        doc.fillColor(MEDIUM).fontSize(9).font("Helvetica")
          .text(`Reason: "${r.declineReason}"`, ML + 10, y + 22, { width: W - 20 });
      }
      if (r.declinedAt) {
        doc.fillColor(MUTED).fontSize(8).font("Helvetica")
          .text(formatDate(r.declinedAt), ML + 10, y + 34);
      }
      y += 52;
    } else {
      doc.rect(ML, y, W, 34).fillColor(LIGHT_BG).fill();
      doc.fillColor(MUTED).fontSize(10).font("Helvetica-Oblique")
        .text("Signature not yet obtained", ML + 10, y + 12);
      y += 42;
    }

    y += 18;
  }

  // ─── CERTIFICATE PAGE ─────────────────────────────────────────────────────
  doc.addPage();

  // Purple header bar
  doc.rect(0, 0, doc.page.width, 70).fill(BRAND_PURPLE);
  doc.fillColor("#FFFFFF").fontSize(16).font("Helvetica-Bold")
    .text("Signature Certificate", ML, 18);
  doc.fillColor("rgba(255,255,255,0.7)").fontSize(9).font("Helvetica")
    .text("Electronic Signature Audit Record · ESIGN Act Compliant · HIPAA §164.312(b)", ML, 40);

  y = 90;
  doc.fillColor(DARK).fontSize(11).font("Helvetica-Bold").text("Legal Certification", ML, y);
  y += 18;
  doc.fillColor(MEDIUM).fontSize(9.5).font("Helvetica").text(
    `This document certifies that the electronic signatures applied to "${input.title}" (Document ID: PKT-SIG-${String(input.requestId).padStart(5, "0")}) ` +
    `are legally binding under the Electronic Signatures in Global and National Commerce Act (ESIGN Act, 15 U.S.C. § 7001) ` +
    `and the Uniform Electronic Transactions Act (UETA). Each signer's identity was verified via a unique cryptographic token, ` +
    `and their signature was recorded with a timestamp, IP address, user agent, and SHA-256 integrity hash.`,
    ML, y, { width: W }
  );
  y += 72;

  drawHRule(doc, y);
  y += 14;

  // Document integrity
  doc.fillColor(DARK).fontSize(11).font("Helvetica-Bold").text("Document Integrity", ML, y);
  y += 16;
  doc.rect(ML, y, W, 40).fillColor("#EEF2FF").fill();
  doc.fillColor(BRAND_PURPLE).fontSize(8).font("Helvetica-Bold")
    .text("DOCUMENT SHA-256 HASH", ML + 10, y + 6);
  doc.fillColor(DARK).fontSize(8.5).font("Courier")
    .text(input.documentHash, ML + 10, y + 18, { width: W - 20 });
  y += 48;

  // Per-signer certificate table
  doc.fillColor(DARK).fontSize(11).font("Helvetica-Bold").text("Signature Records", ML, y);
  y += 14;

  for (const sig of input.completedSignatures) {
    const r = input.recipients.find(r => r.id === sig.recipientId);
    if (!r) continue;

    if (y > doc.page.height - 130) { doc.addPage(); y = 60; }

    doc.rect(ML, y, W, 88).fillColor(LIGHT_BG).fill();
    doc.rect(ML, y, 3, 88).fillColor(EMERALD).fill();

    doc.fillColor(DARK).fontSize(10).font("Helvetica-Bold")
      .text(`${r.name}`, ML + 10, y + 7);
    doc.fillColor(MUTED).fontSize(8.5).font("Helvetica")
      .text(`${r.email} · ${r.role}`, ML + 10, y + 19);

    const col1Y = y + 34;
    doc.fillColor(MUTED).fontSize(7.5).font("Helvetica-Bold").text("SIGNED", ML + 10, col1Y);
    doc.fillColor(DARK).fontSize(8.5).font("Helvetica").text(formatDate(sig.signedAt), ML + 10, col1Y + 10);

    doc.fillColor(MUTED).fontSize(7.5).font("Helvetica-Bold").text("IP ADDRESS", ML + W * 0.4, col1Y);
    doc.fillColor(DARK).fontSize(8.5).font("Helvetica").text(sig.ipAddress ?? "—", ML + W * 0.4, col1Y + 10);

    doc.fillColor(MUTED).fontSize(7.5).font("Helvetica-Bold").text("METHOD", ML + W * 0.7, col1Y);
    doc.fillColor(DARK).fontSize(8.5).font("Helvetica").text(
      sig.signatureType === "drawn" ? "Canvas drawing" : "Typed name",
      ML + W * 0.7, col1Y + 10
    );

    doc.fillColor(MUTED).fontSize(7.5).font("Helvetica-Bold").text("SIGNATURE HASH (SHA-256)", ML + 10, y + 62);
    doc.fillColor(DARK).fontSize(7.5).font("Courier")
      .text(sig.signatureHash, ML + 10, y + 73, { width: W - 20 });

    y += 96;
  }

  // Audit trail on certificate page
  if (input.auditEvents.length > 0) {
    if (y > doc.page.height - 140) { doc.addPage(); y = 60; }
    y += 8;
    doc.fillColor(DARK).fontSize(11).font("Helvetica-Bold").text("Audit Trail", ML, y);
    drawHRule(doc, y + 16);
    y += 24;

    for (const event of input.auditEvents) {
      if (y > doc.page.height - 60) { doc.addPage(); y = 60; }
      doc.rect(ML, y, 4, 18).fillColor(BRAND_PURPLE).fill();
      doc.fillColor(DARK).fontSize(8.5).font("Helvetica-Bold")
        .text(event.action.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()), ML + 12, y + 1, { width: W * 0.55 });
      doc.fillColor(MUTED).fontSize(8).font("Helvetica")
        .text(formatDate(event.createdAt), ML + W * 0.62, y + 1, { width: W * 0.35, align: "right" });
      if (event.details) {
        if (y + 26 > doc.page.height - 60) { doc.addPage(); y = 60; }
        doc.fillColor(MUTED).fontSize(8).font("Helvetica")
          .text(event.details, ML + 12, y + 13, { width: W - 16 });
        y += doc.heightOfString(event.details, { width: W - 16 }) + 16;
      } else {
        y += 22;
      }
    }
  }

   // ─── VERIFIED WATERMARK ──────────────────────────────────────────────────
  // Apply a diagonal "VERIFIED" watermark on the cover page for completed docs
  if (input.status === "completed") {
    doc.save();
    doc.opacity(0.06);
    doc.fillColor(EMERALD).fontSize(72).font("Helvetica-Bold");
    const cx = doc.page.width / 2;
    const cy = doc.page.height / 2;
    doc.rotate(-35, { origin: [cx, cy] });
    doc.text("VERIFIED", cx - 160, cy - 36, { width: 320, align: "center" });
    doc.restore();
  }

  // ─── QR CODE AUDIT TRAIL LINK ─────────────────────────────────────────────
  // Embed the audit trail URL as text (QR code library not bundled; URL is machine-readable)
  const baseUrl = process.env.APP_BASE_URL ?? process.env.REPLIT_DOMAINS?.split(",")[0]?.trim()
    ? `https://${process.env.REPLIT_DOMAINS?.split(",")[0]?.trim()}`
    : "https://packetpath.app";
  const auditUrl = `${baseUrl}/signature-requests/${input.requestId}`;
  const footerY2 = doc.page.height - 60;
  drawHRule(doc, footerY2);
  doc.fillColor(MUTED).fontSize(7).font("Helvetica")
    .text(`Audit Trail: ${auditUrl}`, ML, footerY2 + 8, { width: W, align: "center" });
  doc.fillColor(MUTED).fontSize(7)
    .text(`Document ID: PKT-SIG-${String(input.requestId).padStart(5, "0")} · PacketPath E-Signature Platform · Occu-Med Occupational Health`, ML, footerY2 + 18, { width: W, align: "center" });
  doc.fillColor(MUTED).fontSize(7)
    .text(`Generated: ${formatDate(new Date())} · SHA-256: ${input.documentHash.slice(0, 32)}...`, ML, footerY2 + 28, { width: W, align: "center" });

  doc.end();
  return doc as unknown as Readable;
}
