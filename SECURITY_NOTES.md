# PacketPath Security Notes

## Signing Tokens

Signing recipient tokens are bearer-style secrets. Anyone with a valid token can access the public signing flow for that recipient.

Current hardening goal:
- Avoid exposing raw tokens in broad list/detail APIs unless the UI explicitly needs to copy a signing link.
- Prefer returning a complete signing URL through a narrowly scoped action endpoint.
- Treat signing links as sensitive and avoid logging them.

## Production Domain

Set APP_BASE_URL in production so generated signing links and PDF audit links use the deployed Render/custom domain.

Example:

APP_BASE_URL=https://your-service.onrender.com

## Demo Handling

For demos, use fake recipients and fake test data only. Do not use real applicant PHI until production controls, access rules, and hosting agreements are reviewed.
