import type { Request, Response } from "express";
import { db, usersTable, auditLogsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "./require-auth";

export type LegacyRole = "admin" | "examqa" | "reviewer";

export type Permission =
  | "signature:read"
  | "signature:create"
  | "signature:void"
  | "signature:finalize_artifact"
  | "signature:verify_evidence"
  | "signature:export_certificate"
  | "signature:export_audit_bundle"
  | "security:review"
  | "security:manage"
  | "user:manage"
  | "phi:view"
  | "phi:export";

export const ROLE_PERMISSIONS: Record<LegacyRole, Permission[]> = {
  admin: [
    "signature:read",
    "signature:create",
    "signature:void",
    "signature:finalize_artifact",
    "signature:verify_evidence",
    "signature:export_certificate",
    "signature:export_audit_bundle",
    "security:review",
    "security:manage",
    "user:manage",
    "phi:view",
    "phi:export",
  ],
  reviewer: [
    "signature:read",
    "signature:verify_evidence",
    "security:review",
    "phi:view",
  ],
  examqa: [
    "signature:read",
    "signature:create",
    "phi:view",
  ],
};

export interface AuthorizedUser {
  id: number;
  email: string;
  name: string;
  role: LegacyRole;
  permissions: Permission[];
}

export function hasPermission(role: LegacyRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export async function getAuthorizedUser(userId: number): Promise<AuthorizedUser | null> {
  const [user] = await db
    .select({ id: usersTable.id, email: usersTable.email, name: usersTable.name, role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user) return null;

  const role = user.role as LegacyRole;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role,
    permissions: ROLE_PERMISSIONS[role] ?? [],
  };
}

export async function requirePermission(req: Request, res: Response, permission: Permission): Promise<AuthorizedUser | null> {
  const userId = await requireAuth(req, res);
  if (!userId) return null;

  const user = await getAuthorizedUser(userId);
  if (!user || !hasPermission(user.role, permission)) {
    await db.insert(auditLogsTable).values({
      userId,
      userEmail: user?.email ?? null,
      userName: user?.name ?? null,
      action: "permission_denied",
      resource: "rbac",
      resourceId: permission,
      details: `Permission denied for ${permission}`,
      phiAccessed: permission.startsWith("phi:") || permission.includes("export"),
    }).catch(() => {});

    res.status(403).json({ error: "Permission denied", requiredPermission: permission });
    return null;
  }

  return user;
}

export async function logPrivilegedAction(params: {
  user: AuthorizedUser;
  action: string;
  resource: string;
  resourceId: string;
  details: string;
  phiAccessed?: boolean;
}) {
  await db.insert(auditLogsTable).values({
    userId: params.user.id,
    userEmail: params.user.email,
    userName: params.user.name,
    action: params.action,
    resource: params.resource,
    resourceId: params.resourceId,
    details: params.details,
    phiAccessed: params.phiAccessed ?? false,
  }).catch(() => {});
}
