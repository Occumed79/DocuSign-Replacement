import type { Request, Response, NextFunction } from "express";
import { db, auditLogsTable, activeSessionsTable, usersTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";

// Routes that access PHI (Protected Health Information)
const PHI_ROUTES: Array<{ method: string; pattern: RegExp; resource: string }> = [
  { method: "GET", pattern: /^\/api\/cases(\/\d+)?$/, resource: "cases" },
  { method: "POST", pattern: /^\/api\/cases$/, resource: "cases" },
  { method: "PUT", pattern: /^\/api\/cases\/\d+$/, resource: "cases" },
  { method: "DELETE", pattern: /^\/api\/cases\/\d+$/, resource: "cases" },
  { method: "GET", pattern: /^\/api\/cases\/\d+\/answers$/, resource: "case_answers" },
  { method: "POST", pattern: /^\/api\/cases\/\d+\/answers$/, resource: "case_answers" },
  { method: "GET", pattern: /^\/api\/cases\/\d+\/review$/, resource: "case_review" },
  { method: "GET", pattern: /^\/api\/dashboard.*$/, resource: "dashboard" },
];

function getActionFromMethod(method: string): "view" | "create" | "update" | "delete" | "export" {
  switch (method.toUpperCase()) {
    case "GET": return "view";
    case "POST": return "create";
    case "PUT":
    case "PATCH": return "update";
    case "DELETE": return "delete";
    default: return "view";
  }
}

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress ?? "unknown";
}

export async function phiLogger(req: Request, res: Response, next: NextFunction): Promise<void> {
  const path = req.path;
  const method = req.method;

  const match = PHI_ROUTES.find(r => r.method === method && r.pattern.test(path));
  if (!match) {
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  let userId: number | undefined;
  let userEmail: string | undefined;
  let userName: string | undefined;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const [session] = await db
        .select({ userId: activeSessionsTable.userId })
        .from(activeSessionsTable)
        .where(
          and(
            eq(activeSessionsTable.token, token),
            gt(activeSessionsTable.expiresAt, new Date())
          )
        )
        .limit(1);

      if (session) {
        userId = session.userId;
        const [user] = await db
          .select({ email: usersTable.email, name: usersTable.name })
          .from(usersTable)
          .where(eq(usersTable.id, session.userId));
        if (user) {
          userEmail = user.email;
          userName = user.name;
        }
      }
    } catch {
      // Don't block request if logging fails
    }
  }

  const resourceIdMatch = path.match(/\/(\d+)/);
  const resourceId = resourceIdMatch?.[1];

  // Log asynchronously, don't block the request
  db.insert(auditLogsTable).values({
    userId,
    userEmail,
    userName,
    action: getActionFromMethod(method),
    resource: match.resource,
    resourceId,
    details: `${method} ${path}`,
    ipAddress: getClientIp(req),
    userAgent: req.headers["user-agent"] ?? null,
    phiAccessed: true,
  }).catch(() => {/* swallow logging errors */});

  next();
}
