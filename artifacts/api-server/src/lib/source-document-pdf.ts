import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

export interface SourcePdfRecipient {
  id: number;
  name: string;
  email: string;
  role: string;
  order: number;
  status: string;
  signedAt: Date | null;
  ipAddress: string | null;
}

export interface SourcePdfSignature {
  recipientId: number;
  signatureType: string;
  signatureData: string;
  fullName: string;
  documentHash: string;
  signatureHash: string;
  signedAt: Date;
  ipAddress: string | null;
}

export interface SourcePdfFormResponse {
  recipientId: number;
  recipientName: string;
  responses: Array<{ fieldId?: string; label?: string; name?: string; value: unknown }>;
}

export interface SourcePdfAuditEvent {
  action: string;
  details: string | null;
  createdAt: Date;
}

export interface SourceDocumentExecutionInput {
  sourceDocumentBase64: string;
  sourceDocumentFileName: string | null;
  requestId: number;
  title: string;
  status: string;
  documentHash: string;
  createdAt: Date;
  completedAt: Date | null;
  recipients: SourcePdfRecipient[];
  completedSignatures: SourcePdfSignature[];
  formResponses: SourcePdfFormResponse[];
  auditEvents: SourcePdfAuditEvent[];
}

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 48;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function formatDate(value: Date | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function safeText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [""];
  const words = normalized.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    if (font.widthOfTextAtSize(word, size) <= maxWidth) {
      line = word;
      continue;
    }
    let chunk = "";
    for (const ch of word) {
      const next = chunk + ch;
      if (font.widthOfTextAtSize(next, size) > maxWidth && chunk) {
        lines.push(chunk);
        chunk = ch;
      } else {
        chunk = next;
      }
    }
    line = chunk;
  }
  if (line) lines.push(line);
  return lines;
}

function drawHeader(page: PDFPage, bold: PDFFont, regular: PDFFont, title: string, subtitle: string) {
  page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 76, width: PAGE_WIDTH, height: 76, color: rgb(0.035, 0.165, 0.196) });
  page.drawText(title, { x: MARGIN, y: PAGE_HEIGHT - 42, size: 17, font: bold, color: rgb(1, 1, 1) });
  page.drawText(subtitle, { x: MARGIN, y: PAGE_HEIGHT - 61, size: 8.5, font: regular, color: rgb(0.78, 0.88, 0.87) });
}

function addAppendixPage(pdf: PDFDocument, bold: PDFFont, regular: PDFFont, title = "Execution Record") {
  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawHeader(page, bold, regular, title, "PacketPath · Occu-Med Occupational Health · appended to the unchanged source document");
  return page;
}

function drawLabelValue(page: PDFPage, bold: PDFFont, regular: PDFFont, y: number, label: string, value: string): number {
  page.drawText(label.toUpperCase(), { x: MARGIN, y, size: 7.5, font: bold, color: rgb(0.34, 0.42, 0.46) });
  const lines = wrapText(value, regular, 10, CONTENT_WIDTH);
  let cursor = y - 14;
  for (const line of lines) {
    page.drawText(line, { x: MARGIN, y: cursor, size: 10, font: regular, color: rgb(0.08, 0.12, 0.14) });
    cursor -= 13;
  }
  return cursor - 8;
}

function ensureSpace(params: {
  pdf: PDFDocument;
  page: PDFPage;
  y: number;
  needed: number;
  bold: PDFFont;
  regular: PDFFont;
  title?: string;
}): { page: PDFPage; y: number } {
  if (params.y - params.needed >= MARGIN) return { page: params.page, y: params.y };
  const page = addAppendixPage(params.pdf, params.bold, params.regular, params.title ?? "Execution Record — continued");
  return { page, y: PAGE_HEIGHT - 104 };
}

