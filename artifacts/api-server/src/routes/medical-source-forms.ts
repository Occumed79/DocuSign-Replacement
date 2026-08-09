import { Router, type IRouter, type Request } from "express";
import { and, eq } from "drizzle-orm";
import {
  answersTable,
  auditLogsTable,
  casesTable,
  db,
  examTypesTable,
  medicalSourceFormsTable,
  questionsTable,
  usersTable,
} from "@workspace/db";
import { requireAdmin, requireAuth } from "../lib/require-auth";
import { getVisibleQuestions } from "../lib/reactive-interview";
import { buildMedicalHistoryResponseGroups } from "../lib/medical-history-review";
import { appendMedicalAdditionalDetails } from "../lib/medical-source-additional-details";
import {
  inspectMedicalSourcePdf,
  renderMappedMedicalSourcePdf,
  validateMedicalSourceMapping,
  type MedicalSourceMapping,
} from "../lib/medical-source-pdf";
import {
  MEDICAL_SOURCE_REGISTRY,
  getMedicalSourceRegistryEntry,
} from "../lib/medical-source-registry";

const router: IRouter = Router();
const MAX_SOURCE_BYTES = 12 * 1024 * 1024;

function clientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress ?? "unknown";
}

function decodeSourcePdf(value: unknown): Buffer {
  if (typeof value !== "string" || !value.trim()) throw new Error("sourceDocumentBase64 is required");
  const cleaned = value.replace(/^data:application\/pdf;base64,/i, "").replace(/\s+/g, "");
  const bytes = Buffer.from(cleaned, "base64");
  if (bytes.length === 0 || bytes.length > MAX_SOURCE_BYTES) {
    throw new Error(`Source PDF must be between 1 byte and ${Math.round(MAX_SOURCE_BYTES / 1024 / 1024)} MB`);
  }
  return bytes;
}

function relevantQuestions(all: Array<typeof questionsTable.$inferSelect>, examTypeId: number) {
  return all.filter(question => Array.isArray(question.examTypeIds) && question.examTypeIds.includes(examTypeId));
}

function rootSourceQuestions(questions: Array<typeof questionsTable.$inferSelect>) {
  const childIds = new Set<number>();
  for (const question of questions) for (const childId of question.followUpIds ?? []) childIds.add(childId);
  return questions.filter(question => !childIds.has(question.id) && Boolean(question.sourceKey));
}

async function audit(params: {
  req: Request;
  userId: number;
  action: string;
  resourceId: string;
  details: string;
  patientName?: string | null;
}) {
  const [user] = await db.select({ name: usersTable.name, email: usersTable.email })
    .from(usersTable).where(eq(usersTable.id, params.userId)).limit(1);
  await db.insert(auditLogsTable).values({
    userId: params.userId,
    userEmail: user?.email ?? null,
    userName: user?.name ?? null,
    action: params.action as any,
    resource: "medical_source_form",
    resourceId: params.resourceId,
    details: params.details,
    ipAddress: clientIp(params.req),
    userAgent: params.req.headers["user-agent"] ?? null,
    phiAccessed: Boolean(params.patientName),
    patientName: params.patientName ?? null,
  }).catch(() => undefined);
}

async function sourceForExam(examTypeId: number) {
  const [source] = await db.select().from(medicalSourceFormsTable)
    .where(and(eq(medicalSourceFormsTable.examTypeId, examTypeId), eq(medicalSourceFormsTable.isActive, true)))
    .limit(1);
  return source ?? null;
}

// ─── Registry / administration ──────────────────────────────────────────────

router.get("/medical-source-forms/registry", async (req, res): Promise<void> => {
  const userId = await requireAdmin(req, res);
  if (!userId) return;
  const [examTypes, installed] = await Promise.all([
    db.select({ id: examTypesTable.id, slug: examTypesTable.slug, name: examTypesTable.name }).from(examTypesTable),
    db.select({
      id: medicalSourceFormsTable.id,
      examTypeId: medicalSourceFormsTable.examTypeId,
      sourceFamily: medicalSourceFormsTable.sourceFamily,
      sourceSha256: medicalSourceFormsTable.sourceSha256,
      sourceFileName: medicalSourceFormsTable.sourceFileName,
      pageCount: medicalSourceFormsTable.pageCount,
      mappingValidatedAt: medicalSourceFormsTable.mappingValidatedAt,
      isActive: medicalSourceFormsTable.isActive,
      updatedAt: medicalSourceFormsTable.updatedAt,
    }).from(medicalSourceFormsTable),
  ]);
  res.setHeader("Cache-Control", "private, no-store");
  res.json({ registry: MEDICAL_SOURCE_REGISTRY, examTypes, installed });
});

