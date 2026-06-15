# PacketPath Production Deployment Checklist

## Render Service Type
Use:
- Web Service
- Docker runtime
- Port: 8080

The repository already includes a Dockerfile and render.yaml.

---

## Required Render Environment Variables

### Database
DATABASE_URL=

Use the Neon pooled connection string.
Keep sslmode=require.

---

### Application
NODE_ENV=production
PORT=8080
APP_BASE_URL=https://your-service.onrender.com
ALLOWED_ORIGINS=https://your-service.onrender.com

---

### Security
SESSION_SECRET=
DB_ENCRYPTION_KEY=
MFA_ENCRYPTION_KEY=
BLIND_INDEX_KEY=

**CRITICAL**: These keys must be exactly 64 hexadecimal characters (32 bytes) for AES-256-GCM encryption compliance.

Generate all secrets at once using the provided script:

```bash
pnpm run generate-secrets
```

Or generate individually:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy each generated value to the corresponding environment variable in Render.

---

## IMPORTANT

**RUN_DB_PUSH_ON_STARTUP Warning:**

- `RUN_DB_PUSH_ON_STARTUP=true` is set in render.yaml for initial deployment convenience
- For production/compliance deployments, this should be set to `false` after initial schema setup
- Use controlled migrations for schema changes in production environments
- Automatic schema pushes on every startup are not recommended for HIPAA-compliant deployments

---

## Post-Deploy Verification

### 1. Health Check
Open:
/api/health

Expected:
Healthy JSON response.

---

### 2. Frontend
Open root domain.

Expected:
Login screen loads.

---

### 3. Authentication
Test seeded admin login.

Recommended:
Immediately replace seeded passwords.

---

### 4. Signature Flow
Create:
- test template
- test signature request
- test recipient

Verify:
- public signing link works
- signature completion works
- audit log entries appear
- PDF generation works

---

## Recommended Immediate Security Improvements

1. Make repository private
2. Remove default seeded passwords
3. Configure SMTP securely
4. Restrict admin roles
5. Add backup strategy for Neon
6. Add object storage for signed PDFs
