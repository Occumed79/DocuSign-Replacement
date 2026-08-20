# CSP bootstrap incident — 2026-08-19

## Symptom
Production rendered the static `Loading PacketPath…` card from `index.html` indefinitely. React never mounted.

## Cause
Production CSP enforcement was enabled while the strict policy still combined a per-request nonce with `strict-dynamic`. PacketPath's Vite-generated external module scripts are static files and did not receive that nonce. CSP3-capable browsers can therefore ignore the ordinary `'self'` source expression and block the application entry module.

## Resolution
- Keep production CSP enforcement enabled.
- Allow JavaScript only from the same origin with `script-src 'self'`.
- Do not use `strict-dynamic`/nonce gating until the production HTML response is actually rewritten with matching script nonces.
- Allow the Google Fonts stylesheet explicitly.
- Add frontend bootstrap diagnostics so a future module-initialization failure does not remain an unexplained loading shell.

## Regression guard
`csp-bootstrap.test.ts` asserts that the server policy remains compatible with the Vite production bundle.
