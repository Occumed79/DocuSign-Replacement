# Control Evidence Index

This index maps compliance controls to evidence files.

## Format

Each control entry includes:
- Framework: FedRAMP, NIST 800-53, NIST 800-171, HIPAA, OWASP ASVS, SOC 2, GDPR, ISO 27001, CSA CCM, CIS Controls, NIST CSF
- Control ID / Criterion: Framework-specific control identifier
- Control Description: Brief description of the control
- Implementation Status: Implemented / Partial / Planned / Not Applicable
- Evidence File/Path: Path to evidence file
- Automated Evidence Source: GitHub workflow, script, or tool
- Manual Evidence Needed: Description of manual evidence required
- Owner: Team or individual responsible
- Frequency: How often evidence is collected
- Last Reviewed: Date of last review
- Gap / POA&M Link: Link to POA&M if gap exists

## Evidence Index

### Encryption and Secrets

| Framework | Control ID | Control Description | Status | Evidence Path | Automated Source | Owner | Frequency | Last Reviewed | Gap |
|-----------|------------|---------------------|--------|---------------|------------------|-------|-----------|---------------|-----|
| NIST 800-53 | SC-12 | Cryptographic Key Management and Establishment | Implemented | artifacts/api-server/src/lib/env.ts | env.test.ts | Security | Per deployment | 2026-06-15 | None |
| NIST 800-53 | SC-13 | Cryptographic Protection | Implemented | artifacts/api-server/src/lib/encryption.ts | env.test.ts | Security | Per deployment | 2026-06-15 | None |
| HIPAA | 164.312(e)(1) | Encryption at Rest | Implemented | artifacts/api-server/src/lib/encryption.ts | env.test.ts | Security | Per deployment | 2026-06-15 | None |
| OWASP ASVS | 2.6 | Cryptographic Storage | Implemented | artifacts/api-server/src/lib/encryption.ts | env.test.ts | Security | Per deployment | 2026-06-15 | None |

### Audit Logging

| Framework | Control ID | Control Description | Status | Evidence Path | Automated Source | Owner | Frequency | Last Reviewed | Gap |
|-----------|------------|---------------------|--------|---------------|------------------|-------|-----------|---------------|-----|
| NIST 800-53 | AU-2 | Audit Events | Implemented | lib/db/src/schema/security.ts | N/A | Security | Continuous | 2026-06-15 | None |
| NIST 800-53 | AU-3 | Audit Record Content | Implemented | lib/db/src/schema/security.ts | N/A | Security | Continuous | 2026-06-15 | None |
| HIPAA | 164.312(b) | Audit Controls | Implemented | lib/db/src/schema/security.ts | N/A | Security | Continuous | 2026-06-15 | None |
| SOC 2 | CC7.2 | System Operations - Logging | Implemented | lib/db/src/schema/security.ts | N/A | Security | Continuous | 2026-06-15 | None |

### Access Control

| Framework | Control ID | Control Description | Status | Evidence Path | Automated Source | Owner | Frequency | Last Reviewed | Gap |
|-----------|------------|---------------------|--------|---------------|------------------|-------|-----------|---------------|-----|
| NIST 800-53 | AC-2 | Access Control Policy | Partial | artifacts/api-server/src/lib/rbac.ts | N/A | Security | Per deployment | 2026-06-15 | Access review procedure needed |
| NIST 800-53 | AC-7 | Concurrent Session Control | Partial | lib/db/src/schema/security.ts | N/A | Security | Per deployment | 2026-06-15 | Session timeout policy needed |
| NIST 800-53 | IA-2 | Identification and Authentication | Implemented | artifacts/api-server/src/routes/auth.ts | auth.test.ts | Security | Per deployment | 2026-06-15 | None |
| NIST 800-53 | IA-3 | Device Identification and Authentication | Partial | artifacts/api-server/src/lib/device-trust.ts | N/A | Security | Per deployment | 2026-06-15 | Device trust policy needed |
| SOC 2 | CC6.1 | Logical and Physical Access | Partial | artifacts/api-server/src/lib/rbac.ts | N/A | Security | Per deployment | 2026-06-15 | Access review needed |

### Multi-Factor Authentication

| Framework | Control ID | Control Description | Status | Evidence Path | Automated Source | Owner | Frequency | Last Reviewed | Gap |
|-----------|------------|---------------------|--------|---------------|------------------|-------|-----------|---------------|-----|
| NIST 800-53 | IA-2(1) | Multi-Factor Authentication | Implemented | artifacts/api-server/src/lib/mfa.ts | N/A | Security | Per deployment | 2026-06-15 | None |
| NIST 800-53 | IA-2(2) | Multi-Factor Authentication for Non-Network Access | Implemented | artifacts/api-server/src/lib/webauthn.ts | N/A | Security | Per deployment | 2026-06-15 | None |
| SOC 2 | CC6.6 | Multi-Factor Authentication | Implemented | artifacts/api-server/src/lib/mfa.ts | N/A | Security | Per deployment | 2026-06-15 | None |

### Document Integrity

