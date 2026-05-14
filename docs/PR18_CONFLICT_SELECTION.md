# PR #18 Conflict Selection (AppLayout.tsx)

Conflict location: `artifacts/packet-path/src/components/layout/AppLayout.tsx` in `navItems`.

## What to select
Choose **Accept current change**.

Reason:
- Current adds `{ label: "Agreements", href: "/agreements" }`.
- Incoming already keeps Templates/Analytics lines below.
- Accepting current preserves the new Agreements entry without removing existing items.

## Final expected nav order
1. Dashboard
2. All Cases
3. E-Signatures
4. Agreements
5. Templates
6. Analytics
