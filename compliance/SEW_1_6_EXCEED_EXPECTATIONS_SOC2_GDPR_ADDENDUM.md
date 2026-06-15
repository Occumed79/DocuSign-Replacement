# SEW-1.6 EXCEED EXPECTATIONS ADDENDUM — SOC 2, GDPR, ISO 27001, PRIVACY, AND TRUST PACKAGE

Repository: Occumed79/DocuSign-Replacement
Applies to: `compliance/SEW_1_6_FEDRAMP_PHASE_3_BUILD_DIRECTIVE.md`

## Mission expansion

The existing Phase 3 directive is strong for FedRAMP/NIST/HIPAA/OWASP. Expand it so PacketPath also has a serious trust/compliance structure for:

- SOC 2 Type I / Type II readiness
- AICPA Trust Services Criteria mapping
- GDPR readiness / privacy management
- ISO/IEC 27001-style ISMS readiness
- ISO/IEC 27701-style privacy management readiness
- CSA Cloud Controls Matrix mapping
- Vendor/security questionnaire readiness
- Customer trust-center evidence package

This does NOT mean claiming SOC 2 certification, ISO certification, GDPR certification, FedRAMP Authorization, CMMC certification, HIPAA certification, or government approval.

The allowed goal is: evidence-backed readiness and control maturity that exceeds normal startup expectations and gives Occu-Med IT/security a real review package.

## Official / primary reference resources

### SOC 2 / AICPA

- AICPA Trust Services Criteria: https://www.aicpa-cima.com/resources/download/2017-trust-services-criteria-with-revised-points-of-focus-2022
- AICPA SOC 2 overview resources: https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-2

SOC 2 readiness must map controls against the Trust Services Categories:

- Security
- Availability
- Processing Integrity
- Confidentiality
- Privacy

The common criteria structure should include:

- CC1 — Control Environment
- CC2 — Communication and Information
- CC3 — Risk Assessment
- CC4 — Monitoring Activities
- CC5 — Control Activities
- CC6 — Logical and Physical Access Controls
- CC7 — System Operations
- CC8 — Change Management
- CC9 — Risk Mitigation

Additional category criteria to map where applicable:

- A1 — Availability
- PI1 — Processing Integrity
- C1 — Confidentiality
- P1 through P8 — Privacy criteria

### GDPR / EU privacy

- European Commission — Legal framework of EU data protection: https://commission.europa.eu/law/law-topic/data-protection/legal-framework-eu-data-protection_en
- GDPR legal text: https://eur-lex.europa.eu/eli/reg/2016/679/oj
- European Data Protection Board guidance: https://www.edpb.europa.eu/our-work-tools/general-guidance/guidelines-recommendations-best-practices_en
- EDPB SME Data Protection Guide: https://www.edpb.europa.eu/sme-data-protection-guide/home_en

GDPR readiness must map at least:

- Article 5 — Principles relating to processing of personal data
- Article 6 — Lawfulness of processing
- Article 9 — Special categories of personal data, including health data
- Articles 12–14 — Transparent information and notices
- Article 15 — Right of access
- Article 16 — Right to rectification
- Article 17 — Right to erasure
- Article 18 — Right to restriction of processing
- Article 20 — Right to data portability
- Article 21 — Right to object
- Article 25 — Data protection by design and by default
- Article 28 — Processor requirements
- Article 30 — Records of processing activities
- Article 32 — Security of processing
- Articles 33–34 — Personal data breach notification
- Article 35 — Data protection impact assessment
- Chapter V / Articles 44+ — International transfers

### ISO / management-system readiness

- ISO/IEC 27001 overview: https://www.iso.org/standard/27001
- ISO/IEC 27000 family overview: https://www.iso.org/standard/iso-iec-27000-family
- ISO/IEC 27701 overview: https://www.iso.org/standard/71670.html

Do not copy paid ISO text. Build an ISO-style ISMS structure using publicly described management-system concepts:

- ISMS scope
- Interested parties
- Risk assessment and treatment
- Security objectives
- Statement of Applicability placeholder
- Internal audit procedure
- Management review procedure
- Corrective action register
- Continual improvement log

### Cloud/security maturity

- CSA Cloud Controls Matrix: https://cloudsecurityalliance.org/research/cloud-controls-matrix
- CIS Controls: https://www.cisecurity.org/controls
- NIST Cybersecurity Framework: https://www.nist.gov/cyberframework

