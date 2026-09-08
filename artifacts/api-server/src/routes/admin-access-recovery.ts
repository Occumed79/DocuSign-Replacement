import crypto from "crypto";
import bcrypt from "bcrypt";
import { Router, type IRouter } from "express";
import {
  activeSessionsTable,
  db,
  loginAttemptsTable,
  usersTable,
} from "@workspace/db";
import { mfaBackupCodesTable, mfaChallengesTable, mfaSecretsTable } from "@workspace/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();
const BCRYPT_ROUNDS = 12;

const RecoveryBody = z.object({
  email: z.string().email(),
  recoveryToken: z.string().min(32).max(512),
  newPassword: z.string().min(12).max(128),
});

export function recoveryTokenMatches(provided: string, configured: string): boolean {
  const providedDigest = crypto.createHash("sha256").update(provided).digest();
  const configuredDigest = crypto.createHash("sha256").update(configured).digest();
  return crypto.timingSafeEqual(providedDigest, configuredDigest);
}

router.get("/admin-access-recovery/status", (_req, res): void => {
  const enabled = Boolean(
    process.env.ADMIN_RECOVERY_EMAIL?.trim() &&
    process.env.ADMIN_RECOVERY_TOKEN?.trim() &&
    process.env.ADMIN_RECOVERY_TOKEN.trim().length >= 32,
  );
  res.setHeader("Cache-Control", "no-store");
  res.json({ enabled });
});

router.post("/admin-access-recovery", async (req, res): Promise<void> => {
  res.setHeader("Cache-Control", "no-store");

  const configuredEmail = process.env.ADMIN_RECOVERY_EMAIL?.trim().toLowerCase();
  const configuredToken = process.env.ADMIN_RECOVERY_TOKEN?.trim();
  if (!configuredEmail || !configuredToken || configuredToken.length < 32) {
    res.status(404).json({ error: "Admin access recovery is not enabled." });
    return;
  }

  const parsed = RecoveryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter a valid email, recovery token, and password of at least 12 characters." });
    return;
  }

  const email = parsed.data.email.trim().toLowerCase();
  if (email !== configuredEmail || !recoveryTokenMatches(parsed.data.recoveryToken, configuredToken)) {
    res.status(401).json({ error: "The recovery details are invalid." });
    return;
  }

  const [admin] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(and(eq(usersTable.email, email), eq(usersTable.role, "admin")))
    .limit(1);

  if (!admin) {
    res.status(401).json({ error: "The recovery details are invalid." });
    return;
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, BCRYPT_ROUNDS);
  await db.transaction(async tx => {
    await tx.update(usersTable).set({ passwordHash, updatedAt: new Date() }).where(eq(usersTable.id, admin.id));
    await tx.delete(activeSessionsTable).where(eq(activeSessionsTable.userId, admin.id));
    await tx.delete(loginAttemptsTable).where(eq(loginAttemptsTable.email, email));
    await tx.delete(mfaBackupCodesTable).where(eq(mfaBackupCodesTable.userId, admin.id));
    await tx.delete(mfaChallengesTable).where(eq(mfaChallengesTable.userId, admin.id));
    await tx.delete(mfaSecretsTable).where(eq(mfaSecretsTable.userId, admin.id));
  });

  res.json({
    ok: true,
    message: "Admin access restored. Remove the recovery environment variables, redeploy, and sign in with the new password.",
  });
});

export default router;
