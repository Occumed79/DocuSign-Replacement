import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import bcrypt from "bcrypt";
import { z } from "zod";

const router: IRouter = Router();

const SetupBody = z.object({
  orgName: z.string().min(1).max(120),
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8),
});

/**
 * GET /api/setup/status
 * Returns whether the app has been initialized (users exist).
 */
router.get("/setup/status", async (_req, res): Promise<void> => {
  try {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(usersTable);
    res.json({ initialized: count > 0 });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message ?? "Unknown error" });
  }
});

/**
 * POST /api/setup
 * One-time admin bootstrap. Only works when NO users exist.
 */
router.post("/setup", async (req, res): Promise<void> => {
  try {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(usersTable);

    if (count > 0) {
      res.status(403).json({ ok: false, error: "Already initialized" });
      return;
    }

    const parsed = SetupBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ ok: false, error: "Invalid request", details: parsed.error.flatten() });
      return;
    }

    const { name, email, password } = parsed.data;
    const passwordHash = await bcrypt.hash(password, 12);

    await db.insert(usersTable).values({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: "admin",
    });

    res.json({ ok: true, message: "Admin account created. You can now sign in." });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message ?? "Unknown error" });
  }
});

export default router;