router.post("/medical-source-forms/:examTypeId/upload", async (req, res): Promise<void> => {
  const userId = await requireAdmin(req, res);
  if (!userId) return;
  const examTypeId = Number(req.params.examTypeId);
  const sourceFamily = typeof req.body?.sourceFamily === "string" ? req.body.sourceFamily.trim() : "";
  const fileName = typeof req.body?.fileName === "string" ? req.body.fileName.trim().slice(0, 240) : "source.pdf";
  if (!Number.isFinite(examTypeId)) { res.status(400).json({ error: "Invalid exam type" }); return; }
  const registry = getMedicalSourceRegistryEntry(sourceFamily);
  if (!registry) { res.status(400).json({ error: "Unknown source form family" }); return; }

  const [examType] = await db.select({ id: examTypesTable.id, name: examTypesTable.name }).from(examTypesTable)
    .where(eq(examTypesTable.id, examTypeId)).limit(1);
  if (!examType) { res.status(404).json({ error: "Exam type not found" }); return; }

  try {
    const bytes = decodeSourcePdf(req.body?.sourceDocumentBase64);
    const inspection = await inspectMedicalSourcePdf(bytes);
    if (inspection.sha256 !== registry.sha256) {
      res.status(422).json({
        error: "Source PDF fingerprint does not match the verified source revision",
        expectedSha256: registry.sha256,
        actualSha256: inspection.sha256,
      });
      return;
    }
    if (inspection.pageCount !== registry.pageCount) {
      res.status(422).json({ error: `Source PDF page count must be ${registry.pageCount}` });
      return;
    }

    const [saved] = await db.insert(medicalSourceFormsTable).values({
      examTypeId,
      sourceFamily,
      sourceSha256: inspection.sha256,
      sourceMimeType: "application/pdf",
      sourceFileName: fileName || `${sourceFamily}.pdf`,
      sourceDocumentBase64: bytes.toString("base64"),
      pageCount: inspection.pageCount,
      mappingVersion: registry.mappingVersion,
      fieldMap: {},
      mappingValidatedAt: null,
      mappingValidatedById: null,
      uploadedById: userId,
      isActive: true,
    }).onConflictDoUpdate({
      target: [medicalSourceFormsTable.examTypeId, medicalSourceFormsTable.sourceFamily],
      set: {
        sourceSha256: inspection.sha256,
        sourceMimeType: "application/pdf",
        sourceFileName: fileName || `${sourceFamily}.pdf`,
        sourceDocumentBase64: bytes.toString("base64"),
        pageCount: inspection.pageCount,
        mappingVersion: registry.mappingVersion,
        fieldMap: {},
        mappingValidatedAt: null,
        mappingValidatedById: null,
        uploadedById: userId,
        isActive: true,
        updatedAt: new Date(),
      },
    }).returning();

    await audit({ req, userId, action: "create", resourceId: String(saved.id), details: `Verified source PDF uploaded for ${examType.name}: ${sourceFamily} ${inspection.sha256}` });
    res.status(201).json({
      id: saved.id,
      examTypeId,
      sourceFamily,
      sourceFileName: saved.sourceFileName,
      sourceSha256: saved.sourceSha256,
      pageCount: inspection.pageCount,
      strategy: registry.strategy,
      acroFormFieldCount: inspection.fields.length,
      mappingValidated: false,
    });
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? "Unable to inspect source PDF" });
  }
});

