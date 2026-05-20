# Fraud Risk Engine

## Purpose

PacketPath includes a fraud and anomaly detection layer to identify suspicious signing behavior, risky request patterns, and evidence events that should be reviewed before being trusted operationally.

This does not claim to be a complete fraud-prevention system. It provides a risk-scoring and review foundation that can be expanded with external intelligence providers.

## Implemented Components

### Core anomaly scoring

Implemented in:

```text
artifacts/api-server/src/lib/anomaly-detection.ts
```

Signals include:

- excessive failed attempts
- multiple IP changes
- rapid signing behavior
- VPN flag
- TOR flag
- country change flag
- impossible travel flag

### Risk signal provider interfaces

Implemented in:

```text
artifacts/api-server/src/lib/risk-signal-providers.ts
```

Provider interfaces support:

- IP reputation lookup
- VPN detection
- TOR detection
- proxy detection
- country code enrichment
- disposable email checking

A no-op provider is included so the system can run safely without hard-coded paid API dependencies.

### Local fraud signals

Implemented local checks include:

- suspicious user-agent detection
- headless browser indicators
- browser automation indicators
- non-browser client indicators
- same-IP multi-signer detection

### Fraud review routes

Implemented in:

```text
artifacts/api-server/src/routes/fraud-review.ts
```

Routes:

```http
GET /api/security/fraud-review/signature-requests/:id
GET /api/security/fraud-review/queue
```

## Future Enhancements

- configurable IP intelligence providers
- impossible travel persistence
- analyst review workflows
- dashboard visualizations
- risk model versioning