Use these to strengthen customer trust and cloud governance beyond minimum FedRAMP/NIST documentation.

## Required new folder structure

Add these files and folders under `compliance/`:

```text
compliance/
  soc2/
    README.md
    soc2-readiness-summary.md
    trust-services-criteria-mapping.md
    common-criteria-cc1-control-environment.md
    common-criteria-cc2-communication-information.md
    common-criteria-cc3-risk-assessment.md
    common-criteria-cc4-monitoring.md
    common-criteria-cc5-control-activities.md
    common-criteria-cc6-logical-physical-access.md
    common-criteria-cc7-system-operations.md
    common-criteria-cc8-change-management.md
    common-criteria-cc9-risk-mitigation.md
    availability-criteria.md
    confidentiality-criteria.md
    processing-integrity-criteria.md
    privacy-criteria.md
    management-assertion-draft.md
    system-description-draft.md
    control-owner-matrix.md
    audit-period-readiness-plan.md
    type-i-vs-type-ii-readiness.md
    evidence-request-list.md

  privacy/
    README.md
    privacy-program-summary.md
    gdpr-readiness-summary.md
    gdpr-article-mapping.md
    data-protection-impact-assessment-template.md
    records-of-processing-activities.md
    data-subject-rights-procedure.md
    data-retention-and-deletion-policy.md
    privacy-notice-draft.md
    cookie-and-tracking-inventory.md
    consent-and-lawful-basis-register.md
    processor-subprocessor-register.md
    international-transfer-assessment.md
    breach-notification-procedure.md
    privacy-by-design-checklist.md
    sensitive-data-and-health-data-policy.md

  iso27001/
    README.md
    isms-scope.md
    interested-parties.md
    risk-assessment-methodology.md
    risk-register.md
    risk-treatment-plan.md
    statement-of-applicability-draft.md
    security-objectives.md
    internal-audit-procedure.md
    management-review-procedure.md
    corrective-action-register.md
    continual-improvement-log.md

  cloud-governance/
    README.md
    csa-ccm-mapping.md
    cis-controls-mapping.md
    nist-csf-mapping.md
    vendor-risk-management-policy.md
    subprocessor-due-diligence-checklist.md
    customer-security-questionnaire.md

  trust-center/
    README.md
    public-security-page-draft.md
    compliance-claims-matrix.md
    customer-facing-security-whitepaper.md
    security-faq.md
    shared-responsibility-model.md
    legal-disclaimers.md
    sample-evidence-package-index.md
```

## SOC 2 readiness build requirements

Create a SOC 2 readiness system that makes PacketPath reviewable against the AICPA Trust Services Criteria.

### Required SOC 2 control domains

For each domain, create controls, evidence paths, owner, frequency, and tests.

#### CC1 — Control environment

Build/document:

- Security governance structure
- Security responsibility matrix
- Code owner/security owner placeholders
- Acceptable use and rules of behavior
- Workforce onboarding/offboarding checklist
- Ethics/confidentiality acknowledgment template

Evidence:

- `compliance/soc2/control-owner-matrix.md`
- `compliance/rules-of-behavior.md`
- onboarding/offboarding checklist

#### CC2 — Communication and information

Build/document:

- Internal security communication process
- Incident reporting channel
- Security awareness requirements
- Customer-facing security FAQ
- Trust center public claims matrix

Evidence:

- `compliance/trust-center/security-faq.md`
- `compliance/trust-center/compliance-claims-matrix.md`

#### CC3 — Risk assessment

Build/document:

- Risk assessment methodology
- Threat model
- Abuse-case matrix
- Vendor/subprocessor risk process
- Risk register

Evidence:

- `compliance/risk-assessment.md`
- `compliance/iso27001/risk-register.md`
- `compliance/cloud-governance/vendor-risk-management-policy.md`

#### CC4 — Monitoring activities

Build/document:

- Continuous monitoring process
- Security workflow evidence collection
- Review cadence
- Vulnerability triage SLA
- Audit-log review process

Evidence:

- GitHub Actions workflows
- `compliance/evidence/control-evidence-index.md`
- `compliance/vulnerability-management-plan.md`

#### CC5 — Control activities

Build/document:

- Policy-to-control mapping
- Control testing schedule
- Change approval process
- Secure SDLC gates

Evidence:

- `compliance/change-management-plan.md`
- `compliance/configuration-management-plan.md`
- `compliance/ssdf-secure-development-plan.md`

