import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, securityOperationsEventsTable, siemDeliveriesTable } from "@workspace/db";
import { requirePermission } from "../lib/rbac";
import { isSiemConfigured } from "../lib/siem";

const router: IRouter = Router();

router.get("/security/operations/summary", async (req, res): Promise<void> => {
  const user = await requirePermission(req, res, "security:review");
  if (!user) return;

  const [events, deliveries] = await Promise.all([
    db.select().from(securityOperationsEventsTable).orderBy(desc(securityOperationsEventsTable.createdAt)).limit(200),
    db.select().from(siemDeliveriesTable).orderBy(desc(siemDeliveriesTable.createdAt)).limit(200),
  ]);

  const severityCounts = events.reduce<Record<string, number>>((acc, event) => {
    acc[event.severity] = (acc[event.severity] ?? 0) + 1;
    return acc;
  }, {});

  const deliveryCounts = deliveries.reduce<Record<string, number>>((acc, delivery) => {
    acc[delivery.status] = (acc[delivery.status] ?? 0) + 1;
    return acc;
  }, {});

  res.json({
    siemConfigured: isSiemConfigured(),
    totalEvents: events.length,
    severityCounts,
    deliveryCounts,
    recentCriticalEvents: events.filter(e => e.severity === "critical").slice(0, 20),
    recentFailedDeliveries: deliveries.filter(d => d.status === "failed").slice(0, 20),
  });
});

router.get("/security/operations/events", async (req, res): Promise<void> => {
  const user = await requirePermission(req, res, "security:review");
  if (!user) return;

  const events = await db
    .select()
    .from(securityOperationsEventsTable)
    .orderBy(desc(securityOperationsEventsTable.createdAt))
    .limit(100);

  res.json({ events });
});

router.post("/security/operations/events/:eventId/acknowledge", async (req, res): Promise<void> => {
  const user = await requirePermission(req, res, "security:review");
  if (!user) return;

  const [event] = await db.update(securityOperationsEventsTable)
    .set({
      acknowledged: true,
      acknowledgedById: user.id,
      acknowledgedAt: new Date(),
    })
    .where(eq(securityOperationsEventsTable.eventId, req.params.eventId))
    .returning();

  if (!event) {
    res.status(404).json({ error: "Security operations event not found" });
    return;
  }

  res.json({ event });
});

router.get("/security/operations/siem-deliveries", async (req, res): Promise<void> => {
  const user = await requirePermission(req, res, "security:review");
  if (!user) return;

  const deliveries = await db
    .select()
    .from(siemDeliveriesTable)
    .orderBy(desc(siemDeliveriesTable.createdAt))
    .limit(100);

  res.json({ deliveries });
});

export default router;
