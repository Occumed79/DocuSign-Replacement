export interface DeviceTrustInput {
  knownDevice?: boolean;
  webauthnUsed?: boolean;
  vpnDetected?: boolean;
  torDetected?: boolean;
  ipChanges?: number;
}

export interface DeviceTrustResult {
  trustScore: number;
  trusted: boolean;
  flags: string[];
}

export function calculateDeviceTrust(input: DeviceTrustInput): DeviceTrustResult {
  let trustScore = 50;
  const flags: string[] = [];

  if (input.knownDevice) {
    trustScore += 25;
    flags.push("known_device");
  }

  if (input.webauthnUsed) {
    trustScore += 30;
    flags.push("webauthn_verified");
  }

  if (input.vpnDetected) {
    trustScore -= 20;
    flags.push("vpn_detected");
  }

  if (input.torDetected) {
    trustScore -= 40;
    flags.push("tor_detected");
  }

  if ((input.ipChanges ?? 0) >= 3) {
    trustScore -= 15;
    flags.push("multiple_ip_changes");
  }

  return {
    trustScore,
    trusted: trustScore >= 60,
    flags,
  };
}
