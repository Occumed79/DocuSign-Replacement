import path from "path";
import { existsSync } from "fs";
import app from "./app";
import { logger } from "./lib/logger";
import express from "express";

const port = Number(process.env["PORT"] || "8080");

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

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
