import { describe, expect, it } from "vitest";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { buildExecutedSourcePdf } from "./source-document-pdf";

async function makeSourcePdf() {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  page.drawText("ORIGINAL SOURCE FORM", { x: 72, y: 700, size: 24, font, color: rgb(0.1, 0.1, 0.1) });
  const bytes = await pdf.save({ useObjectStreams: false });
  return Buffer.from(bytes);
}

describe("buildExecutedSourcePdf", () => {
  it("keeps the original page and appends execution evidence", async () => {
    const source = await makeSourcePdf();
    const executed = await buildExecutedSourcePdf({
      sourceDocumentBase64: source.toString("base64"),
      sourceDocumentFileName: "original.pdf",
      requestId: 42,
      title: "Provider Service Agreement",
      status: "completed",
      documentHash: "a".repeat(64),
      createdAt: new Date("2026-08-09T12:00:00Z"),
      completedAt: new Date("2026-08-09T12:05:00Z"),
      recipients: [{
        id: 1,
        name: "Test Signer",
        email: "signer@example.com",
        role: "signer",
        order: 1,
        status: "signed",
        signedAt: new Date("2026-08-09T12:05:00Z"),
        ipAddress: "127.0.0.1",
      }],
      completedSignatures: [{
        recipientId: 1,
        signatureType: "typed",
        signatureData: "Test Signer",
        fullName: "Test Signer",
        documentHash: "a".repeat(64),
        signatureHash: "b".repeat(64),
        signedAt: new Date("2026-08-09T12:05:00Z"),
        ipAddress: "127.0.0.1",
      }],
      formResponses: [],
      auditEvents: [],
    });

    const output = await PDFDocument.load(executed);
    expect(output.getPageCount()).toBeGreaterThan(1);
    expect(output.getPage(0).getSize()).toEqual({ width: 612, height: 792 });
    expect(executed.subarray(0, 5).toString("ascii")).toBe("%PDF-");
  });

  it("rejects non-PDF source bytes", async () => {
    await expect(buildExecutedSourcePdf({
      sourceDocumentBase64: Buffer.from("not a pdf").toString("base64"),
      sourceDocumentFileName: "bad.pdf",
      requestId: 1,
      title: "Bad",
      status: "pending",
      documentHash: "0".repeat(64),
      createdAt: new Date(),
      completedAt: null,
      recipients: [],
      completedSignatures: [],
      formResponses: [],
      auditEvents: [],
    })).rejects.toThrow(/valid PDF/i);
  });
});
