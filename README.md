# PacketPath — Occu-Med Exam Workflow App

A TurboTax-style internal web app for occupational health exam workflows with a built-in **DocuSign-replacement e-signature platform**. Features a macOS glass/luminous UI aesthetic with deep blue-indigo-violet gradients.

## Features

- **Exam Workflow** — TurboTax-style interview wizard for patient cases (section-by-section Q&A)
- **E-Signature Platform** — Create, send, and track signature requests with tamper-proof document hashing
- **Public Signing Pages** — Token-based signing links (no auth required) with draw or type signature modes
- **PDF Generation** — Download signed documents as PDF with full audit trail
- **HIPAA-Compliant Audit Logging** — Full audit trail with IP, user agent, and timestamp tracking
- **Email Notifications** — Configurable SMTP for signing request and reminder emails
- **Admin Dashboard** — Case stats, question template management, security event monitoring

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 7, Tailwind CSS v4, Framer Motion, Wouter, TanStack Query |
| UI | Shadcn/ui, glass morphism design system, Inter font |
| Backend | Express 5, Node.js |
| Database | PostgreSQL, Drizzle ORM |
| API Contract | OpenAPI spec → Orval codegen → React Query hooks + Zod schemas |
| Auth | bcrypt password hashing, token-based sessions |
| Security | Helmet, Express Rate Limit |
| Testing | Vitest, Supertest |

## Quick Start

### Prerequisites

- **Node.js** ≥ 22
- **pnpm** ≥ 9
- **PostgreSQL** 15+ (or Docker)

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start PostgreSQL

Using Docker:

```bash
docker compose up -d
```

Or use an existing PostgreSQL instance and set `DATABASE_URL` accordingly.

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env if needed (defaults work with the Docker setup)
```

### 4. Push Database Schema

```bash
DATABASE_URL=postgresql://packetpath:packetpath@localhost:5432/packetpath pnpm db:push
```

### 5. Seed the Database

```bash
DATABASE_URL=postgresql://packetpath:packetpath@localhost:5432/packetpath pnpm db:seed
```

### 6. Run Tests

```bash
# Run all tests
pnpm test --filter=api-server

# Run tests with coverage
pnpm run test:coverage --filter=api-server
```

### 7. Start the App

Start the API server and frontend in separate terminals:

```bash
# Terminal 1 — API server (port 8080)
DATABASE_URL=postgresql://packetpath:packetpath@localhost:5432/packetpath pnpm dev:api

# Terminal 2 — Frontend (port 5173)
pnpm dev:web
```

Open **http://localhost:5173** in your browser.

### Login Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@occumed.com | admin123 | Admin |
| examqa@occumed.com | admin123 | Exam QA |
| reviewer@occumed.com | admin123 | Reviewer |

## Project Structure

```
artifacts/
  api-server/          # Express backend (port 8080)
  packet-path/         # React+Vite frontend (port 5173)
  mockup-sandbox/      # Canvas component sandbox
lib/
  api-client-react/    # Orval-generated React Query hooks
  api-spec/            # OpenAPI specification
  api-zod/             # Orval-generated Zod schemas
  db/                  # Drizzle schema + migrations
scripts/
  src/seed.ts          # Database seed script
```

## Pages

| Path | Description |
|------|-------------|
| `/login` | Glass morphism login page |
| `/` | Dashboard with stats, recent cases, exam type breakdown |
| `/cases` | Case list with search/filter |
| `/cases/new` | New case form (patient info + exam type) |
| `/cases/:id` | TurboTax-style interview wizard |
| `/cases/:id/review` | Packet review with completion ring |
| `/esignatures` | E-signature hub: list requests, stats, create wizard |
| `/signature-templates` | Manage reusable document templates |
| `/signature-requests/:id` | Detail view with audit trail |
| `/sign/:token` | **Public** signing page (no auth, token-based) |
| `/email-settings` | SMTP configuration (admin only) |
| `/admin` | Question template management (admin only) |
| `/users` | User management and role assignment (admin only) |
| `/security` | Security event monitoring (admin only) |
| `/audit` | Audit log viewer (admin only) |

## E-Signature Platform

- Secure 48-byte `crypto.randomBytes` base64url tokens per recipient
- SHA-256 document hash stored at creation for tamper detection
- Signature hash = SHA-256(signatureData + fullName + IP)
- Full audit trail (HIPAA §164.312(b) compliant)
- ESIGN Act + UETA compliant legal language
- Draw (canvas) and type signature modes
- Multi-recipient signing with ordered flow
- Void / remind / copy-link admin actions

## Production Deployment

PacketPath ships with a **Dockerfile** that bundles the frontend and backend into a single container. In production, the Express server serves the React SPA and handles API requests on one port.

### Option A: Neon + Render (Recommended)

If you want a managed PostgreSQL + managed app host, this is the cleanest setup.

#### 1) Create a Neon Postgres database

1. Create a Neon project at [neon.tech](https://neon.tech).
2. In Neon, create a database (for example: `packetpath`).
3. Copy the connection string and save it as your production `DATABASE_URL`.
   - Prefer pooled connection string for app traffic.
   - Keep SSL enabled (`sslmode=require`) in production.

#### 2) Create a Render Web Service from this repo

1. Push this repo to GitHub.
2. In Render, create a **Web Service** from the repo.
3. Render will detect the included `Dockerfile`; keep **Environment = Docker**.
4. Set environment variables in Render:
   - `DATABASE_URL` = Neon connection string
   - `NODE_ENV` = `production`
   - `PORT` = `8080` (Render usually injects `PORT`, but setting this is fine)
   - Optional SMTP vars if you want email delivery (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_FROM_NAME`)
5. Deploy the service.

#### 3) Run schema + seed against Neon

From your local machine (or CI), point to Neon and run:

```bash
DATABASE_URL='postgresql://...neon...' pnpm db:push
DATABASE_URL='postgresql://...neon...' pnpm db:seed
```

> Tip: You can also run one-off jobs in Render Shell/Jobs if you prefer not to run migrations from local.

#### 4) Verify production health

- Check `GET /api/health` on your Render URL.
- Log in with seeded credentials.
- Create a test case and run one signature flow.

### Option B: Fly.io

```bash
# Install flyctl: https://fly.io/docs/flyctl/install/
fly launch --no-deploy
fly postgres create --name packetpath-db
fly postgres attach packetpath-db
fly deploy
# Seed the database
fly ssh console -C "DATABASE_URL=\$DATABASE_URL node scripts/dist/seed.mjs"
```

### Option C: Any Docker Host

```bash
# Build the image
docker build -t packetpath .

# Run with your own PostgreSQL
docker run -p 8080:8080 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/packetpath \
  -e PORT=8080 \
  packetpath
```

### Production Build (without Docker)

```bash
pnpm install
pnpm --filter @workspace/packet-path run build
pnpm --filter @workspace/api-server run build
cp -r artifacts/packet-path/dist/public artifacts/api-server/dist/public
DATABASE_URL=... PORT=8080 node artifacts/api-server/dist/index.mjs
```

## SMTP Configuration (Optional)

To enable email notifications for signature requests, set these environment variables:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@example.com
SMTP_PASS=your-app-password
SMTP_FROM=no-reply@occumed.com
SMTP_FROM_NAME=Occu-Med PacketPath
```

You can also configure SMTP from the **Email Settings** page in the admin UI.
