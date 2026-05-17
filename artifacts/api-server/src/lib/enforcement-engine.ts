export interface EnforcementDecisionInput {
  anomalyScore: number;
  tamperDetected?: boolean;
  requireWebAuthn?: boolean;
}

export interface EnforcementDecision {
  allowed: boolean;
  blocked: boolean;
  requireStepUpAuth: boolean;
  reason: string[];
}

export function evaluateEnforcementDecision(
  input: EnforcementDecisionInput,
): EnforcementDecision {
  const reason: string[] = [];

  let blocked = false;
  let requireStepUpAuth = false;

  if (input.anomalyScore >= 45) {
    requireStepUpAuth = true;
    reason.push("high_risk_signing_detected");
  }

  if (input.requireWebAuthn) {
    requireStepUpAuth = true;
    reason.push("webauthn_required");
  }

  if (input.tamperDetected || input.anomalyScore >= 70) {
    blocked = true;
    reason.push("critical_integrity_or_risk_failure");
  }

  return {
    allowed: !blocked,
    blocked,
    requireStepUpAuth,
    reason,
  };
}
