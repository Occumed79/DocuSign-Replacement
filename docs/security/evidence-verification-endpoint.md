# Evidence Verification Endpoint

## Purpose

Allow administrators and auditors to validate:

- document integrity
- evidence integrity
- signer integrity
- tamper status
- final evidence bundle hashes

## Proposed Endpoint

```http
POST /api/signature-requests/:id/verify
```

## Validation Steps

1. Retrieve signature request
2. Recompute SHA-256 document hash
3. Recompute signer evidence hashes
4. Recompute final evidence hash
5. Validate recipient/signature relationships
6. Validate immutable timestamps
7. Return tamper assessment

## Example Response

```json
{
  "valid": true,
  "documentHashValid": true,
  "evidenceHashesValid": true,
  "finalEvidenceHashValid": true,
  "tamperDetected": false
}
```
