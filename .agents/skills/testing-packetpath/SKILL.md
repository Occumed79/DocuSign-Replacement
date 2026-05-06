---
name: testing-packetpath
description: Test the PacketPath occupational health exam workflow app end-to-end. Use when verifying UI, API, seed data, or config changes.
---

# Testing PacketPath

## Prerequisites

- PostgreSQL running on port 5432 (use `docker compose up -d` from repo root)
- Database schema pushed: `DATABASE_URL=postgresql://... pnpm db:push`
- Database seeded: `DATABASE_URL=postgresql://... pnpm db:seed`

## Starting the App

1. Start API server (port 8080): `DATABASE_URL=postgresql://... pnpm dev:api`
2. Start frontend (port 5173): `pnpm dev:web`
3. Frontend proxies `/api/*` requests to the API server via Vite config

## Test Credentials

| Role | Email | Password |
|---------|------------------------|----------|
| Admin | admin@occumed.com | admin123 |
| Exam QA | examqa@occumed.com | admin123 |
| Reviewer| reviewer@occumed.com | admin123 |

## Seed Data (Expected Values)

- **Users**: 3 (admin, examqa, reviewer)
- **Exam Types**: 4 (Deployment Packet, Traditional Packet, Dental Only, Labs Only)
- **Questions**: 36 across sections (Patient Demographics, Employment, Medical History, Vitals, Dental, Labs, Clearance)
- **Cases**: 5 sample patients:
  - John Smith (Deployment Packet, 45%, In Progress)
  - Sarah Johnson (Traditional Packet, 100%, Complete)
  - Michael Davis (Dental Only, 0%, Draft)
  - Emily Brown (Labs Only, 60%, In Progress)
  - Robert Wilson (Deployment Packet, 100%, Submitted)
- **Dashboard Stats**: Total Cases=5, In Progress=2, Complete=2, Avg Completion=61%

## Key Pages to Test

| Page | URL | What to Verify |
|------|-----|----------------|
| Login | `/login` | Pre-filled demo credentials, sign in works |
| Dashboard | `/` | Stat cards match seed data, recent cases listed |
| All Cases | `/cases` | Shows correct case count, filter dropdowns populated |
| New Case | `/cases/new` | 4 exam type cards visible, form submission creates case |
| Case Wizard | `/cases/:id` | Questions load by section, answers save |
| E-Signatures | `/esignatures` | Page loads without errors |
| Admin | `/admin` | Admin-only route, requires admin role |

## Primary Test Flow

1. Navigate to `http://localhost:5173` — should redirect to `/login`
2. Login with admin credentials — should land on Dashboard
3. Verify dashboard stats match seed data expectations
4. Navigate to All Cases — verify 5 cases displayed
5. Click New Case — verify 4 exam type cards
6. Create a case (enter name, select exam type, submit) — should redirect to wizard
7. Verify wizard loads questions grouped by sections
8. Navigate to E-Signatures — verify page loads

## Common Issues

- If login fails with network error, the Vite proxy might not be configured — check `vite.config.ts` for the `/api` proxy entry
- If dashboard shows 0 cases, the seed script may not have run — run `pnpm db:seed`
- If exam type cards are empty on New Case page, check that exam types were seeded
- The seed script is idempotent (truncates before inserting) — safe to re-run
- Admin-only pages (Admin, Security, Audit Log, Email Settings) require the admin role; other roles get redirected

## Devin Secrets Needed

No external secrets required. The app uses a local PostgreSQL database with credentials configured via `DATABASE_URL` environment variable.
