import path from "path";
import { existsSync } from "fs";
import { logger } from "./lib/logger";
import { initSentry } from "./lib/sentry";
import { processWebhookRetries } from "./lib/webhooks";

const port = Number(process.env["PORT"] || "8080");

async function main() {
  // Initialize Sentry BEFORE importing app (so it can instrument Express)
  await initSentry();

  // Dynamic import of app after Sentry is initialized
  const { default: app } = await import("./app.js");
  const express = (await import("express")).default;

  // In production, serve the built frontend static files
  const clientDir = path.resolve(__dirname, "public");
  if (existsSync(clientDir)) {
    app.use(express.static(clientDir));
    // SPA fallback: serve index.html for all non-API routes
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(path.join(clientDir, "index.html"));
    });
    logger.info({ clientDir }, "Serving frontend static files");
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

  logger.info("PacketPath API server started");
}

main().catch(err => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
