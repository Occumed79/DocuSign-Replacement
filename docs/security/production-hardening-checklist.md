# Production Hardening Checklist

## Infrastructure

- [ ] HTTPS enforced
- [ ] HSTS enabled
- [ ] Production CSP validated
- [ ] Environment variables secured
- [ ] Artifact storage configured
- [ ] Database backups enabled
- [ ] Logging retention configured

## GitHub / CI

- [ ] Branch protection enabled
- [ ] Required status checks enabled
- [ ] Signed commits enforced if practical
- [ ] Secret scanning enabled
- [ ] Dependabot enabled

## Application Security

- [ ] Remove unsafe-inline CSP usage
- [ ] Enable CSP nonces everywhere
- [ ] Verify Helmet headers in production
- [ ] Verify rate limiting
- [ ] Verify audit logging
- [ ] Verify evidence verification endpoint

## E-Signature Integrity

- [ ] Verify finalized PDF hashing
- [ ] Verify immutable artifact storage
- [ ] Verify tamper detection endpoint
- [ ] Verify consent enforcement
- [ ] Verify ordered signing

## Monitoring

- [ ] Configure SIEM forwarding
- [ ] Configure alerting
- [ ] Configure anomaly monitoring
- [ ] Configure uptime monitoring
