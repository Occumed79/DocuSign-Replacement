/**
 * Template versioning routes
 * GET  /api/signature-templates/:id/versions     — list all versions
 * GET  /api/signature-templates/:id/versions/:v  — get a specific version
 * POST /api/signature-templates/:id/restore/:v   — restore a version as current
 */

import { Router, type IRouter } from "express";
import { db, signatureTemplatesTable, templateVersionsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth } from "../lib/require-auth";

const router: IRouter = Router();


// GET /api/signature-templates/:id/versions
router.get("/signature-templates/:id/versions", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const templateId = Number(req.params.id);
  const versions = await db
    .select()
    .from(templateVersionsTable)
    .where(eq(templateVersionsTable.templateId, templateId))
    .orderBy(desc(templateVersionsTable.version));

  res.json(versions.map(v => ({
    id: v.id,
    templateId: v.templateId,
    version: v.version,
    name: v.name,
    description: v.description,
    category: v.category,
    changeNote: v.changeNote,
    createdById: v.createdById,
    createdAt: v.createdAt.toISOString(),
  })));
});

// GET /api/signature-templates/:id/versions/:version
router.get("/signature-templates/:id/versions/:version", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const templateId = Number(req.params.id);
  const version = Number(req.params.version);

  const [v] = await db
    .select()
    .from(templateVersionsTable)
    .where(and(eq(templateVersionsTable.templateId, templateId), eq(templateVersionsTable.version, version)))
    .limit(1);

  if (!v) { res.status(404).json({ error: "Version not found" }); return; }

  res.json({
    id: v.id,
    templateId: v.templateId,
    version: v.version,
    name: v.name,
    description: v.description,
    category: v.category,
    content: v.content,
    formSchema: v.formSchema,
    changeNote: v.changeNote,
    createdAt: v.createdAt.toISOString(),
  });
});

// POST /api/signature-templates/:id/restore/:version
router.post("/signature-templates/:id/restore/:version", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const templateId = Number(req.params.id);
  const version = Number(req.params.version);

  const [v] = await db
    .select()
    .from(templateVersionsTable)
    .where(and(eq(templateVersionsTable.templateId, templateId), eq(templateVersionsTable.version, version)))
    .limit(1);

  if (!v) { res.status(404).json({ error: "Version not found" }); return; }

  // Get current template to snapshot it first
  const [current] = await db
    .select()
    .from(signatureTemplatesTable)
    .where(eq(signatureTemplatesTable.id, templateId))
    .limit(1);

  if (!current) { res.status(404).json({ error: "Template not found" }); return; }

  // Get next version number
  const [latestVersion] = await db
    .select({ version: templateVersionsTable.version })
    .from(templateVersionsTable)
    .where(eq(templateVersionsTable.templateId, templateId))
    .orderBy(desc(templateVersionsTable.version))
    .limit(1);

  const nextVersion = (latestVersion?.version ?? 0) + 1;

  // Save current state as a new version before restoring
  await db.insert(templateVersionsTable).values({
    templateId,
    version: nextVersion,
    name: current.name,
    description: current.description ?? null,
    category: current.category,
    content: current.content,
    formSchema: current.formSchema,
    changeNote: `Auto-snapshot before restoring v${version}`,
    createdById: userId,
  });

  // Restore the requested version
  const [updated] = await db
    .update(signatureTemplatesTable)
    .set({
      name: v.name,
      description: v.description,
      category: v.category,
      content: v.content,
      formSchema: v.formSchema,
    })
    .where(eq(signatureTemplatesTable.id, templateId))
    .returning();

  res.json({ message: `Restored to version ${version}`, template: updated });
});

export default router;
