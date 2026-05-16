import { forwardSecurityEvent } from "./siem";

export async function alertTamperDetected(params: {
  requestId: number;
  details?: Record<string, unknown>;
}) {
  await forwardSecurityEvent({
    type: "tamper_detected",
    severity: "critical",
    timestamp: new Date().toISOString(),
    requestId: params.requestId,
    details: params.details,
  });
}

export async function alertHighRiskSigning(params: {
  requestId?: number;
  score: number;
  flags: string[];
}) {
  await forwardSecurityEvent({
    type: "high_risk_signing",
    severity: params.score >= 70 ? "critical" : "high",
    timestamp: new Date().toISOString(),
    requestId: params.requestId,
    details: {
      score: params.score,
      flags: params.flags,
    },
  });
}
