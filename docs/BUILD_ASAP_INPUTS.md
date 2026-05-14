# What to Send Next (Fastest Path to Production)

To accelerate delivery, share the following in priority order.

## 1) Must-have workflow decisions (single source of truth)
Provide short yes/no or bullet answers:
- Can users send from **PDF only**, or must we support DOCX too?
- Single signer only, or multi-signer with routing order?
- Do you need CC recipients?
- Is in-person signing required?
- Do we need reminders and expiration on day 1?
- Which actions are mandatory on list rows? (Resend, Void, Download, Copy link)

## 2) Real document set (top 10 forms)
For each form, provide:
- File (PDF and/or HTML)
- Form name
- Typical recipient roles
- Required fields (checkboxes, text, date, signature, initials)
- Completion constraints (required vs optional)

## 3) Exact UX references
Send 1–2 screenshots for each target page with notes:
- Home dashboard
- Templates list
- Agreements inbox
- Send wizard
- Request detail page
For each screenshot, mark:
- "Must match"
- "Can differ"

## 4) Brand + content pack
- Logo (SVG/PNG)
- Colors and typography rules
- Email copy for invite/reminder/completion
- Legal footer language

## 5) Environment and infrastructure inputs
- Preferred file storage (S3/R2/GCS)
- SMTP provider details
- Domain and callback URLs
- Retention policy requirements

## 6) Compliance and risk constraints
- HIPAA scope confirmation
- Audit retention duration
- Access model (admin, sender, reviewer)
- MFA requirement (who must use it)

## 7) Delivery guardrails
- Target launch date
- Non-negotiable scope for v1
- Nice-to-have scope for v1.1
- Reviewer/approver for weekly demos

---

## Ready-to-fill template (copy/paste)

### Product rules
- PDF support: 
- DOCX support: 
- Multi-recipient routing: 
- CC recipients: 
- Reminder cadence: 
- Expiration default: 

### Top forms (repeat for each)
- Name:
- File(s):
- Recipient role(s):
- Required fields:
- Notes:

### UI parity priorities
- Must match screens:
- Can differ screens:

### Launch
- v1 date:
- v1 must-have list:
- v1.1 list:
