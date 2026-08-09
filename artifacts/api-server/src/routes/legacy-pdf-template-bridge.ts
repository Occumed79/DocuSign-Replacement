import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, signatureTemplatesTable } from "@workspace/db";

const router: IRouter = Router();

/**
 * Older PacketPath template imports embedded PDFs as base64 data URLs inside an
 * HTML <object>. Before request creation reaches the exact-source router, detect
 * that legacy representation and promote its PDF bytes into the source-document
 * request fields. This keeps existing PDF templates useful without recreating
 * the PDF from HTML and without rewriting the template record during a send.
 */
router.post("/signature-requests", async (req, _res, next): Promise<void> => {
  if (typeof req.body?.sourceDocumentBase64 === "string" && req.body.sourceDocumentBase64.length > 0) {
    next();
    return;
  }

  const templateId = req.body?.templateId ? Number(req.body.templateId) : null;
  if (!templateId || !Number.isFinite(templateId)) {
    next();
    return;
  }

  const [template] = await db.select({
    content: signatureTemplatesTable.content,
    sourceDocumentBase64: signatureTemplatesTable.sourceDocumentBase64,
    sourceDocumentFileName: signatureTemplatesTable.sourceDocumentFileName,
  }).from(signatureTemplatesTable).where(eq(signatureTemplatesTable.id, templateId)).limit(1);

  if (!template || template.sourceDocumentBase64) {
    next();
    return;
  }

  const content = template.content || "";
  const dataUrl = content.match(/data:application\/pdf;base64,([A-Za-z0-9+/=\r\n]+)/i);
  if (!dataUrl?.[1]) {
    next();
    return;
  }

  const fileNameMatch = content.match(/<strong>Imported PDF:<\/strong>\s*([^<]+)/i)
    ?? content.match(/download=["']([^"']+\.pdf)["']/i);
  const fileName = (fileNameMatch?.[1] || template.sourceDocumentFileName || `template-${templateId}.pdf`)
    .trim()
    .replace(/[\r\n]/g, " ")
    .slice(0, 240);

  req.body.sourceDocumentBase64 = dataUrl[1].replace(/\s+/g, "");
  req.body.sourceDocumentFileName = fileName;
  req.body.sourceDocumentMimeType = "application/pdf";
  next();
});

export default router;