| Framework | Control ID | Control Description | Status | Evidence Path | Automated Source | Owner | Frequency | Last Reviewed | Gap |
|-----------|------------|---------------------|--------|---------------|------------------|-------|-----------|---------------|-----|
| NIST 800-53 | AU-9 | Protection of Audit Records | Implemented | lib/db/src/schema/integrity-ledger.ts | N/A | Security | Continuous | 2026-06-15 | None |
| NIST 800-53 | SC-8 | Transmission Confidentiality and Integrity | Implemented | artifacts/api-server/src/lib/integrity-chain.ts | N/A | Security | Continuous | 2026-06-15 | None |
| SOC 2 | CC6.7 | Tamper Detection | Implemented | lib/db/src/schema/integrity-ledger.ts | N/A | Security | Continuous | 2026-06-15 | None |

### Incident Response

| Framework | Control ID | Control Description | Status | Evidence Path | Automated Source | Owner | Frequency | Last Reviewed | Gap |
|-----------|------------|---------------------|--------|---------------|------------------|-------|-----------|---------------|-----|
| NIST 800-53 | IR-4 | Incident Handling | Planned | compliance/incident-response-plan.md | N/A | Security | Per incident | 2026-06-15 | Procedure not tested |
| NIST 800-53 | IR-8 | Incident Response Plan | Planned | compliance/incident-response-plan.md | N/A | Security | Annually | 2026-06-15 | Plan not exercised |
| SOC 2 | CC4.3 | Risk Mitigation | Planned | compliance/incident-response-plan.md | N/A | Security | Per incident | 2026-06-15 | Procedure not tested |

### Vulnerability Management

| Framework | Control ID | Control Description | Status | Evidence Path | Automated Source | Owner | Frequency | Last Reviewed | Gap |
|-----------|------------|---------------------|--------|---------------|------------------|-------|-----------|---------------|-----|
| NIST 800-53 | RA-5 | Vulnerability Scanning | Planned | .github/workflows/ | GitHub Actions | Security | Weekly | 2026-06-15 | Workflow not created |
| NIST 800-53 | SI-2 | Flaw Remediation | Planned | compliance/vulnerability-management-plan.md | N/A | Security | Per vulnerability | 2026-06-15 | SLA not defined |
| SOC 2 | CC4.4 | Monitoring Activities | Planned | .github/workflows/ | GitHub Actions | Security | Weekly | 2026-06-15 | Workflow not created |

### Configuration Management

| Framework | Control ID | Control Description | Status | Evidence Path | Automated Source | Owner | Frequency | Last Reviewed | Gap |
|-----------|------------|---------------------|--------|---------------|------------------|-------|-----------|---------------|-----|
| NIST 800-53 | CM-2 | Baseline Configuration | Planned | compliance/configuration-management-plan.md | N/A | Security | Per change | 2026-06-15 | Plan not documented |
| NIST 800-53 | CM-6 | Configuration Settings | Partial | artifacts/api-server/src/lib/env.ts | env.test.ts | Security | Per deployment | 2026-06-15 | Baseline not documented |
| SOC 2 | CC8.1 | Change Management | Planned | compliance/change-management-plan.md | N/A | Security | Per change | 2026-06-15 | Plan not documented |

### Privacy and GDPR

| Framework | Control ID | Control Description | Status | Evidence Path | Automated Source | Owner | Frequency | Last Reviewed | Gap |
|-----------|------------|---------------------|--------|---------------|------------------|-------|-----------|---------------|-----|
| GDPR | Art. 25 | Data Protection by Design | Planned | compliance/privacy/privacy-by-design-checklist.md | N/A | Privacy | Per feature | 2026-06-15 | Checklist not created |
| GDPR | Art. 32 | Security of Processing | Partial | artifacts/api-server/src/lib/encryption.ts | N/A | Privacy | Per deployment | 2026-06-15 | DPIA not completed |
| GDPR | Art. 30 | Records of Processing Activities | Planned | compliance/privacy/records-of-processing-activities.md | N/A | Privacy | Annually | 2026-06-15 | ROPA not created |
| SOC 2 | P8.1 | Privacy Notice | Planned | compliance/privacy/privacy-notice-draft.md | N/A | Privacy | Annually | 2026-06-15 | Notice not drafted |

## Gaps Summary

### High Priority Gaps
1. Access review procedure not documented
2. Session timeout policy not documented
3. Device trust policy not documented
4. Incident response plan not tested
5. Vulnerability scanning workflow not created
6. Configuration management plan not documented
7. Change management plan not documented

### Medium Priority Gaps
1. DPIA not completed for health data
2. ROPA not created
3. Privacy notice not drafted
4. Data subject request procedure not implemented

### Low Priority Gaps
1. Baseline configuration not documented
2. SLA for flaw remediation not defined

## Evidence Collection Schedule

### Continuous
- Audit logs (automatic)
- Security events (automatic)
- Integrity ledger (automatic)

### Per Deployment
- Environment validation (automatic)
- Encryption key validation (automatic)
- Access control configuration (manual)

### Weekly
- Vulnerability scanning (planned - not automated)
- Dependency updates (manual)

### Monthly
- Access review (manual)
- Configuration review (manual)

### Quarterly
- Risk assessment review (manual)
- Policy review (manual)

### Annually
- Control assessment (manual)
- Third-party audit (planned)
- Compliance report update (manual)

## Notes

- Evidence marked as "Planned" is documented but not yet implemented
- Evidence marked as "Partial" has some implementation but needs completion
- Evidence marked as "Implemented" is fully functional and tested
- Gaps are tracked in compliance/poam.md
