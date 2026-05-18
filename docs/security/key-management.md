# Key Management

## Purpose

This document defines the current and planned key management approach for PacketPath application-level encryption.

## Implemented Key Types

### DB_ENCRYPTION_KEY

Used as the AES-256 master/wrapping key for application-level envelope encryption.

Requirements:

- 64 hexadecimal characters
- Generated with a cryptographically secure random source
- Stored only in the deployment secret manager/environment
- Never committed to source control
- Rotated through a documented procedure

### DB_ENCRYPTION_KEY_ID

Optional identifier for the active encryption key.

If omitted, the application uses:

```text
db-master-key-v1
```

## Rotation Strategy

Recommended future key rotation process:

1. Generate a new 64-character hexadecimal key.
2. Set a new `DB_ENCRYPTION_KEY_ID`.
3. Deploy code that can read old and new key IDs.
4. Rewrap data keys from old master key to new master key.
5. Validate decrypt success rates.
6. Retire the old key after verification and backup windows.

## Operational Requirements

- Limit access to production encryption keys.
- Require MFA/WebAuthn for administrators with access to deployment secrets.
- Log all changes to encryption key environment variables.
- Store key-rotation records.
- Test decrypt/re-encrypt workflows in a staging environment first.

## Future Enhancements

- External KMS adapter
- AWS KMS support
- Azure Key Vault support
- GCP Cloud KMS support
- Supabase Vault review
- split-key custody model
- formal key rotation runbooks
- decrypt failure monitoring

## Known Limitations

- Current implementation assumes a single active master key.
- Multi-key read support is not yet implemented.
- Rewrap migration tooling is not yet implemented.
- HSM-backed or KMS-backed keys are roadmap items.
