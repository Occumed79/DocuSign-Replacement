# Security Headers and CSP

## Runtime Protections

The application uses Helmet with additional hardened security headers.

### Enabled Protections

- Content Security Policy (CSP)
- HSTS (production)
- X-Content-Type-Options
- Referrer-Policy
- Frameguard (DENY)
- Cross-Origin-Opener-Policy
- Cross-Origin-Resource-Policy
- Permissions-Policy
- Origin-Agent-Cluster
- DNS Prefetch Control

## CSP Overview

The CSP configuration currently:

- restricts default content to same-origin
- blocks object/embed execution
- blocks framing
- restricts connect sources
- upgrades insecure requests in production

## Future Improvements

- remove unsafe-inline usage
- migrate to nonce-based CSP
- add CSP reporting endpoint
