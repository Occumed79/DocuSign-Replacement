export interface FraudReviewCase {
  requestId: number;
  anomalyScore: number;
  severity: "low" | "medium" | "high" | "critical";
  flags: string[];
  requiresManualReview: boolean;
}

export function buildFraudReviewCase(params: {
  requestId: number;
  anomalyScore: number;
  flags: string[];
}): FraudReviewCase {
  let severity: FraudReviewCase["severity"] = "low";

  if (params.anomalyScore >= 70) severity = "critical";
  else if (params.anomalyScore >= 45) severity = "high";
  else if (params.anomalyScore >= 20) severity = "medium";

  return {
    requestId: params.requestId,
    anomalyScore: params.anomalyScore,
    severity,
    flags: params.flags,
    requiresManualReview: severity === "high" || severity === "critical",
  };
}
