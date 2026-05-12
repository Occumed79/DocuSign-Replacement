# Post-Merge Next Steps (If Conflicts Are Already Resolved)

If you already resolved the GitHub conflicts and merged, do these in order:

1. Pull latest main branch locally.
2. Run frontend build:
   - `pnpm --filter packet-path build`
3. Open these routes and verify quickly:
   - `/agreements`
   - `/esignatures`
   - `/signature-templates`
4. Create one request from template and validate row actions:
   - View
   - Remind
   - Void
   - Download PDF

## Immediate coding priorities after merge
1. Add auto-reminder scheduler (48h cadence) in backend.
2. Add expiration renewal action from Agreements rows.
3. Add Start menu (Send / Use Template / Sign Document) in header.
4. Add table/list toggle for Templates with owner/date columns.