function decodeSourcePdf(base64: string): Uint8Array {
  const buffer = Buffer.from(base64, "base64");
  if (buffer.length < 8 || buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new Error("Stored source document is not a valid PDF");
  }
  return new Uint8Array(buffer);
}

async function drawSignatureImageIfPossible(pdf: PDFDocument, page: PDFPage, signature: SourcePdfSignature, y: number) {
  if (signature.signatureType !== "drawn" || !signature.signatureData.startsWith("data:image/png;base64,")) return;
  try {
    const bytes = Buffer.from(signature.signatureData.split(",", 2)[1] ?? "", "base64");
    const image = await pdf.embedPng(bytes);
    const maxW = 180;
    const maxH = 48;
    const scale = Math.min(maxW / image.width, maxH / image.height, 1);
    page.drawImage(image, { x: MARGIN + 8, y: y - maxH + 3, width: image.width * scale, height: image.height * scale });
  } catch {
    // Evidence text remains authoritative even when a legacy image cannot be embedded.
  }
}

/**
 * Preserve every original PDF page visually unchanged and append PacketPath's
 * execution evidence after it. We intentionally do not reconstruct the source
 * document from HTML; the source PDF is the document of record.
 */
export async function buildExecutedSourcePdf(input: SourceDocumentExecutionInput): Promise<Buffer> {
  const source = await PDFDocument.load(decodeSourcePdf(input.sourceDocumentBase64), { ignoreEncryption: false });
  const output = await PDFDocument.create();
  const copied = await output.copyPages(source, source.getPageIndices());
  for (const page of copied) output.addPage(page);

  const regular = await output.embedFont(StandardFonts.Helvetica);
  const bold = await output.embedFont(StandardFonts.HelveticaBold);
  const italic = await output.embedFont(StandardFonts.HelveticaOblique);

  let page = addAppendixPage(output, bold, regular);
  let y = PAGE_HEIGHT - 108;

  page.drawText("Source document preserved", { x: MARGIN, y, size: 14, font: bold, color: rgb(0.035, 0.165, 0.196) });
  y -= 20;
  const preservation = "All pages before this appendix are copied from the exact PDF source attached to this request. PacketPath does not recreate those source pages from HTML.";
  for (const line of wrapText(preservation, regular, 9.5, CONTENT_WIDTH)) {
    page.drawText(line, { x: MARGIN, y, size: 9.5, font: regular, color: rgb(0.24, 0.31, 0.34) });
    y -= 13;
  }
  y -= 8;

  y = drawLabelValue(page, bold, regular, y, "Document", input.title);
  y = drawLabelValue(page, bold, regular, y, "Source file", input.sourceDocumentFileName ?? "source.pdf");
  y = drawLabelValue(page, bold, regular, y, "Request ID", `PKT-SIG-${String(input.requestId).padStart(5, "0")}`);
  y = drawLabelValue(page, bold, regular, y, "Status", input.status);
  y = drawLabelValue(page, bold, regular, y, "Created", formatDate(input.createdAt));
  y = drawLabelValue(page, bold, regular, y, "Completed", formatDate(input.completedAt));
  y = drawLabelValue(page, bold, regular, y, "Source SHA-256", input.documentHash);

  ({ page, y } = ensureSpace({ pdf: output, page, y, needed: 80, bold, regular, title: "Signer Evidence" }));
  page.drawText("Signer Evidence", { x: MARGIN, y, size: 14, font: bold, color: rgb(0.035, 0.165, 0.196) });
  y -= 22;

  for (const recipient of [...input.recipients].sort((a, b) => a.order - b.order)) {
    const signature = input.completedSignatures.find(s => s.recipientId === recipient.id);
    ({ page, y } = ensureSpace({ pdf: output, page, y, needed: signature ? 116 : 72, bold, regular, title: "Signer Evidence — continued" }));
    page.drawRectangle({ x: MARGIN, y: y - (signature ? 96 : 54), width: CONTENT_WIDTH, height: signature ? 100 : 58, color: rgb(0.955, 0.97, 0.97) });
    page.drawText(`${recipient.order}. ${recipient.name}`, { x: MARGIN + 10, y: y - 16, size: 11, font: bold, color: rgb(0.08, 0.12, 0.14) });
    page.drawText(`${recipient.email} · ${recipient.role} · ${recipient.status}`, { x: MARGIN + 10, y: y - 31, size: 8.5, font: regular, color: rgb(0.34, 0.42, 0.46) });
    if (signature) {
      page.drawText(`Signed: ${formatDate(signature.signedAt)} · IP: ${signature.ipAddress ?? "not recorded"}`, { x: MARGIN + 10, y: y - 46, size: 8.5, font: regular, color: rgb(0.34, 0.42, 0.46) });
      page.drawText(`Evidence hash: ${signature.signatureHash}`, { x: MARGIN + 10, y: y - 61, size: 7.2, font: regular, color: rgb(0.34, 0.42, 0.46) });
      if (signature.signatureType === "typed") {
        page.drawText(signature.fullName, { x: MARGIN + 10, y: y - 82, size: 16, font: italic, color: rgb(0.035, 0.165, 0.196) });
      } else {
        await drawSignatureImageIfPossible(output, page, signature, y - 50);
      }
      y -= 110;
    } else {
      y -= 68;
    }
  }

  if (input.formResponses.some(group => group.responses.length > 0)) {
    ({ page, y } = ensureSpace({ pdf: output, page, y, needed: 56, bold, regular, title: "Captured Form Responses" }));
    page.drawText("Captured Form Responses", { x: MARGIN, y, size: 14, font: bold, color: rgb(0.035, 0.165, 0.196) });
    y -= 22;
    for (const group of input.formResponses) {
      if (group.responses.length === 0) continue;
      ({ page, y } = ensureSpace({ pdf: output, page, y, needed: 38, bold, regular, title: "Captured Form Responses — continued" }));
      page.drawText(group.recipientName, { x: MARGIN, y, size: 10.5, font: bold, color: rgb(0.08, 0.12, 0.14) });
      y -= 16;
      for (const response of group.responses) {
        const label = response.label || response.name || response.fieldId || "Field";
        const value = safeText(response.value);
        const lines = wrapText(`${label}: ${value}`, regular, 8.8, CONTENT_WIDTH - 12);
        ({ page, y } = ensureSpace({ pdf: output, page, y, needed: lines.length * 12 + 8, bold, regular, title: "Captured Form Responses — continued" }));
        for (const line of lines) {
          page.drawText(line, { x: MARGIN + 8, y, size: 8.8, font: regular, color: rgb(0.24, 0.31, 0.34) });
          y -= 12;
        }
        y -= 3;
      }
      y -= 6;
    }
  }

  if (input.auditEvents.length > 0) {
    ({ page, y } = ensureSpace({ pdf: output, page, y, needed: 54, bold, regular, title: "Audit Trail" }));
    page.drawText("Audit Trail", { x: MARGIN, y, size: 14, font: bold, color: rgb(0.035, 0.165, 0.196) });
    y -= 22;
    for (const event of [...input.auditEvents].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())) {
      const text = `${formatDate(event.createdAt)} · ${event.action}${event.details ? ` · ${event.details}` : ""}`;
      const lines = wrapText(text, regular, 7.8, CONTENT_WIDTH - 10);
      ({ page, y } = ensureSpace({ pdf: output, page, y, needed: lines.length * 10 + 5, bold, regular, title: "Audit Trail — continued" }));
      for (const line of lines) {
        page.drawText(line, { x: MARGIN + 6, y, size: 7.8, font: regular, color: rgb(0.34, 0.42, 0.46) });
        y -= 10;
      }
      y -= 3;
    }
  }

  const bytes = await output.save({ useObjectStreams: false });
  return Buffer.from(bytes);
}