#### CC6 — Logical and physical access

Build/verify:

- MFA/TOTP for admins or roadmap with blocking critical gap
- RBAC server-side enforcement
- Session timeout and secure cookie requirements
- Account lockout and brute-force protection
- Least privilege roles
- Access review procedure

Evidence:

- tests for unauthorized access
- tests for role enforcement
- access-control policy
- admin access review template

#### CC7 — System operations

Build/verify:

- Logging and alerting
- Security event taxonomy
- Incident response process
- Backup/restore checklist
- Malware scanning adapter or placeholder with production requirement
- Operational runbook

Evidence:

- audit event samples
- incident response plan
- backup retention policy
- contingency plan

#### CC8 — Change management

Build/verify:

- Pull request/change review process
- Dependency update process
- Release checklist
- Rollback plan
- Migration review process

Evidence:

- change management plan
- release checklist
- migration checklist

#### CC9 — Risk mitigation

Build/verify:

- Vendor risk management
- Subprocessor register
- Third-party dependency register
- POA&M linkage
- Accepted risk process

Evidence:

- `compliance/cloud-governance/subprocessor-due-diligence-checklist.md`
- `compliance/privacy/processor-subprocessor-register.md`
- `compliance/poam.md`

### SOC 2 additional categories

Add criteria where relevant:

- Availability: uptime, backups, recovery, monitoring, capacity, incident response.
- Confidentiality: encryption, access controls, file handling, retention, secure disposal.
- Processing Integrity: form completion accuracy, validation, routing correctness, PDF/signature finalization accuracy.
- Privacy: notice, consent, data minimization, access/correction/deletion/export, retention, disclosure, monitoring.

## GDPR/privacy build requirements

PacketPath handles forms, signatures, audit data, and possibly health information. Build privacy readiness even if EU users are not planned today.

### Required privacy features / structures

Implement or document:

- Data inventory by field/table/object
- Personal data classification
- Special category/health data flagging
- Lawful basis register
- Consent register where consent is used
- Privacy notice draft
- Data subject request workflow
- Export personal data function or documented roadmap
- Delete/anonymize personal data function or documented roadmap
- Retention rules per object type
- Processor/subprocessor list
- International transfer assessment placeholder
- DPIA template for health-history workflows
- Privacy by design checklist for every new feature
- Breach notification procedure

### Technical privacy controls to build where feasible

- `DATA_SENSITIVITY_MODE=demo|commercial|phi|cui|gdpr|high`
- Table/field classification metadata or documentation generated from schema
- Admin-only data export endpoint with audit log
- Admin-only data deletion/anonymization workflow with audit log, if safe
- Per-case retention metadata
- Audit event for privacy export/delete/access requests
- UI warning in demo mode: “Do not enter PHI, CUI, or real personal data.”
- Minimize signer public-page data exposure
- Avoid exposing signer email/name in URLs
- Do not log raw signing tokens
- Redact sensitive values from logs

Evidence:

- tests for export/delete/audit events if implemented
- data inventory
- ROPA
- DPIA template
- retention policy

## ISO 27001-style ISMS readiness

Create a lightweight ISMS structure that can later become an ISO 27001 program.

Required docs:

- ISMS scope
- interested parties
- risk assessment methodology
- risk register
- risk treatment plan
- security objectives
- Statement of Applicability draft
- internal audit procedure
- management review procedure
- corrective action register
- continual improvement log

Do not claim ISO certification.

Allowed wording:

- “ISO/IEC 27001-aligned ISMS readiness package.”
- “Maintains an ISO-style risk and control management structure.”

Forbidden wording:

- “ISO certified.”
- “ISO 27001 certified.”

## Trust center readiness

Build a trust-center package that IT/security/customers can review.

Required files:

- public security page draft
- compliance claims matrix
- customer-facing security whitepaper
- security FAQ
- shared responsibility model
- legal disclaimers
- sample evidence package index

The claims matrix must explicitly separate:

- Implemented and evidenced
- Implemented but not independently audited
- Planned
- Requires Occu-Med IT ownership
- Requires third-party audit/certification
- Must not be claimed

## Customer security questionnaire readiness

Create `compliance/cloud-governance/customer-security-questionnaire.md` with answers for at least:

- Company/product overview
- Hosting model
- Data classification
- PHI/CUI status
- Encryption in transit
- Encryption at rest
- Access control
- MFA
- Logging/auditing
- Backups
- Incident response
- Vulnerability management
- Secure SDLC
- Pen testing status
- Subprocessors
- Data retention
- Data deletion
- Business continuity
- Compliance claims
- Limitations/disclaimers

