# PR #12 Conflict Resolution Guide (Dashboard.tsx)

If you are resolving conflicts in GitHub for `artifacts/packet-path/src/pages/Dashboard.tsx`, use this merge choice:

## Which code to keep
Keep the **incoming/main version** for both conflicts, because it contains the latest auto-tracked onboarding logic and removes manual localStorage checkboxes.

### Conflict 1 (around line ~53)
- **Discard current block** that defines:
  - `onboarding` local state
  - `toggleOnboarding`
  - `localStorage` reads/writes
- **Keep incoming block** that defines:
  - `hasTemplate`
  - `hasSignatureRequest`
  - `loadOnboardingSignals()` fetching `/api/signature-templates` and `/api/signature-requests`
  - `checklistDone`

### Conflict 2 (around line ~132)
- **Discard current checkbox UI** with “Mark done”.
- **Keep incoming status UI** that shows:
  - `Status: Complete / Not started`
  - `Progress: {checklistDone}/3 complete (auto-tracked)`

## Click-path in GitHub UI
1. In each conflict, click **Accept incoming change**.
2. Click **Mark as resolved**.
3. Click **Commit merge**.

## After merge
Run local verification:

```bash
pnpm --filter packet-path build
```

Expected result:
- Dashboard empty-state shows three steps with auto-detected status.
- No manual checkboxes.
