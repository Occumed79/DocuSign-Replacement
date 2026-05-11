import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import bcrypt from "bcrypt";

const router: IRouter = Router();

/**
 * POST /api/setup
 * One-time admin bootstrap — creates the default admin user only if NO users exist.
 * Safe to call multiple times; does nothing if users already exist.
 */
router.post("/setup", async (_req, res): Promise<void> => {
  try {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(usersTable);

    if (count > 0) {
      res.json({ ok: true, message: "Already initialized — users exist", seeded: false });
      return;
    }

    const passwordHash = await bcrypt.hash("admin123", 12);

    await db.insert(usersTable).values([
      { name: "Admin User",  email: "admin@occumed.com",    passwordHash, role: "admin"    },
      { name: "Exam QA",     email: "examqa@occumed.com",   passwordHash, role: "examqa"   },
      { name: "Reviewer",    email: "reviewer@occumed.com", passwordHash, role: "reviewer" },
    ]);

    res.json({
      ok: true,
      message: "Database seeded with default users",
      seeded: true,
      credentials: { email: "admin@occumed.com", password: "admin123" },
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message ?? "Unknown error" });
  }
});

export default router;
