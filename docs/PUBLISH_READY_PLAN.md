# PacketPath → Publish-Ready Transformation Plan

This plan turns the current prototype into a production-grade, customer-ready DocuSign alternative.

## Phase 1 — Product Positioning & IA (Week 1)
1. **Narrow core promise**
   - Primary use case: send, sign, track occupational-health forms.
   - Secondary: case workflow/admin tools.
2. **Restructure navigation**
   - Top-level: Home, Requests, Templates, Recipients, Audit, Settings.
   - Move "Admin question templates" into a separate "Exam Workflow" section.
3. **Split product modes**
   - “E-Signature Mode” default for most users.
   - “Clinical Workflow Mode” for internal exam operations.

## Phase 2 — Signature Workflow Parity (Weeks 1–2)
1. **Document ingestion**
   - Add PDF/DOCX upload in request creation.
   - Keep HTML editor as advanced mode.
2. **Template builder v2**
   - Drag-and-drop fields (text/date/checkbox/signature/initials).
   - Conditional field visibility.
   - Versioned templates with draft/published states.
3. **Request wizard overhaul**
   - Step 1: Upload/select template.
   - Step 2: Place fields.
   - Step 3: Add recipients and routing order.
   - Step 4: Review and send.
4. **Recipient UX**
   - Resend, replace signer, delegate, CC recipients.

## Phase 3 — Reliable E-Sign Delivery (Weeks 2–3)
1. **Notification pipeline**
   - Outbound email provider integration (SendGrid/Postmark/SES).
   - Retries and dead-letter handling.
2. **Reminder automation**
   - Scheduled reminders with configurable cadence.
3. **Expiration + renewal**
   - Expire links safely; allow one-click renewal.
4. **SMS option**
   - Optional SMS signing links (Twilio) with consent audit.

## Phase 4 — Trust, Legal, and Compliance (Weeks 3–4)
1. **Audit trail hardening**
   - Immutable event chain per request.
   - Downloadable completion certificate.
2. **Identity assurance**
   - Email OTP for signing session.
   - Optional KBA/IDV integration.
3. **Policy controls**
   - Retention policies, legal holds, data export/deletion.
4. **Compliance docs**
   - HIPAA BAA workflow, SOC2 roadmap artifacts, DPA templates.

## Phase 5 — UX Polish to “Publish-Ready” (Weeks 4–5)
1. **Visual system cleanup**
   - Reduce visual noise; simplify cards and spacing.
   - Improve contrast/accessibility targets (WCAG AA).
2. **Empty states with real outcomes**
   - Every zero-state has a clear CTA and a sample walkthrough.
3. **In-app onboarding**
   - Guided setup checklist with completion progress.
4. **Responsive and keyboard-first**
   - Mobile breakpoints for signer pages.
   - Full keyboard navigation for admin surfaces.

## Phase 6 — Operational Readiness (Weeks 5–6)
1. **Environment hardening**
   - Separate dev/stage/prod configs.
   - Secrets manager and rotation policy.
2. **Observability**
   - Structured logs, request IDs, error tracking (Sentry), uptime checks.
3. **Performance budgets**
   - API SLOs and frontend bundle budget.
4. **Backup/recovery drills**
   - Restore tests and runbook verification.

## Phase 7 — QA, Security, and Release (Weeks 6–7)
1. **Automated test gates**
   - Contract tests for signature APIs.
   - E2E tests for create→sign→complete flow.
2. **Security review**
   - Threat modeling, dependency audit, pentest fixes.
3. **Release process**
   - Changelog, migrations, rollback plan.
4. **Pilot launch**
   - 3–5 design partners.
   - Capture telemetry + qualitative feedback.

## Immediate Next 10 Tickets (Do These First)
1. Add file upload endpoint + storage abstraction for request documents.
2. Add PDF field placement UI in template builder.
3. Add recipient routing order UI + backend enforcement.
4. Add completion certificate PDF generation endpoint.
5. Add reminder scheduler worker with retry policy.
6. Add signer OTP verification flow.
7. Add Sentry error reporting for API + frontend.
8. Add E2E happy-path test (create request → signer completes).
9. Add onboarding checklist with progress persistence.
10. Add role-based nav presets (Signer/Admin/Manager).
