import { Router, type IRouter } from "express";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import {
  db,
  usersTable,
  webauthnChallengesTable,
  webauthnCredentialsTable,
} from "@workspace/db";
import { requireAuth } from "../lib/require-auth";
import { createStepUpSession } from "../lib/step-up-auth";

const router: IRouter = Router();

function getRpId(): string {
  return process.env.WEBAUTHN_RP_ID ?? "localhost";
}

function getRpName(): string {
  return process.env.WEBAUTHN_RP_NAME ?? "PacketPath";
}

function getExpectedOrigin(): string {
  return process.env.WEBAUTHN_ORIGIN ?? "http://localhost:5173";
}

function bufferToBase64Url(value: Uint8Array | ArrayBuffer): string {
  return Buffer.from(value instanceof ArrayBuffer ? new Uint8Array(value) : value).toString("base64url");
}

function base64UrlToBuffer(value: string): Uint8Array {
  return new Uint8Array(Buffer.from(value, "base64url"));
}

async function getLatestChallenge(userId: number | null, purpose: string) {
  const where = userId
    ? and(
      eq(webauthnChallengesTable.userId, userId),
      eq(webauthnChallengesTable.purpose, purpose),
      gt(webauthnChallengesTable.expiresAt, new Date()),
      isNull(webauthnChallengesTable.usedAt),
    )
    : and(
      eq(webauthnChallengesTable.purpose, purpose),
      gt(webauthnChallengesTable.expiresAt, new Date()),
      isNull(webauthnChallengesTable.usedAt),
    );

  const [challenge] = await db
    .select()
    .from(webauthnChallengesTable)
    .where(where)
    .orderBy(desc(webauthnChallengesTable.createdAt))
    .limit(1);

  return challenge ?? null;
}

async function markChallengeUsed(id: number) {
  await db.update(webauthnChallengesTable)
    .set({ usedAt: new Date() })
    .where(eq(webauthnChallengesTable.id, id));
}

router.post("/webauthn/register/options", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const [user] = await db
    .select({ id: usersTable.id, email: usersTable.email, name: usersTable.name })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const existingCredentials = await db
    .select()
    .from(webauthnCredentialsTable)
    .where(eq(webauthnCredentialsTable.userId, userId));

  const options = await generateRegistrationOptions({
    rpName: getRpName(),
    rpID: getRpId(),
    userName: user.email,
    userDisplayName: user.name,
    attestationType: "none",
    excludeCredentials: existingCredentials.map(credential => ({
      id: credential.credentialId,
      transports: credential.transports ? credential.transports.split(",") as any : undefined,
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
    supportedAlgorithmIDs: [-7, -257],
  });

  await db.insert(webauthnChallengesTable).values({
    userId,
    challenge: options.challenge,
    purpose: "registration",
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  res.json(options);
});

router.post("/webauthn/register/verify", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const challenge = await getLatestChallenge(userId, "registration");
  if (!challenge) {
    res.status(400).json({ error: "No active WebAuthn registration challenge" });
    return;
  }

  try {
    const verification = await verifyRegistrationResponse({
      response: req.body,
      expectedChallenge: challenge.challenge,
      expectedOrigin: getExpectedOrigin(),
      expectedRPID: getRpId(),
    });

    if (!verification.verified || !verification.registrationInfo) {
      res.status(400).json({ verified: false, error: "WebAuthn registration was not verified" });
      return;
    }

    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

    await db.insert(webauthnCredentialsTable).values({
      userId,
      credentialId: credential.id,
      publicKey: bufferToBase64Url(credential.publicKey),
      counter: credential.counter,
      transports: credential.transports?.join(",") ?? null,
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      nickname: req.body?.nickname ?? null,
    });

    await markChallengeUsed(challenge.id);

    res.json({ verified: true });
  } catch (err: any) {
    res.status(400).json({ verified: false, error: err?.message ?? "WebAuthn registration verification failed" });
  }
});

router.post("/webauthn/authenticate/options", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const credentials = await db
    .select()
    .from(webauthnCredentialsTable)
    .where(eq(webauthnCredentialsTable.userId, userId));

  if (credentials.length === 0) {
    res.status(409).json({ error: "No WebAuthn credentials registered" });
    return;
  }

  const purpose = typeof req.body?.purpose === "string" ? req.body.purpose : "privileged_action";

  const options = await generateAuthenticationOptions({
    rpID: getRpId(),
    allowCredentials: credentials.map(credential => ({
      id: credential.credentialId,
      transports: credential.transports ? credential.transports.split(",") as any : undefined,
    })),
    userVerification: "preferred",
  });

  await db.insert(webauthnChallengesTable).values({
    userId,
    challenge: options.challenge,
    purpose: `authentication:${purpose}`,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  res.json({ ...options, purpose });
});

router.post("/webauthn/authenticate/verify", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const purpose = typeof req.body?.purpose === "string" ? req.body.purpose : "privileged_action";
  const challenge = await getLatestChallenge(userId, `authentication:${purpose}`);
  if (!challenge) {
    res.status(400).json({ error: "No active WebAuthn authentication challenge" });
    return;
  }

  const credentialId = req.body?.response?.id ?? req.body?.id;
  if (!credentialId) {
    res.status(400).json({ error: "Missing credential ID" });
    return;
  }

  const [credential] = await db
    .select()
    .from(webauthnCredentialsTable)
    .where(and(
      eq(webauthnCredentialsTable.userId, userId),
      eq(webauthnCredentialsTable.credentialId, credentialId),
    ))
    .limit(1);

  if (!credential) {
    res.status(404).json({ error: "WebAuthn credential not found" });
    return;
  }

  try {
    const verification = await verifyAuthenticationResponse({
      response: req.body.response ?? req.body,
      expectedChallenge: challenge.challenge,
      expectedOrigin: getExpectedOrigin(),
      expectedRPID: getRpId(),
      credential: {
        id: credential.credentialId,
        publicKey: base64UrlToBuffer(credential.publicKey),
        counter: credential.counter,
        transports: credential.transports ? credential.transports.split(",") as any : undefined,
      },
    });

    if (!verification.verified) {
      res.status(400).json({ verified: false, error: "WebAuthn authentication was not verified" });
      return;
    }

    await db.update(webauthnCredentialsTable)
      .set({
        counter: verification.authenticationInfo.newCounter,
        lastUsedAt: new Date(),
      })
      .where(eq(webauthnCredentialsTable.id, credential.id));

    await markChallengeUsed(challenge.id);

    const stepUp = await createStepUpSession({
      userId,
      purpose,
      ttlMinutes: 10,
    });

    res.json({
      verified: true,
      purpose,
      stepUpToken: stepUp.stepUpToken,
      expiresAt: stepUp.expiresAt,
    });
  } catch (err: any) {
    res.status(400).json({ verified: false, error: err?.message ?? "WebAuthn authentication verification failed" });
  }
});

export default router;
