import { Router, type IRouter, type Request } from "express";
import { db, usersTable, auditLogsTable } from "@workspace/db";
import { eq, ne } from "drizzle-orm";
import { z } from "zod/v4";
import { getSessionUserId, logSecurityEvent } from "../lib/session-store";
import { hashPassword } from "./auth";

const router: IRouter = Router();

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress ?? "unknown";
}

async function requireAdmin(req: Request, res: any): Promise<number | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  const token = authHeader.slice(7);
  const userId = await getSessionUserId(token);
  if (!userId) {
    res.status(401).json({ error: "Invalid or expired session" });
    return null;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return null;
  }
  return userId;
}

async function requireAuth(req: Request, res: any): Promise<number | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  const token = authHeader.slice(7);
  const userId = await getSessionUserId(token);
  if (!userId) {
    res.status(401).json({ error: "Invalid or expired session" });
    return null;
  }
  return userId;
}

const CreateUserBody = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(["admin", "examqa", "reviewer"]).default("examqa"),
});

const UpdateUserBody = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(["admin", "examqa", "reviewer"]).optional(),
});

const ChangePasswordBody = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

const AdminResetPasswordBody = z.object({
  newPassword: z.string().min(8).max(128),
});

// GET /api/users — list all users (admin only)
router.get("/users", async (req, res): Promise<void> => {
  const adminId = await requireAdmin(req, res);
  if (!adminId) return;

  const users = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      createdAt: usersTable.createdAt,
      updatedAt: usersTable.updatedAt,
    })
    .from(usersTable)
    .orderBy(usersTable.createdAt);

  res.json(users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString(), updatedAt: u.updatedAt.toISOString() })));
});

// POST /api/users — create a new user (admin only)
router.post("/users", async (req, res): Promise<void> => {
  const adminId = await requireAdmin(req, res);
  if (!adminId) return;

  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
    return;
  }

  const { name, email, password, role } = parsed.data;

  // Check for duplicate email
  const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email));
  if (existing) {
    res.status(409).json({ error: "A user with this email already exists" });
    return;
  }

  const passwordHash = await hashPassword(password);
  const [newUser] = await db
    .insert(usersTable)
    .values({ name, email, passwordHash, role })
    .returning();

  const ip = getClientIp(req);
  await logSecurityEvent({
    eventType: "admin_action",
    userId: adminId,
    ip,
    details: `Created user ${email} with role ${role}`,
    severity: "info",
  });
  await db.insert(auditLogsTable).values({
    userId: adminId,
    action: "create",
    resource: "user",
    resourceId: String(newUser.id),
    details: `Created user ${email} (role: ${role})`,
    ipAddress: ip,
    userAgent: req.headers["user-agent"] ?? null,
    phiAccessed: false,
  }).catch(() => {});

  res.status(201).json({
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    createdAt: newUser.createdAt.toISOString(),
  });
});

// PATCH /api/users/:id — update user (admin only)
router.patch("/users/:id", async (req, res): Promise<void> => {
  const adminId = await requireAdmin(req, res);
  if (!adminId) return;

  const targetId = Number(req.params.id);
  if (isNaN(targetId)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
    return;
  }

  const { name, email, role } = parsed.data;

  // Check target user exists
  const [target] = await db.select().from(usersTable).where(eq(usersTable.id, targetId));
  if (!target) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  // Check for email collision
  if (email && email !== target.email) {
    const [collision] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email));
    if (collision) {
      res.status(409).json({ error: "A user with this email already exists" });
      return;
    }
  }

  const updates: Partial<typeof target> = {};
  if (name) updates.name = name;
  if (email) updates.email = email;
  if (role) updates.role = role;

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, targetId)).returning();

  const ip = getClientIp(req);
  await logSecurityEvent({
    eventType: "admin_action",
    userId: adminId,
    ip,
    details: `Updated user ${target.email}: ${JSON.stringify(updates)}`,
    severity: "info",
  });
  await db.insert(auditLogsTable).values({
    userId: adminId,
    action: "update",
    resource: "user",
    resourceId: String(targetId),
    details: `Updated user ${target.email}`,
    ipAddress: ip,
    userAgent: req.headers["user-agent"] ?? null,
    phiAccessed: false,
  }).catch(() => {});

  res.json({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
});

