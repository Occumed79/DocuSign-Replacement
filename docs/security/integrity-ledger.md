# Append-Only Integrity Ledger

## Purpose

The PacketPath integrity ledger records high-value evidence events in a chained, tamper-evident structure.

This is separate from ordinary audit logging. Audit logs describe activity. The integrity ledger is designed to support forensic validation by linking event records together with SHA-256 hashes.

## Implemented Schema

```text
lib/db/src/schema/integrity-ledger.ts
```

Table:

```text
integrity_ledger
```

Important fields:

- request ID
- actor user ID
- event type
- event payload
- event payload hash
- previous entry hash
- current entry hash
- hashing algorithm
- canonicalization method
- timestamp

## Hashing Model

Each ledger entry stores:

1. A canonical JSON hash of the event payload.
2. A chained entry hash containing:
   - request ID
   - actor user ID
   - event type
   - event payload hash
   - previous entry hash
   - created timestamp

This creates a request-specific chain. If an earlier entry is altered, later chain validation should fail.

## Implemented Helpers

```text
artifacts/api-server/src/lib/integrity-ledger.ts
```

Implemented helpers:

- `appendIntegrityLedgerEvent()`
- `verifyIntegrityLedgerChain()`
- `computeLedgerEntryHash()`

## Implemented Routes

```http
GET /api/signature-requests/:id/integrity-ledger
GET /api/signature-requests/:id/integrity-chain
```

These routes require:

```text
signature:verify_evidence
```

## Events Currently Written

The following events are now written to the integrity ledger:

- certificate generation
- certificate JSON export
- certificate PDF export
- audit bundle export
- evidence verification success/failure
- final artifact hash generation

## Security Benefits

- Provides tamper-evident evidence event history
- Supports forensic reconstruction
- Helps distinguish ordinary activity logs from evidence integrity records
- Links certificate, audit export, verification, and finalization events
- Gives reviewers a chain validation endpoint

## Known Limitations

- Database-level immutability is not yet enforced by triggers or restricted permissions.
- Ledger writes are currently best-effort in some routes to avoid breaking user workflows.
- Merkle root/checkpoint support is not yet implemented.
- External anchoring/notarization is not yet implemented.
- Schema migration must be applied before ledger routes can run in production.

## Future Enhancements

- Database trigger preventing update/delete operations
- Merkle tree root per request
- signed daily checkpoints
- external timestamp authority integration
- evidence transparency checkpoints
- offline ledger verification CLI
- SOC/security dashboard visualization
