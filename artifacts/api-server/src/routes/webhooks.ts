/**
 * Webhook management routes (admin only)
 * GET    /api/webhooks              — list all webhooks
 * POST   /api/webhooks              — create a webhook
 * PUT    /api/webhooks/:id          — update a webhook
 * DELETE /api/webhooks/:id          — delete a webhook
 * POST   /api/webhooks/:id/test     — send a test ping
 * GET    /api/webhooks/:id/deliveries — list delivery history
 */

import { Router, type IRouter } from "express";
import { z } from "zod/v4";
import crypto from "crypto";
import { db, webhooksTable, webhookDeliveriesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { getSessionUserId } from "../lib/session-store.js";
import { fireWebhookEvent } from "../lib/webhooks.js";

const router: IRouter = Router();

async function requireAdmin(req: any, res: any): Promise<number | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) { res.status(401).json({ error: "Unauthorized" }); return null; }
  const userId = await getSessionUserId(authHeader.slice(7));
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return null; }
  const { db: dbConn, usersTable } = await import("@workspace/db");
  const { eq: eqFn } = await import("drizzle-orm");
  const [user] = await dbConn.select().from(usersTable).where(eqFn(usersTable.id, userId));
  if (!user || user.role !== "admin") { res.status(403).json({ error: "Admin only" }); return null; }
  return userId;
}

const WebhookSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  isActive: z.boolean().optional().default(true),
});

// GET /api/webhooks
router.get("/webhooks", async (req, res): Promise<void> => {
  const userId = await requireAdmin(req, res);
  if (!userId) return;

  const hooks = await db.select().from(webhooksTable).orderBy(desc(webhooksTable.createdAt));
  res.json(hooks.map(h => ({
    id: h.id,
    name: h.name,
    url: h.url,
    events: h.events,
    isActive: h.isActive,
    createdAt: h.createdAt.toISOString(),
    updatedAt: h.updatedAt.toISOString(),
  })));
});

// POST /api/webhooks
router.post("/webhooks", async (req, res): Promise<void> => {
  const userId = await requireAdmin(req, res);
  if (!userId) return;

  const parsed = WebhookSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid webhook data", details: parsed.error.issues }); return; }

  const secret = crypto.randomBytes(32).toString("hex");
  const [hook] = await db.insert(webhooksTable).values({
    name: parsed.data.name,
    url: parsed.data.url,
    secret,
    events: parsed.data.events,
    isActive: parsed.data.isActive ?? true,
    createdById: userId,
  }).returning();

  res.status(201).json({ ...hook, secret }); // Only return secret on creation
});

// PUT /api/webhooks/:id
router.put("/webhooks/:id", async (req, res): Promise<void> => {
  const userId = await requireAdmin(req, res);
  if (!userId) return;

  const id = Number(req.params.id);
  const parsed = WebhookSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid data" }); return; }

  const [hook] = await db
    .update(webhooksTable)
    .set({ ...parsed.data })
    .where(eq(webhooksTable.id, id))
    .returning();

  if (!hook) { res.status(404).json({ error: "Webhook not found" }); return; }
  res.json(hook);
});

// DELETE /api/webhooks/:id
router.delete("/webhooks/:id", async (req, res): Promise<void> => {
  const userId = await requireAdmin(req, res);
  if (!userId) return;

  const id = Number(req.params.id);
  await db.delete(webhooksTable).where(eq(webhooksTable.id, id));
  res.json({ message: "Webhook deleted" });
});

// POST /api/webhooks/:id/test — send a test ping
router.post("/webhooks/:id/test", async (req, res): Promise<void> => {
  const userId = await requireAdmin(req, res);
  if (!userId) return;

  const id = Number(req.params.id);
  const [hook] = await db.select().from(webhooksTable).where(eq(webhooksTable.id, id)).limit(1);
  if (!hook) { res.status(404).json({ error: "Webhook not found" }); return; }

  await fireWebhookEvent("packet.sent", {
    test: true,
    message: "This is a test webhook from PacketPath",
    webhookId: id,
  });

  res.json({ message: "Test event fired" });
});

// GET /api/webhooks/:id/deliveries
router.get("/webhooks/:id/deliveries", async (req, res): Promise<void> => {
  const userId = await requireAdmin(req, res);
  if (!userId) return;

  const id = Number(req.params.id);
  const deliveries = await db
    .select()
    .from(webhookDeliveriesTable)
    .where(eq(webhookDeliveriesTable.webhookId, id))
    .orderBy(desc(webhookDeliveriesTable.createdAt))
    .limit(50);

  res.json(deliveries.map(d => ({
    id: d.id,
    eventType: d.eventType,
    status: d.status,
    httpStatus: d.httpStatus,
    attemptCount: d.attemptCount,
    deliveredAt: d.deliveredAt?.toISOString() ?? null,
    createdAt: d.createdAt.toISOString(),
  })));
});

export default router;
