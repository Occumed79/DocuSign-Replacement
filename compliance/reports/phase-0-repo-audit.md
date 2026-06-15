# Phase 0 — Repository Audit

**Repository**: Occumed79/DocuSign-Replacement  
**Product**: PacketPath / DocuSign replacement / federal-contractor packet and signature workflow platform  
**Date**: 2026-06-15  
**Purpose**: Baseline assessment before implementing SEW-1.6 FedRAMP Phase 3 and SOC 2/GDPR/ISO addendum

---

## Project Structure Map

### Monorepo Structure
- **Root**: Workspace configuration with pnpm
- **artifacts/api-server**: Express backend (TypeScript)
- **artifacts/packet-path**: React/Vite frontend
- **artifacts/mockup-sandbox**: Mockup preview tool
- **lib/db**: Drizzle ORM schema and database configuration
- **lib/api-spec**: OpenAPI specification generation
- **scripts**: Utility scripts (seed, generate-secrets)
- **compliance**: Compliance documentation (in progress)

### Key Configuration Files
- `package.json`: Root workspace configuration
- `pnpm-workspace.yaml`: Workspace definitions
- `Dockerfile`: Multi-stage container build
- `render.yaml`: Render deployment configuration
- `entrypoint.sh`: Container startup script
- `.env.example`: Environment variable template

---

## Existing Auth/Session Model

### Database Schema (lib/db/src/schema)
- **usersTable**: id, name, email, passwordHash, role (admin/examqa/reviewer)
- **activeSessionsTable**: token, userId, ipAddress, userAgent, expiresAt, revokedAt
- **loginAttemptsTable**: email, ipAddress, success, lockedUntil, attemptCount
- **mfaSecretsTable**: userId, secret (base32 TOTP), isEnabled, verifiedAt
- **mfaBackupCodesTable**: userId, codeHash (SHA-256), usedAt
- **mfaChallengesTable**: userId, challengeToken, expiresAt, usedAt

### Implementation (artifacts/api-server/src)
- **routes/auth.ts**: Login, logout, session management
- **routes/mfa.ts**: TOTP setup, verification, backup codes
- **routes/webauthn.ts**: WebAuthn/passkey support
- **lib/session-store.ts**: Session storage and management
- **lib/mfa.ts**: MFA logic and TOTP verification
- **lib/rbac.ts**: Role-based access control
- **lib/require-auth.ts**: Authentication middleware
- **lib/step-up-auth.ts**: Step-up authentication for sensitive operations
- **lib/privileged-step-up.ts**: Privileged action authentication
- **lib/risk-based-auth.ts**: Risk-based authentication signals
- **lib/risk-signal-providers.ts**: Risk signal providers

### Security Features
- ✅ Password hashing (bcrypt)
- ✅ Session tokens with expiration
- ✅ Session revocation support
- ✅ Login attempt tracking with lockout
- ✅ TOTP MFA support
- ✅ MFA backup codes
- ✅ WebAuthn/passkey support
- ✅ Role-based access control (admin, examqa, reviewer)
- ✅ Risk-based authentication
- ✅ Step-up authentication

---

## Existing Signing Flow

### Database Schema
- **signatureTemplatesTable**: Reusable document templates with formSchema
- **signatureRequestsTable**: Document requests with encryption support
- **signatureRecipientsTable**: Recipients with tokenHash for signing links
- **completedSignaturesTable**: Signature data with evidence payload
- **formResponsesTable**: Form responses with encryption support

### Implementation
- **routes/signatures.ts**: Signature request creation, management, public signing
- **routes/signature-verification.ts**: Signature verification and evidence
- **lib/certificate-of-completion.ts**: Certificate generation
- **lib/integrity-chain.ts**: Document integrity chain
- **lib/integrity-ledger.ts**: Immutable integrity ledger
- **lib/manifest-signing.ts**: Evidence manifest signing

### Security Features
- ✅ Token-based signing links (tokenHash: SHA-256 of 48-byte random token)
- ✅ Token expiration
- ✅ Document hashing (SHA-256) for tamper detection
- ✅ Evidence payload hashing
- ✅ AES-256-GCM encryption for sensitive data
- ✅ Envelope encryption with wrapped keys
- ✅ Immutable integrity ledger with hash chain
- ✅ Electronic record consent tracking
- ✅ IP address and user agent capture

---

## Existing PDF/Document Flow

### Implementation
- **lib/pdf.ts**: PDF generation using PDFKit
- **lib/artifact-storage.ts**: Artifact storage interface
- **routes/certificates.ts**: Certificate export (JSON, PDF)

### Features
- ✅ PDF generation for signed documents
- ✅ Certificate of completion generation
- ✅ JSON evidence export
- ✅ Artifact storage abstraction (for S3 integration)

---

## Existing Database Schema

