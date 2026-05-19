export interface IpReputationResult {
  ipAddress: string;
  riskScore: number;
  vpnDetected?: boolean;
  torDetected?: boolean;
  proxyDetected?: boolean;
  countryCode?: string;
  provider: string;
}

export interface DisposableEmailResult {
  email: string;
  disposable: boolean;
  provider: string;
}

export interface RiskSignalProvider {
  lookupIpReputation(ipAddress: string): Promise<IpReputationResult | null>;
  checkDisposableEmail(email: string): Promise<DisposableEmailResult | null>;
}

export class NoopRiskSignalProvider implements RiskSignalProvider {
  async lookupIpReputation(ipAddress: string): Promise<IpReputationResult | null> {
    return {
      ipAddress,
      riskScore: 0,
      vpnDetected: false,
      torDetected: false,
      proxyDetected: false,
      provider: "noop",
    };
  }

  async checkDisposableEmail(email: string): Promise<DisposableEmailResult | null> {
    return {
      email,
      disposable: false,
      provider: "noop",
    };
  }
}

export function getRiskSignalProvider(): RiskSignalProvider {
  return new NoopRiskSignalProvider();
}

export function detectSuspiciousUserAgent(userAgent?: string | null): string[] {
  const flags: string[] = [];
  const value = (userAgent ?? "").toLowerCase();

  if (!value) flags.push("missing_user_agent");
  if (value.includes("headless")) flags.push("headless_browser");
  if (value.includes("phantomjs")) flags.push("phantomjs");
  if (value.includes("selenium")) flags.push("selenium_automation");
  if (value.includes("playwright")) flags.push("playwright_automation");
  if (value.includes("puppeteer")) flags.push("puppeteer_automation");
  if (value.includes("curl") || value.includes("wget") || value.includes("python-requests")) flags.push("non_browser_client");

  return flags;
}

export function detectSameIpMultiSigner(signatures: Array<{ ipAddress?: string | null; recipientId?: number | null }>): string[] {
  const counts = new Map<string, Set<number | null | undefined>>();

  for (const signature of signatures) {
    if (!signature.ipAddress) continue;
    if (!counts.has(signature.ipAddress)) counts.set(signature.ipAddress, new Set());
    counts.get(signature.ipAddress)!.add(signature.recipientId);
  }

  return [...counts.entries()]
    .filter(([, recipients]) => recipients.size >= 2)
    .map(([ip]) => `same_ip_multi_signer:${ip}`);
}
