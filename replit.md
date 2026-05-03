# PacketPath — Occu-Med Exam Workflow App

## Overview
TurboTax-style internal web app for Occu-Med occupational health exam workflows. macOS glass/luminous UI aesthetic with deep blue-indigo-violet gradients.

## Architecture
- **Frontend**: React + Vite (`artifacts/packet-path`) at preview path `/`
- **Backend**: Express 5 API server (`artifacts/api-server`) at `/api`
- **Database**: PostgreSQL via Drizzle ORM (`lib/db`)
- **API Contract**: OpenAPI spec → Orval codegen → React Query hooks + Zod schemas
- **Auth**: SHA-256 token-based (localStorage `packetpath_token`, in-memory token store)

## Tech Stack
- React 18, Vite 7, Wouter (routing), Framer Motion (animations), TanStack Query
- Shadcn/ui components, Tailwind CSS v4, Inter font
- Express 5, Drizzle ORM, PostgreSQL
- Orval codegen from OpenAPI spec

## Project Structure
```
artifacts/
  api-server/          # Express backend (port 8080)
  packet-path/         # React+Vite frontend (port 25834)
  mockup-sandbox/      # Canvas component sandbox
lib/
  api-client-react/    # Orval-generated React Query hooks
  api-spec/            # OpenAPI specification
  api-zod/             # Orval-generated Zod schemas
  db/                  # Drizzle schema + migrations
```

## Pages
- `/login` — Glass morphism login page
- `/` — Dashboard with stats, recent cases, exam type breakdown
- `/cases` — Case list with search/filter, card grid
- `/cases/new` — New case form (patient info + exam type selection)
- `/cases/:id` — TurboTax-style interview wizard (section-by-section Q&A)
- `/cases/:id/review` — Packet review with completion ring, missing fields, recommendations
- `/admin` — Question template management (CRUD) for admins
- `/esignatures` — E-signature hub: list requests, stats, create wizard
- `/signature-templates` — Manage reusable document templates (with seed starters)
- `/signature-requests/:id` — Detail view with audit trail + recipient certificates
- `/sign/:token` — **Public** signing page (no auth, token-based) — draw or type signature

## E-Signature Platform (DocuSign Replacement)
- Secure 48-byte `crypto.randomBytes` base64url tokens per recipient
- SHA-256 document hash stored at creation → tamper detection
- Signature hash = SHA-256(sigData + fullName + IP)
- IP address, user agent, timestamp logged per signature
- Full audit trail in `audit_logs` table (HIPAA §164.312(b) compliant)
- Signing links are public (no auth required); all other endpoints require Bearer token
- Supports draw (canvas) and type signature modes
- Multi-recipient signing with ordered signing flow
- Void / remind / copy-link admin actions
- ESIGN Act + UETA compliant legal language on signing page

## Database Schema
- `users` — admin, examqa, reviewer roles
- `exam_types` — Deployment Packet, Traditional Packet, Dental Only, Labs Only
- `cases` — patient cases with status tracking
- `questions` — question templates with answer types, follow-up logic
- `case_answers` — answers linked to cases + questions
- `signature_templates` — reusable document templates (HTML content)
- `signature_requests` — specific document sent for signing (with document hash)
- `signature_recipients` — each signer with unique secure token, expiry, status
- `completed_signatures` — signature data, hash, IP, UA, timestamp per signed recipient
- `audit_logs`, `security_events`, `active_sessions`, `login_attempts` — security/PHI suite

## Seeded Data
- Users: admin@occumed.com, examqa@occumed.com, reviewer@occumed.com (all: `admin123`)
- 4 exam types, 36 questions across sections, 5 sample cases

## Auth
- `POST /api/auth/login` → token
- Token stored in `localStorage` as `packetpath_token`
- `setAuthTokenGetter` attaches Bearer token to all API calls
- Password: SHA-256(`password + "packetpath_salt"`)

## Design System
- CSS: macOS glass morphism (`.glass`, `.glass-card`, `.glass-dark`)
- Background: `.luminous-gradient` (blue-indigo-violet)
- Sidebar: `.sidebar-gradient` (dark navy)
- Primary color: hsl(217, 91%, 60%) — blue
- Accent color: hsl(250, 80%, 60%) — violet
- Font: Inter
