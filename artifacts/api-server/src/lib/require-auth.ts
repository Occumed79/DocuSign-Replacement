import type { Request, Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getSessionUserId } from "./session-store";

export async function requireAuth(req: Request, res: Response): Promise<number | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  const token = authHeader.slice(7);
  const userId = await getSessionUserId(token);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  return userId;
}

export async function requireAdmin(req: Request, res: Response): Promise<number | null> {
  const userId = await requireAuth(req, res);
  if (!userId) return null;

  const [user] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, userId));
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return null;
  }

  return userId;
}
