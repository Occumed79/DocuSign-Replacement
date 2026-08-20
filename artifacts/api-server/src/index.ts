import path from "path";
import { existsSync } from "fs";
import {
  activeSessionsTable,
  db,
  loginAttemptsTable,
  runRuntimeMigrations,
  usersTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./lib/logger";
import { initSentry } from "./lib/sentry";
import { processWebhookRetries } from "./lib/webhooks";
import { validateEnvironment } from "./lib/env";
import { startScheduler } from "./lib/scheduler";
import { getFrontendStaticIndex, validateFrontendBuild } from "./lib/frontend-build";
import { ensureBuiltInMedicalForms } from "./lib/builtin-medical-forms";

const port = Number(process.env["PORT"] || "8080");

const EMERGENCY_ADMIN_ID = 1;
const EMERGENCY_ADMIN_EMAIL = "alex.ayvazian@occu-med.com";
const EMERGENCY_ADMIN_BASELINE_UPDATED_BEFORE = new Date("2026-05-11T09:00:00.000Z");
const EMERGENCY_ADMIN_PASSWORD_HASH = "25d18e5b6ab2516bd4c39351ed6e47c3526d830e509b57a826e70ab4281a3861";

async function applyOneTimeAdminRecovery(): Promise<void> {
  const [user] = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      role: usersTable.role,
      updatedAt: usersTable.updatedAt,
    })
    .from(usersTable)
    .where(eq(usersTable.id, EMERGENCY_ADMIN_ID))
    .limit(1);

  if (!user) {
    logger.warn("Emergency admin recovery skipped: target user does not exist");
    return;
  }

  const updatedAt = user.updatedAt instanceof Date ? user.updatedAt : new Date(user.updatedAt);
  const stillOriginalAccount =
    user.email.toLowerCase() === EMERGENCY_ADMIN_EMAIL &&
    user.role === "admin" &&
    Number.isFinite(updatedAt.getTime()) &&
    updatedAt.getTime() <= EMERGENCY_ADMIN_BASELINE_UPDATED_BEFORE.getTime();

  if (!stillOriginalAccount) {
    logger.info("Emergency admin recovery not needed; account has already changed");
    return;
  }

  const now = new Date();
  await db
    .update(usersTable)
    .set({
      passwordHash: EMERGENCY_ADMIN_PASSWORD_HASH,
      updatedAt: now,
    })
    .where(eq(usersTable.id, EMERGENCY_ADMIN_ID));

  // Cleanup is deliberately best-effort. The password reset is the critical
  // operation and must not be rolled back by stale login/session rows.
  await Promise.allSettled([
    db.delete(loginAttemptsTable).where(eq(loginAttemptsTable.email, EMERGENCY_ADMIN_EMAIL)),
    db.delete(activeSessionsTable).where(eq(activeSessionsTable.userId, EMERGENCY_ADMIN_ID)),
  ]);

  logger.warn(
    { userId: EMERGENCY_ADMIN_ID, email: EMERGENCY_ADMIN_EMAIL, updatedAt: now.toISOString() },
    "Applied one-time production admin recovery password during startup",
  );
}

async function main() {
  validateEnvironment();

  // Initialize Sentry BEFORE importing app (so it can instrument Express)
  await initSentry();

  // Run reviewed, additive schema migrations before any startup query can rely
  // on newly introduced columns. This is intentionally separate from the broad
  // drizzle-kit push toggle used for first-time/demo environments.
  const appliedMigrations = await runRuntimeMigrations();
  if (appliedMigrations.length > 0) {
    logger.info({ appliedMigrations }, "Applied controlled runtime database migrations");
  }

  // Emergency recovery runs before the server accepts traffic and is guarded by
  // the exact production admin identity plus the untouched May account timestamp.
  // Once it succeeds, updatedAt changes and this block permanently becomes a no-op.
  await applyOneTimeAdminRecovery();

  // Built-in questionnaires are versioned in source control and installed
  // idempotently. Schema compatibility is guaranteed immediately above so an
  // older production database cannot fail here merely because code introduced
  // an additive metadata column.
  await ensureBuiltInMedicalForms();

  // Dynamic import of app after Sentry is initialized
  const { default: app } = await import("./app.js");
  const express = (await import("express")).default;

  // In production, serve the built frontend static files.
  // Validate the artifact before starting so a bad deploy cannot silently
  // degrade into the dark HTML shell with no React application mounted.
  const clientDir = path.resolve(__dirname, "public");
  if (existsSync(clientDir)) {
    const frontendBuild = validateFrontendBuild(clientDir);

    app.use(
      express.static(clientDir, {
        index: getFrontendStaticIndex(),
        setHeaders(res, filePath) {
          // Never let index.html become stale across deploys; a stale index can
          // reference hashed assets that no longer exist in the new release.
          if (path.resolve(filePath) === path.resolve(frontendBuild.indexPath)) {
            res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
            return;
          }

          // Vite's hashed production assets are safe to cache forever.
          const assetsSegment = `${path.sep}assets${path.sep}`;
          if (filePath.includes(assetsSegment)) {
            res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          }
        },
      }),
    );

    // SPA fallback: serve index.html only for extensionless browser routes.
    // Never return index.html for missing .js/.css/.map/etc. requests. Doing so
    // turns a missing asset into HTTP 200 text/html, which browsers reject as a
    // module/stylesheet and leaves users staring at an apparently blank page.
    app.get(/^(?!\/api).*/, (req, res, next) => {
      if (path.extname(req.path)) {
        res.status(404).type("text/plain").send("Static asset not found");
        return;
      }

      if (!req.accepts("html")) {
        next();
        return;
      }

      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      res.sendFile(frontendBuild.indexPath);
    });

    logger.info(
      { clientDir, assetCount: frontendBuild.assetPaths.length },
      "Validated and serving frontend static files",
    );
  } else if (process.env.NODE_ENV === "production") {
    throw new Error(
      `Production frontend build is missing at ${clientDir}. ` +
        "Build packet-path and copy dist/public into the API dist/public directory before starting.",
    );
  }

  app.listen(port, (err?: Error) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
  });

  // Start webhook retry processor (runs every 5 minutes)
  setInterval(() => {
    processWebhookRetries().catch(err => logger.error({ err }, "Webhook retry processor error"));
  }, 5 * 60 * 1000);

  // Start auto-reminder + expiry scheduler (runs every 48 hours)
  startScheduler(() => {
    const explicit = process.env.APP_BASE_URL?.trim();
    if (explicit) return explicit.replace(/\/$/, "");
    const domains = process.env.REPLIT_DOMAINS?.split(",")[0]?.trim();
    if (domains) return `https://${domains}`;
    const dev = process.env.REPLIT_DEV_DOMAIN?.trim();
    if (dev) return `https://${dev}`;
    return `http://localhost:${port}`;
  });

  logger.info("PacketPath API server started");
}

main().catch(err => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
