# Third-Party Security Assessment Procedure

**Document Version**: 1.0  
**Effective Date**: 2026-06-15  
**Review Frequency**: Annually  
**Owner**: Security Team

## Purpose

This document establishes the procedure for assessing the security posture of third-party vendors and service providers that access or process PacketPath data.

## Scope

This procedure applies to all third-party vendors that:
- Access PacketPath systems or data
- Process sensitive data on behalf of PacketPath
- Provide critical services to PacketPath
- Are subprocessors under data processing agreements

## Assessment Categories

### High-Risk Vendors

**Criteria**:
- Access to PHI/CUI data
- Access to production systems
- Administrative access to systems
- Access to encryption keys
- Access to authentication systems

**Assessment Frequency**: Annual

### Medium-Risk Vendors

**Criteria**:
- Access to non-sensitive data
- Access to non-production systems
- Limited system access
- No administrative access

**Assessment Frequency**: Biennial

### Low-Risk Vendors

**Criteria**:
- No data access
- No system access
- Informational services only

**Assessment Frequency**: As needed

## Assessment Process

### Pre-Assessment

1. **Vendor Classification**
   - Determine risk category
   - Determine assessment scope
   - Determine assessment timeline
   - Assign assessment team

2. **Questionnaire Distribution**
   - Send security questionnaire
   - Set response deadline
   - Clarify questions as needed
   - Review responses

3. **Document Request**
   - Request relevant documentation
   - Request certifications
   - Request audit reports
   - Request penetration test results

### Assessment

1. **Documentation Review**
   - Review security policies
   - Review architecture diagrams
   - Review incident response procedures
   - Review business continuity plans

2. **Certification Verification**
   - Verify SOC 2 reports
   - Verify ISO 27001 certificates
   - Verify PCI DSS compliance
   - Verify HIPAA compliance

3. **Technical Assessment**
   - Network security review
   - Application security review
   - Data protection review
   - Access control review

4. **On-Site Assessment** (if applicable)
   - Facility tour
   - Staff interviews
   - System demonstrations
   - Process walkthroughs

### Post-Assessment

1. **Scoring**
   - Assign risk scores
   - Identify gaps
   - Prioritize findings
   - Determine acceptability

2. **Reporting**
   - Generate assessment report
   - Present findings to management
   - Determine remediation requirements
   - Set remediation timeline

3. **Monitoring**
   - Track remediation progress
   - Conduct follow-up assessments
   - Update risk scores
   - Review vendor performance

## Assessment Criteria

### Security Controls

| Control Area | Criteria | Weight |
|--------------|----------|--------|
| Governance | Security policies, executive commitment | 15% |
| Access Control | Authentication, authorization, MFA | 20% |
| Data Protection | Encryption, DLP, backup | 20% |
| Network Security | Firewalls, segmentation, monitoring | 15% |
| Application Security | SDLC, testing, vulnerability management | 15% |
| Incident Response | Detection, response, notification | 10% |
| Compliance | Certifications, audits, assessments | 5% |

### Scoring

- **Excellent**: 90-100%
- **Good**: 80-89%
- **Acceptable**: 70-79%
- **Conditional**: 60-69%
- **Unacceptable**: <60%

## Required Documentation

### Minimum Requirements

- Security policy
- Incident response plan
- Business continuity plan
- Data processing agreement
- Insurance coverage

### Additional Requirements (based on risk)

- SOC 2 Type II report
- ISO 27001 certificate
- Penetration test report
- Vulnerability scan results
- Architecture diagrams

## Vendor Tiers

### Tier 1 (Critical)

**Criteria**:
- Access to PHI/CUI
- Production access
- Administrative access

**Requirements**:
- Annual assessment
- SOC 2 Type II report
- ISO 27001 certification
- Quarterly review

### Tier 2 (Important)

**Criteria**:
- Access to sensitive data
- Non-production access
- Limited administrative access

**Requirements**:
- Biennial assessment
- SOC 2 Type I report
- Annual review

### Tier 3 (Standard)

**Criteria**:
- Access to non-sensitive data
- No administrative access

**Requirements**:
- Security questionnaire
- Self-assessment
- Biennial review

### Tier 4 (Low Risk)

**Criteria**:
- No data access
- No system access

**Requirements**:
- Basic security questionnaire
- As needed review

## Remediation

### Findings Classification

| Severity | Description | Timeline |
|----------|-------------|----------|
| Critical | Immediate risk to data security | 30 days |
| High | Significant security gap | 60 days |
| Medium | Moderate security gap | 90 days |
| Low | Minor security gap | 180 days |

### Escalation

- Critical findings: Escalate to CISO
- High findings: Escalate to Security Manager
- Medium findings: Track with vendor
- Low findings: Track with vendor

### Termination

Terminate vendor relationship if:
- Critical findings not remediated within timeline
- Vendor refuses to address findings
- Vendor security posture degrades significantly
- Regulatory requirements not met

## Ongoing Monitoring

### Continuous Monitoring

- Monitor vendor security news
- Monitor vendor breach notifications
- Monitor vendor certification status
- Monitor vendor financial health

### Periodic Reviews

- Quarterly: Tier 1 vendors
- Semi-annual: Tier 2 vendors
- Annual: Tier 3 vendors
- As needed: Tier 4 vendors

## References

- NIST SP 800-53: SA-12, SA-13
- SOC 2: CC6.9
- ISO 27001: A.5.19
- GDPR Article 28