router.get("/medical-source-forms/:examTypeId/fields", async (req, res): Promise<void> => {
  const userId = await requireAdmin(req, res);
  if (!userId) return;
  const examTypeId = Number(req.params.examTypeId);
  const source = await sourceForExam(examTypeId);
  if (!source) { res.status(404).json({ error: "No active verified source PDF for this exam type" }); return; }
  const registry = getMedicalSourceRegistryEntry(source.sourceFamily);
  if (!registry || registry.sha256 !== source.sourceSha256) { res.status(409).json({ error: "Stored source PDF no longer matches registry" }); return; }

  try {
    const bytes = Buffer.from(source.sourceDocumentBase64, "base64");
    const inspection = await inspectMedicalSourcePdf(bytes);
    const allQuestions = await db.select().from(questionsTable).orderBy(questionsTable.section, questionsTable.orderIndex);
    const roots = rootSourceQuestions(relevantQuestions(allQuestions, examTypeId));
    res.setHeader("Cache-Control", "private, no-store");
    res.json({
      sourceId: source.id,
      sourceFamily: source.sourceFamily,
      sourceFileName: source.sourceFileName,
      strategy: registry.strategy,
      mappingVersion: source.mappingVersion,
      mappingValidatedAt: source.mappingValidatedAt?.toISOString() ?? null,
      pageSizes: inspection.pageSizes,
      fields: inspection.fields,
      sourceQuestions: roots.map(question => ({
        questionId: question.id,
        sourceKey: question.sourceKey,
        text: question.text,
        section: question.section,
        answerType: question.answerType,
      })),
      fieldMap: source.fieldMap ?? {},
    });
  } catch (err: any) {
    res.status(422).json({ error: err?.message ?? "Unable to inspect stored source PDF" });
  }
});

router.put("/medical-source-forms/:sourceId/mapping", async (req, res): Promise<void> => {
  const userId = await requireAdmin(req, res);
  if (!userId) return;
  const sourceId = Number(req.params.sourceId);
  const [source] = await db.select().from(medicalSourceFormsTable).where(eq(medicalSourceFormsTable.id, sourceId)).limit(1);
  if (!source) { res.status(404).json({ error: "Source form not found" }); return; }
  const registry = getMedicalSourceRegistryEntry(source.sourceFamily);
  if (!registry || registry.sha256 !== source.sourceSha256) { res.status(409).json({ error: "Stored source PDF fingerprint is not registered" }); return; }
  const mapping = req.body?.fieldMap as MedicalSourceMapping;
  if (!mapping || typeof mapping !== "object" || Array.isArray(mapping)) { res.status(400).json({ error: "fieldMap must be an object keyed by sourceKey" }); return; }

  try {
    const bytes = Buffer.from(source.sourceDocumentBase64, "base64");
    const allQuestions = await db.select().from(questionsTable).orderBy(questionsTable.section, questionsTable.orderIndex);
    const roots = rootSourceQuestions(relevantQuestions(allQuestions, source.examTypeId));
    const allowedSourceKeys = new Set(roots.map(question => question.sourceKey).filter((key): key is string => Boolean(key)));
    if (allowedSourceKeys.size === 0) {
      res.status(409).json({ error: "This exam type does not yet have stable source question keys" });
      return;
    }
    const validation = await validateMedicalSourceMapping({ bytes, mapping, allowedSourceKeys, strategy: registry.strategy });
    const validatedAt = new Date();
    await db.update(medicalSourceFormsTable).set({
      fieldMap: mapping,
      mappingValidatedAt: validatedAt,
      mappingValidatedById: userId,
      mappingVersion: registry.mappingVersion,
      updatedAt: validatedAt,
    }).where(eq(medicalSourceFormsTable.id, source.id));
    await audit({ req, userId, action: "update", resourceId: String(source.id), details: `Official source-form mapping validated: ${validation.mappedKeys.length} source keys.` });
    res.json({ validated: true, mappedKeys: validation.mappedKeys, mappingValidatedAt: validatedAt.toISOString() });
  } catch (err: any) {
    res.status(422).json({ error: err?.message ?? "Source-form mapping is not valid for this PDF" });
  }
});

router.delete("/medical-source-forms/:sourceId", async (req, res): Promise<void> => {
  const userId = await requireAdmin(req, res);
  if (!userId) return;
  const sourceId = Number(req.params.sourceId);
  const [deleted] = await db.delete(medicalSourceFormsTable).where(eq(medicalSourceFormsTable.id, sourceId)).returning({ id: medicalSourceFormsTable.id });
  if (!deleted) { res.status(404).json({ error: "Source form not found" }); return; }
  await audit({ req, userId, action: "delete", resourceId: String(sourceId), details: "Verified medical source PDF and mapping removed." });
  res.json({ deleted: true });
});

// ─── Case-level availability and rendering ──────────────────────────────────

