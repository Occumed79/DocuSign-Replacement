# OWASP ASVS Self Assessment

## Current Security Controls

### V2 Authentication

- Password hashing via bcrypt
- Session token hashing
- Account lockout protections
- Auth rate limiting
- MFA encryption infrastructure

### V3 Session Management

- Server-side sessions
- HMAC-protected session tokens
- Expiring session model
- Session invalidation support

### V4 Access Control

- Route-level auth enforcement
- Public signing route isolation
- Ordered signing enforcement
- Signature ownership validation

### V5 Validation and Encoding

- Structured request validation
- Canonicalized evidence hashing
- Parameterized database operations

### V7 Error Handling and Logging

- Audit trail logging
- Signature event logging
- Evidence-hash logging
- IP and user-agent capture

### V8 Data Protection

- SHA-256 document hashing
- Evidence bundle hashing
- Token hashing
- Encrypted configuration secrets

### V9 Communications

- HTTPS deployment requirement
- Secure SMTP support

### V10 Malicious Code

- Dependabot enabled
- GitHub CodeQL enabled

### V13 API Security

- Public endpoint rate limiting
- Transaction-safe signing flow
- Duplicate-signature prevention

## Planned Enhancements

- Immutable finalized PDF snapshots
- Certificate-of-completion artifacts
- WebAuthn support
- Hardware-backed signing attestations
- SIEM integration
- Security event anomaly detection
