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

### 5. Seed the Database (Local Development Only)

```bash
DATABASE_URL=postgresql://packetpath:packetpath@localhost:5432/packetpath pnpm db:seed
```

> ⚠️ Development-only: seeded demo credentials are for local use only. Do not run `db:seed` in production.

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

### Local Demo Credentials (Development Only)

| Email | Password | Role |
|-------|----------|------|
| admin@occumed.com | admin123 | Admin |
| examqa@occumed.com | admin123 | Exam QA |
| reviewer@occumed.com | admin123 | Reviewer |

> ⚠️ These credentials are for local development only. In production, use `/setup` to create the first admin and never rely on seeded accounts.

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

Do these steps in order exactly.

#### 0) One-time local setup

```bash
pnpm install
```

#### 1) Create Neon database

1. Create a Neon project at [neon.tech](https://neon.tech).
2. Create a database named `packetpath`.
3. Copy the Neon **pooled** connection string and keep `sslmode=require`.
4. Save that string as your production `DATABASE_URL`.

#### 2) Push schema into Neon (no seed in production)

Run this command from this repo on your machine:

```bash
DATABASE_URL='postgresql://<neon-connection-string>' pnpm db:push
```

Do **not** run `pnpm db:seed` in production environments.

#### 3) Deploy app on Render

1. Push this repo to GitHub.
2. In Render, create a new **Web Service** from the repo.
3. Select **Docker** environment (Render will use this repo's `Dockerfile`).
4. In Render environment variables, set:
   - `DATABASE_URL` = your Neon connection string
   - `NODE_ENV` = `production`
   - `PORT` = `8080`
5. Click **Deploy**.

#### 4) Verify deployment

After Render says deploy succeeded:

1. Open: `https://<your-render-service>.onrender.com/api/health`
2. Confirm response is healthy.
3. Open app URL and complete initial setup at `/setup` to create the first admin user.
4. Log in with that admin account, then create one test case and complete one signature flow.

#### 5) Optional email setup (SMTP)

Add these Render env vars only if you want outbound emails:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `SMTP_FROM_NAME`

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


### Troubleshooting Render Build Failures

If Render fails in `vite build` with errors like `Unterminated regular expression` near JSX lines (often around `</motion.div>`), the branch usually contains unresolved merge markers or malformed JSX from a conflict resolution.

Run these checks locally before deploying:

```bash
# 1) Detect unresolved merge markers
rg -n "^(<<<<<<<|=======|>>>>>>>)" artifacts/packet-path/src artifacts/api-server/src

# 2) Reproduce frontend build error locally
pnpm --filter @workspace/packet-path run build

# 3) Reproduce full workspace type/build checks
pnpm run typecheck
pnpm build
```

If step 1 returns matches, open those files and remove conflict markers, keeping only valid TS/TSX code, then commit and redeploy.

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