router.get("/cases/:id/official-source-form/status", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  const caseId = Number(req.params.id);
  const [caseRecord] = await db.select().from(casesTable).where(eq(casesTable.id, caseId)).limit(1);
  if (!caseRecord) { res.status(404).json({ error: "Case not found" }); return; }
  const source = await sourceForExam(caseRecord.examTypeId);
  const registry = source ? getMedicalSourceRegistryEntry(source.sourceFamily) : undefined;
  const ready = Boolean(source && registry && source.sourceSha256 === registry.sha256 && source.mappingValidatedAt && Object.keys((source.fieldMap ?? {}) as object).length > 0);
  res.setHeader("Cache-Control", "private, no-store");
  res.json({
    available: Boolean(source),
    ready,
    sourceFamily: source?.sourceFamily ?? null,
    sourceFileName: source?.sourceFileName ?? null,
    mappingValidatedAt: source?.mappingValidatedAt?.toISOString() ?? null,
    reason: !source ? "No verified source PDF uploaded" : !source.mappingValidatedAt ? "Source mapping has not been validated" : ready ? null : "Source PDF fingerprint or mapping is not current",
  });
});

router.get("/cases/:id/official-source-form.pdf", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  const caseId = Number(req.params.id);
  const [row] = await db.select({ case: casesTable, examType: examTypesTable }).from(casesTable)
    .leftJoin(examTypesTable, eq(casesTable.examTypeId, examTypesTable.id))
    .where(eq(casesTable.id, caseId)).limit(1);
  if (!row) { res.status(404).json({ error: "Case not found" }); return; }
  const source = await sourceForExam(row.case.examTypeId);
  if (!source) { res.status(422).json({ error: "No verified official source PDF has been uploaded for this questionnaire" }); return; }
  const registry = getMedicalSourceRegistryEntry(source.sourceFamily);
  if (!registry || registry.sha256 !== source.sourceSha256 || !source.mappingValidatedAt) {
    res.status(422).json({ error: "Official source form is not ready: exact PDF and validated mapping are required" });
    return;
  }

  try {
    const allQuestions = await db.select().from(questionsTable).orderBy(questionsTable.section, questionsTable.orderIndex);
    const questions = relevantQuestions(allQuestions, row.case.examTypeId);
    const allAnswers = await db.select().from(answersTable).where(eq(answersTable.caseId, caseId));
    const answersById = new Map(allAnswers.map(answer => [answer.questionId, answer.value]));
    const visible = getVisibleQuestions(questions, answersById);
    const visibleIds = new Set(visible.map(question => question.id));
    const visibleQuestions = questions.filter(question => visibleIds.has(question.id));
    const roots = rootSourceQuestions(questions);
    const answersBySourceKey = new Map<string, string>();
    for (const question of roots) {
      if (question.sourceKey) answersBySourceKey.set(question.sourceKey, answersById.get(question.id) ?? "");
    }

    const sourceBytes = Buffer.from(source.sourceDocumentBase64, "base64");
    const mapping = source.fieldMap as MedicalSourceMapping;
    const allowedSourceKeys = new Set(roots.map(question => question.sourceKey).filter((key): key is string => Boolean(key)));
    await validateMedicalSourceMapping({ bytes: sourceBytes, mapping, allowedSourceKeys, strategy: registry.strategy });
    let rendered = await renderMappedMedicalSourcePdf({ bytes: sourceBytes, mapping, answersBySourceKey, flatten: registry.strategy === "acroform" });

    const groups = buildMedicalHistoryResponseGroups(
      visibleQuestions.map(question => ({
        id: question.id,
        text: question.text,
        section: question.section,
        orderIndex: question.orderIndex,
        required: question.required,
        followUpIds: question.followUpIds ?? [],
      })),
      answersById,
    );
    rendered = await appendMedicalAdditionalDetails({
      sourcePdf: rendered,
      examTypeName: row.examType?.name ?? "Medical History Questionnaire",
      patientName: row.case.patientName,
      caseId,
      groups,
    });

    const safe = row.case.patientName.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "").slice(0, 50) || `case_${caseId}`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Official_Medical_History_${safe}_${caseId}.pdf"`);
    res.setHeader("Cache-Control", "private, no-store");
    res.send(Buffer.from(rendered));
    await audit({ req, userId, action: "export", resourceId: String(source.id), details: `[case ${caseId}] Verified official source form rendered from ${source.sourceFamily}.`, patientName: row.case.patientName });
  } catch (err: any) {
    res.status(422).json({ error: err?.message ?? "Unable to render official source form" });
  }
});

export default router;
