# Adaptive Authentication Architecture

## Goal

Increase security requirements dynamically based on risk signals.

## Risk Inputs

- anomaly score
- device trust score
- VPN/TOR usage
- geo mismatch
- integrity verification failures
- suspicious signing behavior

## Escalation Flow

| Risk Level | Action |
| --- | --- |
| Low | Standard authentication |
| Moderate | Require MFA |
| High | Require WebAuthn |
| Critical | Block signing activity |

## Planned Future Features

- session reputation
- IP reputation
- enterprise device trust
- impossible travel correlation
- behavioral fingerprinting
