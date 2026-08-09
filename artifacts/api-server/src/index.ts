import path from "path";
import { existsSync } from "fs";
import { logger } from "./lib/logger";
import { initSentry } from "./lib/sentry";
import { processWebhookRetries } from "./lib/webhooks";
import { validateEnvironment } from "./lib/env";
import { startScheduler } from "./lib/scheduler";
import { validateFrontendBuild } from "./lib/frontend-build";
import { ensureBuiltInMedicalForms } from "./lib/builtin-medical-forms";

const port = Number(process.env["PORT"] || "8080");

async function main() {
  validateEnvironment();

  // Initialize Sentry BEFORE importing app (so it can instrument Express)
  await initSentry();

  // Built-in questionnaires are versioned in source control and installed
  // idempotently. This makes a newly deployed medical-history form available
  // without destructive seed scripts or manual production DB edits.
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
        index: true,
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
