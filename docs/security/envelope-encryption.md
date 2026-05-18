# Envelope Encryption Architecture

## Purpose

PacketPath uses envelope encryption to protect sensitive signing data at the application layer in addition to infrastructure/database storage protections.

This design is intended to narrow the gap with commercial e-signature security architectures that use strong encryption for stored documents and signing records.

## Current Implementation

The repository now includes reusable AES-256-GCM encryption utilities:

```text
artifacts/api-server/src/lib/envelope-encryption.ts
```

The implementation supports:

- AES-256-GCM authenticated encryption
- per-field/per-record data encryption keys
- wrapped data keys
- 12-byte random IVs
- authentication tags
- key identifiers
- backward-compatible schema columns

## Key Model

### Master Key

The production master/wrapping key is provided through:

```env
DB_ENCRYPTION_KEY=64_hex_character_key
```

This key must be generated with a cryptographically secure random source.

Example generation command:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Data Keys

Each encrypted field or record can use a newly generated 256-bit data key.

The data key is not stored in plaintext. It is wrapped using the configured master key.

## Schema Support

The following encrypted columns have been added while retaining legacy/plaintext columns for migration safety:

### signature_requests

- `encrypted_document_content`
- `wrapped_document_key`
- `encryption_key_id`
- `encrypted_form_schema`
- `wrapped_form_schema_key`

### completed_signatures

- `encrypted_signature_data`
- `wrapped_signature_key`
- `encrypted_evidence_payload`
- `wrapped_evidence_key`

### form_responses

- `encrypted_responses`
- `wrapped_responses_key`

## Backward Compatibility

Plaintext columns remain in place for existing records and safe migration.

This is intentional. The app should not silently migrate or destroy production data without a tested migration plan.

## Recommended Rollout

1. Add schema columns.
2. Deploy encryption utilities.
3. Write integration tests.
4. Encrypt new records first.
5. Verify reads support encrypted and legacy records.
6. Backfill existing records in batches.
7. Confirm hashes remain stable.
8. Add monitoring for decrypt failures.
9. After sufficient validation, consider deprecating plaintext storage.

## Security Notes

- AES-256-GCM provides confidentiality and integrity for encrypted payloads.
- Random IVs must never be reused with the same key.
- The master wrapping key must never be committed to source control.
- Wrapped data keys are safe to store with encrypted payloads when the master key is protected.
- Plaintext PHI must not be logged during encryption/decryption.

## Known Limitations

- Existing signing routes have not yet been fully migrated to write encrypted payloads only.
- Existing plaintext columns remain populated for backward compatibility.
- External KMS integration is not yet implemented.
- Key rotation workflow is documented separately and requires operational discipline.
