import crypto from "crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db, webauthnStepUpSessionsTable } from "@workspace/db";

export function createStepUpToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createStepUpSession(params: {
  userId: number;
  purpose: string;
  ttlMinutes?: number;
}) {
  const token = createStepUpToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + (params.ttlMinutes ?? 10) * 60 * 1000);

  await db.insert(webauthnStepUpSessionsTable).values({
    userId: params.userId,
    purpose: params.purpose,
    tokenHash,
    expiresAt,
  });

  return {
    stepUpToken: token,
    expiresAt,
  };
}

export async function verifyStepUpToken(params: {
  userId: number;
  purpose: string;
  token: string | undefined;
  consume?: boolean;
}): Promise<boolean> {
  if (!params.token) return false;

  const tokenHash = hashToken(params.token);
  const now = new Date();

  const [session] = await db
    .select()
    .from(webauthnStepUpSessionsTable)
    .where(and(
      eq(webauthnStepUpSessionsTable.userId, params.userId),
      eq(webauthnStepUpSessionsTable.purpose, params.purpose),
      eq(webauthnStepUpSessionsTable.tokenHash, tokenHash),
      gt(webauthnStepUpSessionsTable.expiresAt, now),
      isNull(webauthnStepUpSessionsTable.consumedAt),
    ))
    .limit(1);

  if (!session) return false;

  if (params.consume) {
    await db.update(webauthnStepUpSessionsTable)
      .set({ consumedAt: now })
      .where(eq(webauthnStepUpSessionsTable.id, session.id));
  }

  return true;
}

export function readStepUpTokenFromHeaders(headers: Record<string, string | string[] | undefined>): string | undefined {
  const value = headers["x-step-up-token"];
  if (Array.isArray(value)) return value[0];
  return value;
}