// DELETE /api/users/:id — delete user (admin only, cannot delete self)
router.delete("/users/:id", async (req, res): Promise<void> => {
  const adminId = await requireAdmin(req, res);
  if (!adminId) return;

  const targetId = Number(req.params.id);
  if (isNaN(targetId)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  if (targetId === adminId) {
    res.status(400).json({ error: "You cannot delete your own account" });
    return;
  }

  const [target] = await db.select().from(usersTable).where(eq(usersTable.id, targetId));
  if (!target) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  await db.delete(usersTable).where(eq(usersTable.id, targetId));

  const ip = getClientIp(req);
  await logSecurityEvent({
    eventType: "admin_action",
    userId: adminId,
    ip,
    details: `Deleted user ${target.email}`,
    severity: "warn",
  });
  await db.insert(auditLogsTable).values({
    userId: adminId,
    action: "delete",
    resource: "user",
    resourceId: String(targetId),
    details: `Deleted user ${target.email}`,
    ipAddress: ip,
    userAgent: req.headers["user-agent"] ?? null,
    phiAccessed: false,
  }).catch(() => {});

  res.json({ message: "User deleted" });
});

// POST /api/users/:id/reset-password — admin resets another user's password
router.post("/users/:id/reset-password", async (req, res): Promise<void> => {
  const adminId = await requireAdmin(req, res);
  if (!adminId) return;

  const targetId = Number(req.params.id);
  if (isNaN(targetId)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  const parsed = AdminResetPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
    return;
  }

  const [target] = await db.select().from(usersTable).where(eq(usersTable.id, targetId));
  if (!target) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, targetId));

  const ip = getClientIp(req);
  await logSecurityEvent({
    eventType: "password_change",
    userId: adminId,
    ip,
    details: `Admin reset password for user ${target.email}`,
    severity: "warn",
  });
  await db.insert(auditLogsTable).values({
    userId: adminId,
    action: "update",
    resource: "user",
    resourceId: String(targetId),
    details: `Admin reset password for ${target.email}`,
    ipAddress: ip,
    userAgent: req.headers["user-agent"] ?? null,
    phiAccessed: false,
  }).catch(() => {});

  res.json({ message: "Password reset successfully" });
});

// POST /api/auth/change-password — authenticated user changes own password
router.post("/auth/change-password", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const parsed = ChangePasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
    return;
  }

  const { currentPassword, newPassword } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  // Verify current password
  const { verifyPassword } = await import("./auth");
  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Current password is incorrect" });
    return;
  }

  const newHash = await hashPassword(newPassword);
  await db.update(usersTable).set({ passwordHash: newHash }).where(eq(usersTable.id, userId));

  const ip = getClientIp(req);
  await logSecurityEvent({
    eventType: "password_change",
    userId,
    ip,
    userAgent: req.headers["user-agent"],
    details: "User changed their own password",
    severity: "info",
  });
  await db.insert(auditLogsTable).values({
    userId,
    userEmail: user.email,
    userName: user.name,
    action: "update",
    resource: "auth",
    details: "Password changed",
    ipAddress: ip,
    userAgent: req.headers["user-agent"] ?? null,
    phiAccessed: false,
  }).catch(() => {});

  res.json({ message: "Password changed successfully" });
});

// PATCH /api/auth/profile — authenticated user updates own profile
router.patch("/auth/profile", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const ProfileBody = z.object({
    name: z.string().min(1).max(100).optional(),
  });

  const parsed = ProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
    return;
  }

  if (!parsed.data.name) {
    res.status(400).json({ error: "Nothing to update" });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set({ name: parsed.data.name })
    .where(eq(usersTable.id, userId))
    .returning();

  res.json({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
    createdAt: updated.createdAt.toISOString(),
  });
});

export default router;