### Core Tables
- **users**: User accounts with roles
- **exam-types**: Exam type definitions
- **cases**: Case/patient records
- **questions**: Question bank
- **answers**: Answer records
- **signatureTemplates**: Document templates
- **signatureRequests**: Signature requests
- **signatureRecipients**: Signing recipients
- **completedSignatures**: Completed signatures
- **formResponses**: Form responses
- **mfaSecrets**: MFA configuration
- **mfaBackupCodes**: MFA recovery codes
- **mfaChallenges**: MFA challenges
- **webhooks**: Webhook configurations
- **branding**: Branding configuration
- **templateVersions**: Template versioning
- **formProgress**: Form progress tracking
- **webauthn**: WebAuthn credentials
- **integrityLedger**: Immutable integrity chain
- **securityEvents**: Security event logging
- **auditLogs**: Audit trail
- **activeSessions**: Session management
- **loginAttempts**: Login tracking
- **securityOperations**: Security operations tracking
- **evidenceManifests**: Evidence manifests

### Security-Related Tables
- ✅ auditLogs: Comprehensive audit trail
- ✅ securityEvents: Security event logging
- ✅ activeSessions: Session management
- ✅ loginAttempts: Brute force protection
- ✅ integrityLedger: Tamper-evident chain
- ✅ evidenceManifests: Evidence tracking

---

## Existing Audit Logging

### Database Schema
- **auditLogsTable**: userId, userEmail, userName, action, resource, resourceId, details, ipAddress, userAgent, phiAccessed, patientName, createdAt
- **securityEventsTable**: eventType, userId, email, ipAddress, userAgent, details, severity, createdAt

### Implementation
- **lib/audit-bundle.ts**: Audit bundle generation
- **lib/siem.ts**: SIEM integration
- **lib/logger.ts**: Structured logging (pino)
- **lib/security-alerts.ts**: Security alert generation
- **routes/audit-export.ts**: Audit log export

### Audit Actions Tracked
- ✅ Generic CRUD: view, create, update, delete, export
- ✅ Auth: login, logout, permission_denied
- ✅ Signature lifecycle: created, viewed, signed, declined, voided, completed, expired
- ✅ PDF: pdf_downloaded
- ✅ Invitations: invitation_sent, invitation_failed, reminder_sent, reminder_failed
- ✅ Certificates: certificate_generated, certificate_json_exported, certificate_pdf_exported
- ✅ Audit: audit_bundle_exported
- ✅ Evidence: evidence_verified, evidence_verification_failed
- ✅ Integrity: final_artifact_hashed

### Security Event Types
- ✅ login_success, login_failed, login_locked, logout
- ✅ password_change, session_expired, unauthorized_access
- ✅ phi_export, case_submitted, admin_action, session_revoked

---

## Existing File Upload/Storage Behavior

### Implementation
- **lib/artifact-storage.ts**: Storage abstraction layer
- **routes/signatures.ts**: Document content handling

### Current State
- ⚠️ Document content stored in database (text/jsonb)
- ⚠️ No file type restrictions documented
- ⚠️ No file size limits documented
- ⚠️ No malware scanning integration
- ⚠️ Artifact storage interface exists but not fully implemented for S3

---

## Existing Public Token Routes

### Implementation
- **routes/signatures.ts**: Public signing link endpoint
- **routes/setup.ts**: Initial setup endpoint

### Security Features
- ✅ Token-based access (tokenHash)
- ✅ Token expiration
- ✅ IP address and user agent capture
- ⚠️ No documented anti-replay checks
- ⚠️ No documented link revocation

---

## Existing Admin/Security Pages

### Frontend
- **artifacts/packet-path**: React frontend with admin dashboard

### Backend Routes
- **routes/users.ts**: User management
- **routes/security.ts**: Security operations
- **routes/security-operations.ts**: Security operations tracking
- **routes/fraud-review.ts**: Fraud review interface
- **routes/dashboard.ts**: Dashboard analytics

---

## Existing Test Coverage

### Test Files
- **artifacts/api-server/src/app.test.ts**: App-level tests
- **artifacts/api-server/src/routes/auth.test.ts**: Auth route tests
- **artifacts/api-server/src/lib/email.test.ts**: Email tests
- **artifacts/api-server/src/lib/session-store.test.ts**: Session store tests
- **artifacts/api-server/src/lib/env.test.ts**: Environment validation tests (newly added)

### Test Framework
- ✅ Vitest configured
- ⚠️ Limited test coverage for security-critical paths
- ⚠️ No documented security-specific test suite

---

## Existing Environment Variables

### Documented in .env.example
- Database: DATABASE_URL
- Application: NODE_ENV, PORT, APP_BASE_URL, ALLOWED_ORIGINS, RUN_DB_PUSH_ON_STARTUP
- Security: SESSION_SECRET, DB_ENCRYPTION_KEY, MFA_ENCRYPTION_KEY, BLIND_INDEX_KEY
- SMTP: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_FROM_NAME
- Twilio: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
- Sentry: SENTRY_DSN
- AWS S3: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET

