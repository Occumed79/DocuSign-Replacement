# SEW-1.6 FEDRAMP PHASE 3 BUILD DIRECTIVE

Repository: Occumed79/DocuSign-Replacement
Product: PacketPath / DocuSign replacement / federal-contractor packet and signature workflow platform

## Mission

Build PacketPath toward a FedRAMP-targeted, HIPAA-aware, NIST-aligned, evidence-producing security posture.

This does NOT mean claiming official FedRAMP Authorization, SOC 2, CMMC certification, or government approval. It means building the application, documentation, automated evidence, and security controls so that Occu-Med can later decide whether to pursue formal authorization or certification.

The target is: FedRAMP Moderate/High readiness architecture, NIST SP 800-53 Rev. 5 mapping, NIST SP 800-171 Rev. 3 mapping, HIPAA Security Rule alignment, OWASP ASVS 5 application-security hardening, and CMMC Level 2 readiness evidence where relevant.

## Non-negotiable rules

1. Do not delete existing product functionality.
2. Do not store PHI/CUI in development seed data.
3. Do not add fake compliance claims.
4. Do not write “FedRAMP Authorized,” “CMMC Certified,” “SOC 2 Certified,” or “HIPAA Certified.”
5. Use precise wording: “FedRAMP-targeted,” “FedRAMP-ready evidence package,” “NIST-aligned,” “HIPAA Security Rule aligned,” “CMMC Level 2 readiness support.”
6. All security work must produce evidence: code, tests, docs, logs, policies, screenshots/placeholders, or generated reports.
7. Keep the app deployable on Render/Neon for demos, but document that production PHI/CUI use requires an approved hosting boundary and signed vendor/BAA agreements.
8. Prefer free/open-source tools and GitHub-native security features.
9. Make all changes small, typed, tested, and documented.
10. At the end, produce a security-readiness report with implemented controls, partial controls, gaps, and next steps.

## Official reference resources

Use these as the source of truth:

### FedRAMP Rev. 5 official resources

- FedRAMP Rev. 5 Documents & Templates: https://www.fedramp.gov/rev5/documents-templates/
- FedRAMP Agency Authorization: https://www.fedramp.gov/rev5/agency-authorization/
- FedRAMP Authorization Boundary Guidance: available from the FedRAMP Documents & Templates page
- FedRAMP High/Moderate/Low/LI-SaaS Baseline SSP: available from the FedRAMP Documents & Templates page
- FedRAMP Initial Authorization Package Checklist: available from the FedRAMP Documents & Templates page
- FedRAMP Security Controls Baseline: available from the FedRAMP Documents & Templates page
- FedRAMP POA&M Template: available from the FedRAMP Documents & Templates page
- FedRAMP SAP Template: available from the FedRAMP Documents & Templates page
- FedRAMP SAR Template: available from the FedRAMP Documents & Templates page
- FedRAMP Continuous Monitoring Deliverables Template: available from the FedRAMP Documents & Templates page
- FedRAMP Penetration Test Guidance: available from the FedRAMP Documents & Templates page
- FedRAMP Vulnerability Scanning Requirements for Containers: available from the FedRAMP Documents & Templates page
- FedRAMP Cryptographic Module Selection Policy: available from the FedRAMP Documents & Templates page

### FedRAMP 20x official resources

- FedRAMP 20x Overview: https://www.fedramp.gov/20x/
- FedRAMP 20x Docs: https://www.fedramp.gov/20x/docs/
- FedRAMP 20x Phase 3: https://www.fedramp.gov/20x/phase-three/

### NIST official resources

- NIST SP 800-53 Rev. 5: Security and Privacy Controls for Information Systems and Organizations: https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final
- NIST SP 800-37 Rev. 2: Risk Management Framework: https://csrc.nist.gov/pubs/sp/800/37/r2/final
- NIST SP 800-171 Rev. 3: Protecting CUI in Nonfederal Systems and Organizations: https://csrc.nist.gov/pubs/sp/800/171/r3/final
- NIST SP 800-171A Rev. 3: Assessing CUI Requirements: https://csrc.nist.gov/pubs/sp/800/171/a/r3/final
- NIST SP 800-218: Secure Software Development Framework: https://csrc.nist.gov/pubs/sp/800/218/final
- NIST OSCAL: https://pages.nist.gov/OSCAL/

### HIPAA/HHS official resources

- HHS Summary of HIPAA Security Rule: https://www.hhs.gov/hipaa/for-professionals/security/laws-regulations/index.html
- HHS Cloud Computing Guidance: https://www.hhs.gov/hipaa/for-professionals/special-topics/cloud-computing/index.html
- HHS Business Associate Contracts: https://www.hhs.gov/hipaa/for-professionals/covered-entities/sample-business-associate-agreement-provisions/index.html

### App-security resources

- OWASP ASVS: https://owasp.org/www-project-application-security-verification-standard/
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- OWASP ZAP Baseline Scan: https://www.zaproxy.org/docs/docker/baseline-scan/
- OWASP Cheat Sheet Series: https://cheatsheetseries.owasp.org/

### Free/open-source security tools

