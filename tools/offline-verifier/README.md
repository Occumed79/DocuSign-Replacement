# Offline Verification CLI

## Goal

Provide offline verification of exported audit bundles and security manifests.

## Planned Capabilities

- verify audit bundle hash
- verify security manifest hash
- verify signer evidence hashes
- verify finalized PDF hash
- detect tampering offline

## Future CLI Commands

```bash
packetpath-verify bundle.json
packetpath-verify manifest.json
packetpath-verify --pdf signed.pdf manifest.json
```

## Planned Future Enhancements

- detached signatures
- signed manifests
- timestamp authority validation
- transparency log validation