### Validation
- ✅ Environment validation in lib/env.ts
- ✅ Strict 64-hex validation for encryption keys (newly fixed)
- ✅ Production environment checks

---

## Existing Deployment Model

### Deployment Platforms
- ✅ Render: Docker deployment with render.yaml
- ✅ Docker: Multi-stage build with Dockerfile
- ✅ Local: Docker Compose support

### Deployment Configuration
- ✅ Dockerfile: Multi-stage build (frontend + backend)
- ✅ render.yaml: Render service configuration
- ✅ entrypoint.sh: Container startup with database migration
- ⚠️ No documented production hosting boundary
- ⚠️ No documented BAA/vendor agreements

---

## Existing Gaps Preventing PHI/CUI Readiness

### Critical Gaps
1. **Data Sensitivity Mode**: No DATA_SENSITIVITY_MODE flag to block PHI/CUI in demo
2. **Seed Data**: No documented check to prevent seed credentials in production
3. **Hosting Boundary**: No documented authorization boundary for PHI/CUI
4. **BAA Agreements**: No documented BAA with hosting providers
5. **Malware Scanning**: No malware scanning for file uploads
6. **File Type/Size Limits**: No documented restrictions
7. **Anti-Replay**: No documented anti-replay checks for signing tokens
8. **Link Revocation**: No documented signing link revocation
9. **Session Timeout**: No documented idle timeout
10. **Account Lockout**: Login attempt tracking exists but lockout policy not documented
11. **Secure Cookies**: No documented secure cookie configuration
12. **HTTPS Enforcement**: No documented HTTPS enforcement behind proxy
13. **Secret Scanning**: No GitHub secret scanning workflow
14. **Dependency Scanning**: No automated dependency scanning (Dependabot exists but not documented)
15. **Container Scanning**: No container vulnerability scanning
16. **SBOM Generation**: No SBOM generation
17. **Penetration Testing**: No documented pen testing
18. **Backup/Restore**: No documented backup/restore procedure
19. **Incident Response**: No documented incident response plan
20. **Privacy Controls**: No GDPR/privacy controls (data subject rights, export, deletion)

### Partial Implementations
- **Encryption**: AES-256-GCM implemented but key rotation policy not documented
- **Audit Logging**: Comprehensive but review process not documented
- **MFA**: TOTP implemented but enforcement policy not documented
- **RBAC**: Roles exist but admin access review not documented
- **Integrity Ledger**: Immutable chain exists but tamper detection not fully documented

---

## Security Strengths Identified

1. **Strong Cryptography**: AES-256-GCM encryption, SHA-256 hashing, envelope encryption
2. **Comprehensive Audit Trail**: Detailed audit logs and security events
3. **Immutable Evidence Chain**: Integrity ledger with hash chain
4. **MFA Support**: TOTP, backup codes, WebAuthn
5. **Session Management**: Session tokens, revocation, tracking
6. **Login Protection**: Attempt tracking, lockout
7. **Role-Based Access**: Admin, examqa, reviewer roles
8. **Risk-Based Auth**: Risk signals and step-up authentication
9. **Evidence Generation**: Certificate of completion, audit bundles
10. **Environment Validation**: Strict production checks

---

## Recommended Priority Order for Phase 2 Hardening

### High Priority (Security-Critical)
1. Add DATA_SENSITIVITY_MODE flag and production safety checks
2. Implement secure cookie configuration
3. Document and enforce session timeout
4. Add anti-replay checks for signing tokens
5. Implement signing link revocation
6. Add file type and size restrictions
7. Implement malware scanning adapter
8. Add secret scanning workflow

### Medium Priority (Compliance-Critical)
9. Document encryption key rotation policy
10. Document MFA enforcement policy
11. Document account lockout policy
12. Create incident response plan
13. Create backup/restore procedure
14. Add dependency scanning workflow
15. Add container scanning workflow
16. Add SBOM generation

### Lower Priority (Enhancement)
17. Implement data subject request workflow (GDPR)
18. Add data retention policies
19. Create privacy notice
20. Implement data minimization controls

---

## Conclusion

PacketPath has a strong foundation for security and compliance with:
- Comprehensive audit logging
- Strong cryptography (AES-256-GCM, SHA-256)
- MFA support (TOTP, WebAuthn)
- Immutable evidence chain
- Role-based access control
- Risk-based authentication

However, critical gaps exist for PHI/CUI readiness:
- No data sensitivity mode
- No documented hosting boundary
- No BAA agreements
- No malware scanning
- No documented security policies
- No automated security scanning workflows

The application is well-structured for implementing the SEW-1.6 directives. The existing security features provide a solid base for FedRAMP/NIST/HIPAA alignment and SOC 2/GDPR/ISO readiness.
