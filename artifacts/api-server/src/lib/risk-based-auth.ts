export interface RiskBasedAuthDecisionInput {
  anomalyScore: number;
  tamperDetected?: boolean;
  vpnDetected?: boolean;
  torDetected?: boolean;
  geoMismatch?: boolean;
}

export interface RiskBasedAuthDecision {
  requireMfa: boolean;
  requireWebAuthn: boolean;
  blockRequest: boolean;
  reason: string[];
}

export function determineRiskBasedAuth(input: RiskBasedAuthDecisionInput): RiskBasedAuthDecision {
  const reason: string[] = [];

  let requireMfa = false;
  let requireWebAuthn = false;
  let blockRequest = false;

  if (input.anomalyScore >= 20) {
    requireMfa = true;
    reason.push("moderate_anomaly_score");
  }

  if (input.anomalyScore >= 45) {
    requireWebAuthn = true;
    reason.push("high_anomaly_score");
  }

  if (input.torDetected) {
    requireWebAuthn = true;
    reason.push("tor_detected");
  }

  if (input.tamperDetected || input.anomalyScore >= 70) {
    blockRequest = true;
    reason.push("critical_risk_detected");
  }

  return {
    requireMfa,
    requireWebAuthn,
    blockRequest,
    reason,
  };
}
