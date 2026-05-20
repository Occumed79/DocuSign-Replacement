# Runtime Hardening

## Purpose

PacketPath applies layered browser and API runtime protections to reduce exposure to:

- XSS attacks
- malicious embedding
- clickjacking
- unsafe inline script execution
- CSP bypasses
- browser exploitation
- oversized payload abuse
- insecure cross-origin requests

This implementation is staged to avoid breaking the frontend before full nonce-based CSP migration is complete.

## Implemented Components

### Helmet hardening

Implemented in:

```text
artifacts/api-server/src/app.ts
```

Current protections include:

- frame denial
- HSTS
- no-sniff
- strict referrer policy
- permissions policy
- cross-origin protections
- origin agent clustering
- CSP

## CSP Hardening

### Current staged model

The application supports two CSP modes.

#### Report-only mode

Enabled by default:

```env
CSP_REPORT_ONLY=true
```

This allows CSP violations to be monitored safely before strict enforcement is enabled.

#### Strict CSP mode

Optional stricter mode:

```env
STRICT_CSP=true
```

When enabled:

- inline scripts are removed from policy
- nonce-based script loading is enabled
- Trusted Types preparation is enabled
- strict-dynamic is enabled

## CSP Violation Reporting

Implemented endpoint:

```http
POST /api/security/csp-report
```

Implemented middleware:

```text
artifacts/api-server/src/middleware/csp-report.ts
```

Violation reports are forwarded into the security operations/SIEM layer.

## Trusted Types Preparation

When strict CSP is enabled:

```text
requireTrustedTypesFor 'script'
```

is enabled.

This prepares the application for stronger DOM XSS protections.

## Request Size Hardening

JSON and form payload limits are reduced:

```text
5mb
```

URL-encoded parser limits:

```text
parameterLimit=100
```

## CORS Hardening

CORS now restricts:

- methods
- headers
- origins
- credentials usage

Allowed headers explicitly include:

```text
Authorization
X-CSRF-Token
X-Step-Up-Token
```

## Additional Browser Protections

Additional headers include:

- X-Frame-Options: DENY
- Cross-Origin-Embedder-Policy
- Document-Policy
- Origin-Agent-Cluster

## Known Limitations

- Frontend nonce injection is not fully implemented yet.
- Strict CSP may break legacy inline frontend behavior.
- CSRF token middleware is not yet fully implemented.
- Trusted Types enforcement requires frontend compatibility work.
- File upload scanning/quarantine is not yet implemented.

## Future Enhancements

- Full nonce migration
- Full Trusted Types migration
- CSRF double-submit tokens
- secure session cookies
- SameSite strict enforcement
- file upload malware scanning
- PDF sanitization pipeline
- sandboxed document rendering
- signed asset manifests