Use evidence links where possible.

## Additional GitHub workflow requirements

Add or extend workflows for:

```text
.github/workflows/security-codeql.yml
.github/workflows/security-dependencies.yml
.github/workflows/security-secrets.yml
.github/workflows/security-container-trivy.yml
.github/workflows/security-sbom.yml
.github/workflows/security-osv.yml
.github/workflows/security-zap-baseline.yml
.github/workflows/security-semgrep.yml
.github/workflows/compliance-evidence.yml
.github/workflows/privacy-evidence.yml
.github/workflows/soc2-evidence.yml
```

Each workflow should output or reference an artifact that can be listed in:

- `compliance/evidence/control-evidence-index.md`
- `compliance/soc2/evidence-request-list.md`
- `compliance/privacy/gdpr-readiness-summary.md`

## Evidence index expansion

Update `compliance/evidence/control-evidence-index.md` so every item has:

- Framework
- Control ID / criterion
- Control description
- Implementation status
- Evidence file/path
- Automated evidence source
- Manual evidence needed
- Owner
- Frequency
- Last reviewed
- Gap / POA&M link

Frameworks must include:

- FedRAMP/NIST 800-53
- NIST 800-171
- HIPAA Security Rule
- OWASP ASVS
- SOC 2 TSC
- GDPR
- ISO 27001-style ISMS
- CSA CCM
- CIS Controls
- NIST CSF

## README compliance section update

Update README with a short and careful security/compliance section.

Allowed wording:

```text
PacketPath maintains a compliance-readiness package for FedRAMP-targeted, NIST-aligned, HIPAA Security Rule-aligned, SOC 2 readiness, GDPR readiness, and ISO 27001-style security management review. These materials support internal security review and future formal assessments, but they do not represent independent certification or government authorization.
```

Forbidden wording:

```text
FedRAMP Authorized
SOC 2 Certified
ISO 27001 Certified
HIPAA Certified
GDPR Certified
CMMC Certified
DoD Approved
Government Approved
```

## Final report expansion

Update `compliance/reports/phase-3-readiness-report.md` to include:

1. FedRAMP/NIST readiness status
2. HIPAA/ePHI readiness status
3. SOC 2 readiness status
4. GDPR/privacy readiness status
5. ISO 27001-style ISMS readiness status
6. OWASP/security testing status
7. Cloud/vendor governance status
8. Trust-center readiness status
9. Evidence summary
10. Open POA&M items
11. What can be truthfully claimed
12. What cannot be claimed
13. What requires Occu-Med ownership
14. What requires third-party audit or certification

## Truthful target claim after completing this addendum

If evidence supports it, the product may say:

```text
PacketPath is built toward FedRAMP Moderate readiness and maintains a multi-framework compliance-readiness package covering NIST SP 800-53, NIST SP 800-171, HIPAA Security Rule safeguards, SOC 2 Trust Services Criteria readiness, GDPR privacy readiness, OWASP ASVS application security, and ISO 27001-style ISMS controls. Formal certification/authorization has not yet been completed.
```

## Done criteria

This addendum is complete when:

- SOC 2 folder exists with Trust Services Criteria mapping.
- GDPR/privacy folder exists with article mapping, ROPA, DPIA template, DSR procedure, retention/deletion policy, privacy notice draft, and processor register.
- ISO 27001 folder exists with ISMS scope, risk methodology, risk register, treatment plan, SoA draft, management review, internal audit, corrective action, and improvement log.
- Cloud governance folder exists with CSA CCM, CIS Controls, NIST CSF mappings, vendor risk policy, subprocessor due diligence, and customer security questionnaire.
- Trust center folder exists with public security page draft, whitepaper, FAQ, claims matrix, shared responsibility model, and disclaimers.
- Evidence index includes SOC 2, GDPR, ISO, CSA, CIS, and NIST CSF.
- README compliance section is updated with allowed wording only.
- No false certification claims are present.
- Final readiness report includes the expanded sections.

## SEW-1.6 command

Read this file and the original FedRAMP Phase 3 directive. Build all missing SOC 2, GDPR, ISO 27001, privacy, cloud governance, trust center, and evidence structures. Do not stop at docs where code controls are required. Implement technical controls when feasible, document gaps honestly, and link every claim to evidence.
