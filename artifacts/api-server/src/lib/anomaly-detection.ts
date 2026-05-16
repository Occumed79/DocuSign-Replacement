export interface SigningAnomalyInput {
  failedAttempts?: number;
  ipChanges?: number;
  rapidSigning?: boolean;
  torDetected?: boolean;
  vpnDetected?: boolean;
  countryChanged?: boolean;
  impossibleTravel?: boolean;
}

export interface SigningAnomalyResult {
  score: number;
  severity: "low" | "medium" | "high" | "critical";
  flags: string[];
}

export function calculateSigningAnomalyScore(input: SigningAnomalyInput): SigningAnomalyResult {
  let score = 0;
  const flags: string[] = [];

  if ((input.failedAttempts ?? 0) >= 5) {
    score += 20;
    flags.push("excessive_failed_attempts");
  }

  if ((input.ipChanges ?? 0) >= 3) {
    score += 15;
    flags.push("multiple_ip_changes");
  }

  if (input.rapidSigning) {
    score += 10;
    flags.push("rapid_signing_behavior");
  }

  if (input.vpnDetected) {
    score += 20;
    flags.push("vpn_detected");
  }

  if (input.torDetected) {
    score += 35;
    flags.push("tor_detected");
  }

  if (input.countryChanged) {
    score += 15;
    flags.push("country_changed");
  }

  if (input.impossibleTravel) {
    score += 40;
    flags.push("impossible_travel_detected");
  }

  let severity: SigningAnomalyResult["severity"] = "low";

  if (score >= 70) severity = "critical";
  else if (score >= 45) severity = "high";
  else if (score >= 20) severity = "medium";

  return {
    score,
    severity,
    flags,
  };
}
