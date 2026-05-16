# Geo Anomaly Detection

## Goal

Detect suspicious signing activity based on geolocation anomalies.

## Planned Signals

- impossible travel detection
- country mismatch detection
- TOR/VPN detection
- rapid IP rotation
- unusual signing geography

## Planned Workflow

1. Capture signing IP
2. Resolve approximate geolocation
3. Compare against prior signer activity
4. Generate anomaly score
5. Flag suspicious requests for review

## Possible Providers

- MaxMind
- IPInfo
- Cloudflare Turnstile integrations
