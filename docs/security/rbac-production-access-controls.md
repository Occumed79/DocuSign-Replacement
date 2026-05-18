# RBAC and Production Access Controls

## Purpose

PacketPath uses role-based access controls to limit sensitive e-signature, PHI, certificate, audit, and evidence operations.

This document separates implemented application controls from operational production access requirements that must be enforced through GitHub, hosting, database, and secret-management settings.

## Implemented Application Permissions

The application now defines explicit permissions for sensitive actions:

- `signature:read`
- `signature:create`
- `signature:void`
- `signature:finalize_artifact`
- `signature:verify_evidence`
- `signature:export_certificate`
- `signature:export_audit_bundle`
- `security:review`
- `security:manage`
- `user:manage`
- `phi:view`
- `phi:export`

## Current Role Mapping

The current database role enum supports existing legacy roles:

- `admin`
- `reviewer`
- `examqa`

These are mapped to permissions in:

```text
artifacts/api-server/src/lib/rbac.ts
```

## Sensitive Routes Now Permission-Gated

### Certificate of Completion

Requires:

```text
signature:export_certificate
```

Routes:

```http
POST /api/signature-requests/:id/certificate
GET /api/signature-requests/:id/certificate.json
GET /api/signature-requests/:id/certificate.pdf
```

### Audit Bundle Export

Requires:

```text
signature:export_audit_bundle
```

Route:

```http
GET /api/signature-requests/:id/audit-bundle
```

### Evidence Verification

Requires:

```text
signature:verify_evidence
```

Route:

```http
POST /api/signature-requests/:id/verify
```

### Finalized Artifact Generation

Requires:

```text
signature:finalize_artifact
```

Route:

```http
POST /api/signature-requests/:id/finalize-artifact
```

## Privileged Action Logging

Permission denials and privileged actions are logged to the audit log where available.

Logged privileged events include:

- certificate generation
- certificate export
- audit bundle export
- evidence verification
- artifact finalization
- permission denial

## Production Access Operational Requirements

The following must be enforced outside the application:

- restrict hosting platform admin access
- restrict database admin access
- require MFA or WebAuthn for production platform admins
- require approval for production secret changes
- log production environment variable changes
- prohibit direct production database edits except approved emergencies
- maintain quarterly access reviews
- document emergency access use

## Future Enhancements

- Expand database role enum to include `security_officer`, `auditor`, and `read_only`
- Add permission assignment tables
- Add temporary elevated access
- Add dual approval for destructive actions
- Add break-glass workflow
- Add admin access review UI
- Add WebAuthn enforcement for privileged actions

## Known Limitations

- Current RBAC implementation maps legacy roles to permissions rather than using dynamic permission tables.
- GitHub, Render, database, and secret-manager access are not controlled by this application code.
- Full production access governance requires operational setup and leadership approval.