- CodeQL: https://codeql.github.com/
- Dependabot: https://docs.github.com/en/code-security/dependabot
- GitHub secret scanning: https://docs.github.com/en/code-security/secret-scanning
- Gitleaks: https://github.com/gitleaks/gitleaks
- Trivy: https://github.com/aquasecurity/trivy
- OSV Scanner: https://github.com/google/osv-scanner
- Syft SBOM generator: https://github.com/anchore/syft
- Grype vulnerability scanner: https://github.com/anchore/grype
- Semgrep: https://github.com/semgrep/semgrep
- ZAP GitHub Action: https://github.com/zaproxy/action-baseline

## Phase 0 — repo audit before changing code

Create: compliance/reports/phase-0-repo-audit.md

Perform and document:

- Project structure map
- Existing auth/session model
- Existing signing flow
- Existing PDF/document flow
- Existing database schema
- Existing audit logging
- Existing file upload/storage behavior
- Existing public token routes
- Existing admin/security pages
- Existing test coverage
- Existing environment variables
- Existing deployment model
- Existing gaps preventing PHI/CUI readiness

Do not assume. Read the code.

## Phase 1 — create compliance skeleton

Create this folder structure:

```text
compliance/
  README.md
  executive-summary.md
  disclaimers-and-claims.md
  authorization-boundary.md
  data-flow-diagram.md
  data-inventory.md
  system-security-plan.md
  shared-responsibility-matrix.md
  far-52-204-21-mapping.md
  nist-800-53-rev5-moderate-mapping.md
  nist-800-171-rev3-mapping.md
  cmmc-level-2-readiness.md
  hipaa-security-rule-mapping.md
  owasp-asvs-5-mapping.md
  ssdf-secure-development-plan.md
  rules-of-behavior.md
  incident-response-plan.md
  contingency-plan.md
  backup-retention-policy.md
  access-control-policy.md
  audit-logging-policy.md
  encryption-policy.md
  vulnerability-management-plan.md
  configuration-management-plan.md
  change-management-plan.md
  risk-assessment.md
  poam.md
  evidence/
    README.md
    control-evidence-index.md
    screenshots/.gitkeep
    scans/.gitkeep
    sbom/.gitkeep
    test-results/.gitkeep
  reports/
    phase-0-repo-audit.md
    phase-1-compliance-skeleton.md
    phase-2-security-implementation.md
    phase-3-readiness-report.md
```

Each mapping file must have a table with:

- Control ID
- Control name
- Applicability
- Implementation status: Implemented / Partial / Planned / Not Applicable
- Evidence path
- Gap
- Owner
- Notes

## Phase 2 — harden the application

Implement controls in priority order.

### Identity and access management

- Enforce secure sessions in production.
- Require strong password policy.
- Add admin MFA/TOTP if missing.
- Add role-based access checks server-side, not only UI-side.
- Add account lockout/rate-limit for login attempts.
- Add session expiration and idle timeout.
- Add password reset tokens with short expiration and one-time use.
- Add admin user creation/update/delete audit events.

Evidence:
- tests for unauthorized access
- tests for role boundaries
- screenshots or documented test output
- code references in compliance/evidence/control-evidence-index.md

### Public signing-link security

- Signing tokens must be random, long, one-time or controlled-use, and expiring.
- Add link revocation/void support.
- Add anti-replay checks.
- Store token hashes, not raw tokens, if feasible.
- Add event logging for opened, consented, viewed, signed, declined, expired, voided.
- Add IP/user-agent capture with privacy warning.
- Add explicit signer consent to electronic records.
- Add clear signer intent language before final signature.
- Add signer certificate metadata page in final PDF.

Evidence:
- unit/integration tests
- route-level security tests
- audit event samples
- PDF/certificate sample without real PHI

### Document integrity

- Hash original document at creation.
- Hash each signed version.
- Create an immutable signing-event chain with previous_event_hash and current_event_hash.
- Include document hash and signature event hash in certificate of completion.
- Detect document tampering before download/display.
- Make audit events append-only at the application layer.

Evidence:
- tests proving tamper detection
- hash chain docs
- sample audit event JSON

### Audit logging

- Create typed audit events.
- Capture actor, action, resource type, resource ID, timestamp, IP, user agent, request ID, outcome, and metadata.
- Prevent normal users from editing/deleting audit logs.
- Admin audit viewer should support filtering/export.
- Add correlation/request ID middleware.
- Log security-sensitive events: login success/failure, MFA, token issue/use/revoke, file upload/download, role change, PDF generation, signature finalization, admin setting changes.

Evidence:
- audit event schema
- test cases
- sample exported audit log

### PHI/CUI safety mode

- Add a configuration flag: DATA_SENSITIVITY_MODE=demo|commercial|phi|cui.
- In demo mode, block real PHI/CUI warnings and seed only fake data.
- In phi/cui mode, require production security env vars and refuse startup if critical settings are missing.
- Add UI banner: “Demo mode — do not enter PHI/CUI.”
- Add server-side check that prevents seed/demo credentials in production.

