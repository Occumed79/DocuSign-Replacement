# WebAuthn and Adaptive Authentication Implementation

## Purpose

PacketPath uses WebAuthn/passkeys as the foundation for phishing-resistant authentication and privileged action step-up controls.

This is intended to reduce risk around sensitive actions such as certificate export, audit bundle export, evidence verification, and finalized artifact generation.

## Implemented Components

### Server Dependency

The API server now includes:

```text
@simplewebauthn/server
```

### Database Tables

The database schema includes:

- `webauthn_credentials`
- `webauthn_challenges`
- `webauthn_step_up_sessions`

### Registration Flow

Implemented endpoints:

```http
POST /api/webauthn/register/options
POST /api/webauthn/register/verify
```

The registration flow supports:

- registration challenge creation
- credential exclusion for already-registered credentials
- attestation type set to `none`
- public key credential storage
- credential counter storage
- credential metadata storage

### Authentication / Step-Up Flow

Implemented endpoints:

```http
POST /api/webauthn/authenticate/options
POST /api/webauthn/authenticate/verify
```

The authentication flow supports:

- authentication challenge creation
- credential lookup
- WebAuthn assertion verification
- counter update
- short-lived step-up token issuance

## Step-Up Enforcement

The following sensitive actions can require recent WebAuthn verification when the production feature flag is enabled:

```env
REQUIRE_WEBAUTHN_FOR_PRIVILEGED_ACTIONS=true
```

### Protected Actions

Certificate export:

```text
certificate_export
```

Audit bundle export:

```text
audit_bundle_export
```

Evidence verification:

```text
evidence_verification
```

Finalized artifact generation:

```text
artifact_finalization
```

## Step-Up Token Header

After successful WebAuthn authentication, the server returns a short-lived step-up token.

Clients must send the token using:

```http
X-Step-Up-Token: <token>
```

## Important Feature Flag Behavior

By default, privileged action step-up enforcement is disabled unless:

```env
REQUIRE_WEBAUTHN_FOR_PRIVILEGED_ACTIONS=true
```

This avoids locking users out before frontend passkey registration/authentication flows are deployed and tested.

## Required Environment Variables

Recommended production values:

```env
WEBAUTHN_RP_ID=yourdomain.com
WEBAUTHN_RP_NAME=PacketPath
WEBAUTHN_ORIGIN=https://yourdomain.com
REQUIRE_WEBAUTHN_FOR_PRIVILEGED_ACTIONS=true
```

## Known Limitations

- Frontend browser-side WebAuthn ceremony is not yet implemented.
- Production origin/RP ID must be configured exactly.
- Recovery flows for lost passkeys are not yet implemented.
- Admin-only mandatory WebAuthn enrollment is not yet enforced.
- Full UI for credential management is not yet implemented.

## Roadmap

- Add frontend passkey registration screen
- Add frontend passkey step-up modal
- Add credential management UI
- Add lost-device recovery process
- Require WebAuthn for admin accounts
- Require WebAuthn for production access operations
- Add WebAuthn audit event reporting
