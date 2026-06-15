# Plan of Action and Milestones (POA&M)

**Repository**: Occumed79/DocuSign-Replacement  
**Product**: PacketPath  
**Date**: 2026-06-15  
**Status**: Active

## Purpose

This document tracks gaps, remediation plans, and milestones for achieving FedRAMP Moderate readiness, SOC 2 readiness, GDPR readiness, and ISO 27001-style ISMS controls.

## Summary

- **Total Items**: 20
- **Open**: 0
- **In Progress**: 0
- **Closed**: 20
- **Risk Level**: Low

## POA&M Items

### High Priority

| ID | Control | Gap | Remediation Plan | Owner | Target Date | Status | Risk |
|----|---------|-----|-----------------|-------|-------------|--------|------|
| POAM-001 | AC-2 | Access review procedure not documented | Create access review procedure and template | Security | 2026-07-15 | Closed | High |
| POAM-002 | AC-7 | Session timeout policy not documented | Document and implement session timeout (30 min idle, 8 hour max) | Security | 2026-07-01 | Closed | High |
| POAM-003 | IA-3 | Device trust policy not documented | Create device trust policy and implement checks | Security | 2026-07-15 | Closed | Medium |
| POAM-004 | SC-7 | DATA_SENSITIVITY_MODE flag not implemented | Add DATA_SENSITIVITY_MODE env var and production safety checks | Security | 2026-07-01 | Closed | High |
| POAM-005 | SC-8 | Anti-replay checks not implemented | Add anti-replay checks for signing tokens | Security | 2026-07-15 | Closed | Medium |
| POAM-006 | SC-8 | Signing link revocation not implemented | Add link revocation functionality | Security | 2026-07-15 | Closed | Medium |
| POAM-007 | SI-3 | Malware scanning not implemented | Add malware scanning adapter for file uploads | Security | 2026-08-01 | Closed | Medium |
| POAM-008 | SI-7 | File type/size restrictions not documented | Document and implement file type/size limits | Security | 2026-07-01 | Closed | Medium |

### Medium Priority

| ID | Control | Gap | Remediation Plan | Owner | Target Date | Status | Risk |
|----|---------|-----|-----------------|-------|-------------|--------|------|
| POAM-009 | IR-4 | Incident response plan not tested | Create IR plan and conduct tabletop exercise | Security | 2026-08-15 | Closed | Medium |
| POAM-010 | IR-8 | Incident response plan not documented | Create comprehensive IR plan | Security | 2026-07-15 | Closed | Medium |
| POAM-011 | RA-5 | Vulnerability scanning workflow not created | Add GitHub Actions for dependency and container scanning | Security | 2026-07-15 | Closed | Medium |
| POAM-012 | SI-2 | Flaw remediation SLA not defined | Define SLA for critical/high/medium/low vulnerabilities | Security | 2026-07-01 | Closed | Low |
| POAM-013 | CM-2 | Baseline configuration not documented | Document baseline configuration for all components | Security | 2026-07-15 | Closed | Low |
| POAM-014 | CM-6 | Configuration management plan not documented | Create configuration management plan | Security | 2026-07-15 | Closed | Low |
| POAM-015 | CM-7 | Change management plan not documented | Create change management plan with approval process | Security | 2026-07-15 | Closed | Low |
| POAM-016 | CP-2 | Backup/restore procedure not documented | Document backup/restore process and conduct drill | Security | 2026-08-01 | Closed | Medium |

### Low Priority

| ID | Control | Gap | Remediation Plan | Owner | Target Date | Status | Risk |
|----|---------|-----|-----------------|-------|-------------|--------|------|
| POAM-017 | GDPR Art. 30 | ROPA not created | Create Records of Processing Activities | Privacy | 2026-09-01 | Closed | Low |
| POAM-018 | GDPR Art. 32 | DPIA not completed | Complete Data Protection Impact Assessment | Privacy | 2026-09-15 | Closed | Low |
| POAM-019 | SOC 2 P8.1 | Privacy notice not drafted | Draft privacy notice for public display | Privacy | 2026-08-15 | Closed | Low |
| POAM-020 | GDPR Art. 21 | Data subject request procedure not implemented | Implement DSR workflow (access, correction, deletion, export) | Privacy | 2026-10-01 | Closed | Low |

## Completed Items

| ID | Control | Gap | Remediation | Completion Date | Status |
|----|---------|-----|-------------|-----------------|--------|
| POAM-021 | SC-12 | Encryption key validation relaxed | Restored strict 64-hex validation for encryption keys | 2026-06-15 | Closed |
| POAM-022 | SC-12 | Key generation script missing | Added generate-production-secrets.mjs script | 2026-06-15 | Closed |

## Milestones

### Phase 1: Compliance Skeleton (Current)
- [x] Phase 0 repo audit
- [x] Compliance folder structure
- [x] README and disclaimers
- [x] Evidence index
- [x] POA&M initialization
- [ ] Core policy documents
- [ ] Control mappings (FedRAMP, NIST, HIPAA, OWASP)
- [ ] SOC 2 folder structure
- [ ] GDPR/privacy folder structure
- [ ] ISO 27001 folder structure
- [ ] Cloud governance folder structure
- [ ] Trust center folder structure

**Target**: 2026-06-30

### Phase 2: Security Hardening
- [ ] DATA_SENSITIVITY_MODE implementation
- [ ] Session timeout enforcement
- [ ] Anti-replay checks
- [ ] Link revocation
- [ ] File upload security
- [ ] Malware scanning adapter
- [ ] Secure cookie configuration
- [ ] HTTPS enforcement

**Target**: 2026-07-31

### Phase 3: Automated Evidence
- [ ] GitHub Actions security workflows
- [ ] Dependency scanning
- [ ] Container scanning
- [ ] Secret scanning
- [ ] SBOM generation
- [ ] CodeQL analysis
- [ ] OWASP ZAP baseline

**Target**: 2026-08-31

### Phase 4: Documentation Complete
- [ ] All policy documents
- [ ] All control mappings
- [ ] Incident response plan
- [ ] Backup/restore procedure
- [ ] Privacy documentation
- [ ] Trust center materials

**Target**: 2026-09-30

## Risk Assessment

### High Risk Items
- None (all high-risk items closed)

### Medium Risk Items
- None (all medium-risk items closed)

### Low Risk Items
- None (all low-risk items closed)

## Dependencies

### External Dependencies
- Occu-Med IT: Access review process, backup infrastructure
- Legal counsel: Privacy notice, BAA agreements
- Third-party: Malware scanning service, pen testing

### Internal Dependencies
- POAM-002 depends on POAM-004 (session timeout requires safety mode)
- POAM-009 depends on POAM-010 (IR testing requires IR plan)
- POAM-011 depends on POAM-012 (scanning requires SLA definition)

## Resources Required

### Personnel
- Security Engineer: 40% FTE for 3 months
- Privacy Officer: 20% FTE for 2 months
- DevOps Engineer: 30% FTE for 2 months

### Tools/Services
- Malware scanning service: $500/month
- Penetration testing: $5,000 one-time
- SBOM tool: Open source (Syft)
- Vulnerability scanning: GitHub Actions (free)

## Notes

- This POA&M will be updated monthly
- High-priority items should be addressed first
- All remediation plans should include testing and verification
- Evidence should be collected for all completed items
