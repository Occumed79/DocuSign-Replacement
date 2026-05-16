import { Router, type IRouter } from "express";
import crypto from "crypto";
import { db, webauthnChallengesTable } from "@workspace/db";
import { requireAuth } from "../lib/require-auth";

const router: IRouter = Router();

function randomChallenge(): string {
  return crypto.randomBytes(32).toString("base64url");
}

router.post("/webauthn/register/options", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const challenge = randomChallenge();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await db.insert(webauthnChallengesTable).values({
    userId,
    challenge,
    purpose: "registration",
    expiresAt,
  });

  res.json({
    challenge,
    rp: {
      name: "PacketPath",
      id: process.env.WEBAUTHN_RP_ID ?? "localhost",
    },
    user: {
      id: String(userId),
      name: `user-${userId}`,
      displayName: `User ${userId}`,
    },
    timeout: 300000,
    attestation: "none",
  });
});

router.post("/webauthn/authenticate/options", async (req, res): Promise<void> => {
  const challenge = randomChallenge();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await db.insert(webauthnChallengesTable).values({
    challenge,
    purpose: "authentication",
    expiresAt,
  });

  res.json({
    challenge,
    timeout: 300000,
    rpId: process.env.WEBAUTHN_RP_ID ?? "localhost",
    userVerification: "preferred",
  });
});

export default router;
