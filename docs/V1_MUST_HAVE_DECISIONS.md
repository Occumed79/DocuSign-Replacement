# V1 Must-Have Decisions (Locked)

## Multi-signer routing
- Enabled in v1.
- Sequential signing order enforced by recipient `order`.
- Signer N+1 cannot sign until signer N is complete.

## Reminders
- Enabled in v1.
- Manual reminder action available from request row actions.
- Auto-reminder cadence: every 48 hours until complete/voided/expired.

## Expiration
- Enabled in v1.
- Default expiration: 7 days.
- Allowed options at send-time: 3, 7, 14, 30 days.
- Expired requests move to `expired` state and can be renewed.

## Row actions (request list)
- Must-have actions in v1:
  - View details
  - Copy signing link
  - Send reminder
  - Download signed PDF
  - Void request

## Document ingestion
- v1 supports importing any file in Templates editor:
  - HTML/HTM: editable content
  - PDF: inline embedded preview block
  - Images: inline preview
  - Other file types: downloadable attachment link block

## Scope note
- This is a practical v1 baseline for DocuSign-like operational parity.
- Deeper parity (native PDF field placement, foldering, shared access controls) is v1.1.
