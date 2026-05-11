# DocuSign Parity Backlog (Based on UI Reference)

This backlog maps your screenshots to concrete product features to implement in PacketPath.

## 1) Start Menu Actions (High Priority)
**DocuSign reference:** Start → Send an Envelope / Sign a Document / Use a Template.

### Needed in PacketPath
- Add a global **Start** menu in app header/sidebar.
- Actions:
  1. **Send Document** (new request from upload)
  2. **Use Template** (launch from template picker)
  3. **Sign Document** (self-sign / ad-hoc signing)

## 2) Templates List Experience (High Priority)
**DocuSign reference:** searchable list/table with owner, dates, favorites, and one-click Use.

### Needed in PacketPath
- Add template table view option with columns:
  - Name
  - Owner
  - Created
  - Last Updated
  - Category/Folder
- Add row-level CTA: **Use**
- Add search + filters + sort (date, owner, category)
- Add favorites/pins

## 3) Home Dashboard with Activity Feed (High Priority)
**DocuSign reference:** summary metrics + recent agreement activity + resend actions.

### Needed in PacketPath
- KPI strip for last 6 months:
  - Action Required
  - Waiting for Others
  - Expiring Soon
  - Completed
- Activity list with status bars and quick actions:
  - Resend
  - Copy link
  - Void

## 4) Agreement Inbox (High Priority)
**DocuSign reference:** Inbox/Sent/Completed/Action Required with filters and download.

### Needed in PacketPath
- Add dedicated **Agreements** page with left nav states:
  - Inbox
  - Sent
  - Completed
  - Action Required
- Add table with filters:
  - Date range
  - Status
  - Sender
- Row actions:
  - Download
  - Open details

## 5) Template-to-Send Flow (Must-Have)
- “Use Template” should open recipient + send wizard directly.
- Preserve pre-filled form content and role routing.

## 6) Upload-First Flow (Must-Have)
- Upload PDF/DOCX first, then map recipients + fields.
- Keep HTML import as power-user option.

## Suggested Implementation Order (2-week sprint)
1. Start menu + routing stubs
2. Agreements page shell with filters
3. Template table + Use CTA
4. Home activity feed + quick resend
5. Hook up API queries and actions
