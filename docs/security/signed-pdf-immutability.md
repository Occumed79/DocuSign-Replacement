# Signed PDF Immutability

## Goal

Prevent post-signature tampering of finalized signed documents.

## Current State

The platform stores:

- document hash
- signer evidence hashes
- final evidence hash
- planned finalized PDF hash fields

## Planned Finalization Flow

1. Final signer completes request
2. Final PDF artifact generated
3. PDF SHA-256 hash generated
4. Immutable evidence bundle generated
5. Final artifact stored in durable storage
6. Final artifact metadata written to database

## Recommended Storage Targets

- Supabase Storage
- S3-compatible object storage
- Azure Blob Storage

## Planned Integrity Checks

- final PDF hash verification
- evidence bundle verification
- signer evidence verification