Evidence:
- startup validation tests
- demo warning screenshot/doc
- env var checklist

### File upload/download security

- Restrict file types.
- Enforce file size limits.
- Store files outside public web root.
- Add malware scanning integration placeholder using ClamAV-compatible interface or documented scanner adapter.
- Add content-disposition protections.
- Add audit logs for upload/download/view/delete.
- Add checksum/hash on upload.

Evidence:
- upload tests
- rejected file tests
- hash evidence

### Encryption and secrets

- Enforce HTTPS assumptions behind proxy.
- Secure cookies in production.
- Document encryption in transit and at rest.
- Add env var validation for secrets.
- No default production secrets.
- Add secret scanning workflow.
- Add key rotation policy doc.

Evidence:
- env validation tests
- GitHub Actions logs
- encryption-policy.md

### Secure headers and API hardening

- Helmet hardening.
- Strict CORS in production.
- CSRF protection for cookie-authenticated state changes if applicable.
- Rate limits for login, signing-token, upload, and API routes.
- Input validation with Zod or equivalent at every API boundary.
- Output encoding and safe rendering.
- Security headers test.

Evidence:
- tests
- middleware docs
- scan output

### Backups and recovery

- Document database backup/restore process.
- Add scripts/checks for backup readiness if possible.
- Create contingency-plan.md and backup-retention-policy.md.
- Add restore drill checklist.

Evidence:
- checklist
- dry-run output if available

## Phase 3 — automated evidence and readiness package

Create GitHub workflows where possible:

```text
.github/workflows/security-codeql.yml
.github/workflows/security-dependencies.yml
.github/workflows/security-secrets.yml
.github/workflows/security-container-trivy.yml
.github/workflows/security-sbom.yml
.github/workflows/security-osv.yml
.github/workflows/security-zap-baseline.yml
.github/workflows/compliance-evidence.yml
```

Minimum outputs:

- CodeQL scan
- Dependabot config
- pnpm audit or equivalent
- Gitleaks scan
- Trivy filesystem/container scan
- OSV scan
- Syft SBOM output
- OWASP ZAP baseline placeholder/job for deployed URL
- Security test results
- Compliance evidence index update

Create package scripts:

```json
{
  "security:audit": "pnpm audit",
  "security:test": "pnpm test --filter=api-server",
  "compliance:report": "node scripts/dist/compliance-report.mjs"
}
```

If the monorepo structure requires different commands, implement equivalent commands that actually work.

Generate:

- compliance/reports/phase-3-readiness-report.md
- compliance/evidence/control-evidence-index.md
- compliance/poam.md

The final report must include:

1. What was implemented
2. What evidence exists
3. What remains partial
4. What requires Occu-Med policy/IT ownership
5. What requires paid/formal assessment
6. What cannot be claimed yet
7. What can be truthfully claimed now

## Truthful claims allowed after this work

Allowed if supported by evidence:

- “Built toward FedRAMP Moderate readiness.”
- “Maintains a FedRAMP-style evidence package.”
- “Includes NIST SP 800-53 Rev. 5 control mapping.”
- “Includes NIST SP 800-171 Rev. 3 / CUI readiness mapping.”
- “Includes HIPAA Security Rule safeguard mapping.”
- “Implements tamper-evident signing audit trails.”
- “Supports immutable-style audit evidence and document hash verification.”
- “Uses automated security scanning and SBOM generation.”

Forbidden claims:

- “FedRAMP Authorized.”
- “FedRAMP Certified.”
- “CMMC Certified.”
- “SOC 2 Certified.”
- “HIPAA Certified.”
- “DoD Approved.”
- “Government Approved.”

## Done criteria

Phase 3 is done when:

- The app still builds.
- Typecheck passes.
- Existing tests pass or failures are documented with fixes.
- New security tests are added for the highest-risk routes.
- Compliance folder exists with all required docs.
- At least one mapping exists for FedRAMP/NIST 800-53, NIST 800-171, HIPAA, and OWASP ASVS.
- GitHub Actions security workflows exist.
- Evidence index exists.
- POA&M exists.
- Final readiness report exists.
- README has a compliance/security section with honest claims and disclaimers.

## First actions for SEW-1.6

Start with this sequence:

1. Read package.json, workspace config, Dockerfile, README, API server source, frontend source, DB schema, migrations, auth/session files, signing routes, PDF generation, audit logging, and deployment config.
2. Produce compliance/reports/phase-0-repo-audit.md.
3. Create the compliance skeleton.
4. Identify the highest-risk missing controls.
5. Implement startup production safety checks.
6. Implement or strengthen audit logging.
7. Implement signing-token hardening.
8. Implement document hash/tamper checks.
9. Add security workflows.
10. Generate the Phase 3 readiness report.

## Output format required from SEW-1.6

At the end, return:

- Commit SHA
- Files changed
- Controls implemented
- Controls partially implemented
- Tests run
- Tests failed, if any
- Security workflows added
- Remaining POA&M items
- Whether app can honestly be called FedRAMP-targeted / NIST-aligned / HIPAA Security Rule aligned

Do not stop at generic documentation. Build the controls and the evidence.
