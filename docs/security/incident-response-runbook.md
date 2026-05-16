# Incident Response Runbook

## Severity Levels

### Critical

Examples:
- exposed signing tokens
- evidence tampering
- database compromise
- exposed credentials

### High

Examples:
- privilege escalation
- authentication bypass
- secret leakage

### Medium

Examples:
- dependency vulnerability
- CSP bypass
- excessive failed sign attempts

## Initial Response

1. Preserve logs
2. Preserve evidence hashes
3. Disable compromised credentials
4. Review audit events
5. Determine blast radius

## Containment

- rotate secrets
- revoke sessions
- pause signing workflows if needed
- restrict public access if needed

## Recovery

- redeploy patched version
- verify evidence integrity
- validate finalized artifacts
- confirm CodeQL/Dependency-Check status

## Post-Incident Review

- document timeline
- identify root cause
- add preventive controls
- update runbooks
