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

### Fraud review case builder

Implemented in:

```text
artifacts/api-server/src/lib/fraud-review.ts
```

The builder classifies review severity and determines whether manual review should be required.

## API Routes

Implemented in:

```text
artifacts/api-server/src/routes/fraud-review.ts
```

Routes:

```http
GET /api/security/fraud-review/signature-requests/:id
GET /api/security/fraud-review/queue
```

Both require:

```text
security:review
```

## Current Output

Fraud review responses include:

- request ID
- fraud case
- anomaly score
- severity
- flags
- IP reputation placeholders
- disposable email placeholders
- suspicious user-agent flags
- same-IP multi-signer flags

## Known Limitations

- IP reputation provider is currently a no-op implementation.
- Disposable email provider is currently a no-op implementation.
- Impossible travel is represented in scoring but requires historical geo data to enforce accurately.
- Queue endpoint currently analyzes recent requests in a simple loop and should be optimized for production.
- False-positive feedback workflow is not yet implemented.

## Future Enhancements

- Add configurable IP intelligence provider
- Add configurable disposable email provider
- Add country/region anomaly persistence
- Add impossible travel history table
- Add fraud analyst review decisions
- Add false-positive feedback loop
- Add risk model versioning
- Add dashboard visualization
