import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  db,
  signatureRequestsTable,
  signatureRecipientsTable,
  completedSignaturesTable,
} from "@workspace/db";
import { requirePermission } from "../lib/rbac";
import { calculateSigningAnomalyScore } from "../lib/anomaly-detection";
import { buildFraudReviewCase } from "../lib/fraud-review";
import {
  detectSameIpMultiSigner,
  detectSuspiciousUserAgent,
  getRiskSignalProvider,
} from "../lib/risk-signal-providers";

const router: IRouter = Router();

router.get("/security/fraud-review/signature-requests/:id", async (req, res): Promise<void> => {
  const user = await requirePermission(req, res, "security:review");
  if (!user) return;

  const requestId = Number(req.params.id);

  const [request] = await db
    .select()
    .from(signatureRequestsTable)
    .where(eq(signatureRequestsTable.id, requestId))
    .limit(1);

  if (!request) {
    res.status(404).json({ error: "Signature request not found" });
    return;
  }

  const [recipients, signatures] = await Promise.all([
    db.select().from(signatureRecipientsTable).where(eq(signatureRecipientsTable.requestId, requestId)),
    db.select().from(completedSignaturesTable).where(eq(completedSignaturesTable.requestId, requestId)),
  ]);

  const provider = getRiskSignalProvider();
  const uniqueIps = [...new Set(signatures.map(s => s.ipAddress).filter(Boolean))] as string[];
  const ipReputation = await Promise.all(uniqueIps.map(ip => provider.lookupIpReputation(ip)));
  const emailResults = await Promise.all(recipients.map(r => provider.checkDisposableEmail(r.email)));

  const userAgentFlags = signatures.flatMap(s => detectSuspiciousUserAgent(s.userAgent));
  const sameIpFlags = detectSameIpMultiSigner(signatures);
  const providerFlags = [
    ...ipReputation.flatMap(result => result?.vpnDetected ? ["vpn_detected"] : []),
    ...ipReputation.flatMap(result => result?.torDetected ? ["tor_detected"] : []),
    ...ipReputation.flatMap(result => result?.proxyDetected ? ["proxy_detected"] : []),
    ...emailResults.flatMap(result => result?.disposable ? ["disposable_email"] : []),
  ];

  const anomaly = calculateSigningAnomalyScore({
    failedAttempts: 0,
    rapidSigning: signatures.length >= 3,
    ipChanges: uniqueIps.length,
    vpnDetected: providerFlags.includes("vpn_detected"),
    torDetected: providerFlags.includes("tor_detected"),
  });

  const allFlags = [...new Set([...anomaly.flags, ...userAgentFlags, ...sameIpFlags, ...providerFlags])];
  const fraudCase = buildFraudReviewCase({
    requestId,
    anomalyScore: anomaly.score,
    flags: allFlags,
  });

  res.json({
    requestId,
    fraudCase,
    anomaly,
    signals: {
      uniqueIps,
      ipReputation,
      disposableEmailChecks: emailResults,
      userAgentFlags,
      sameIpFlags,
      providerFlags,
    },
  });
});

router.get("/security/fraud-review/queue", async (req, res): Promise<void> => {
  const user = await requirePermission(req, res, "security:review");
  if (!user) return;

  const requests = await db
    .select()
    .from(signatureRequestsTable)
    .limit(50);

  const queue = [];

  for (const request of requests) {
    const signatures = await db
      .select()
      .from(completedSignaturesTable)
      .where(eq(completedSignaturesTable.requestId, request.id));

    const uniqueIps = [...new Set(signatures.map(s => s.ipAddress).filter(Boolean))];
    const userAgentFlags = signatures.flatMap(s => detectSuspiciousUserAgent(s.userAgent));
    const sameIpFlags = detectSameIpMultiSigner(signatures);
    const anomaly = calculateSigningAnomalyScore({
      rapidSigning: signatures.length >= 3,
      ipChanges: uniqueIps.length,
    });
    const allFlags = [...new Set([...anomaly.flags, ...userAgentFlags, ...sameIpFlags])];
    const fraudCase = buildFraudReviewCase({ requestId: request.id, anomalyScore: anomaly.score, flags: allFlags });

    if (fraudCase.requiresManualReview || allFlags.length > 0) {
      queue.push({
        requestId: request.id,
        title: request.title,
        status: request.status,
        createdAt: request.createdAt,
        completedAt: request.completedAt,
        fraudCase,
      });
    }
  }

  res.json({ queue });
});

export default router;
