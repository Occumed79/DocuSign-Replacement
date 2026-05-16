/**
 * Sentry error monitoring integration
 * Captures unhandled errors and performance data from the Express API server.
 *
 * Required environment variable:
 *   SENTRY_DSN — Your Sentry project DSN (from sentry.io project settings)
 *
 * Optional:
 *   SENTRY_ENVIRONMENT — "production" | "staging" | "development" (default: NODE_ENV)
 *   SENTRY_TRACES_SAMPLE_RATE — 0.0–1.0 (default: 0.1 in production, 1.0 in dev)
 *
 * Installation (add to api-server/package.json dependencies):
 *   "@sentry/node": "^8"
 *
 * Usage: import { initSentry, sentryRequestHandler, sentryErrorHandler } from './lib/sentry'
 */

import { logger } from "./logger.js";

export interface SentryConfig {
  dsn: string;
  environment: string;
  tracesSampleRate: number;
  release?: string;
}

let sentryInitialized = false;
let Sentry: any = null;

function getSentryConfig(): SentryConfig | null {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return null;

  const environment = process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? "development";
  const tracesSampleRate = Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? (environment === "production" ? "0.1" : "1.0"));
  const release = process.env.SENTRY_RELEASE ?? process.env.npm_package_version;

  return { dsn, environment, tracesSampleRate, release };
}

/**
 * Initialize Sentry. Call this before creating the Express app.
 * Gracefully no-ops if SENTRY_DSN is not set or @sentry/node is not installed.
 */
export async function initSentry(): Promise<void> {
  const config = getSentryConfig();
  if (!config) {
    logger.info("Sentry DSN not configured — error monitoring disabled. Set SENTRY_DSN to enable.");
    return;
  }

  try {
    const dynamicImport = new Function("m", "return import(m)") as (m: string) => Promise<any>;
    Sentry = await dynamicImport("@sentry/node");
    Sentry.init({
      dsn: config.dsn,
      environment: config.environment,
      tracesSampleRate: config.tracesSampleRate,
      release: config.release,
      integrations: [
        Sentry.httpIntegration(),
        Sentry.expressIntegration(),
      ],
      // Scrub PHI from error reports
      beforeSend(event: any) {
        // Remove request body from error reports (may contain PHI)
        if (event.request?.data) {
          event.request.data = "[Filtered - may contain PHI]";
        }
        // Scrub common PHI fields from extra data
        if (event.extra) {
          const phiFields = ["patientName", "patient_name", "dob", "ssn", "email", "phone"];
          for (const field of phiFields) {
            if (event.extra[field]) event.extra[field] = "[Filtered]";
          }
        }
        return event;
      },
    });
    sentryInitialized = true;
    logger.info({ environment: config.environment }, "Sentry error monitoring initialized");
  } catch (err: any) {
    if (err?.code === "ERR_MODULE_NOT_FOUND" || err?.message?.includes("Cannot find module")) {
      logger.warn("@sentry/node not installed. Run: pnpm --filter @workspace/api-server add @sentry/node");
    } else {
      logger.error({ err }, "Failed to initialize Sentry");
    }
  }
}

/**
 * Express middleware: Sentry request handler (must be FIRST middleware)
 * Captures request context for error reports.
 */
export function sentryRequestHandler() {
  return (req: any, res: any, next: any) => {
    if (!sentryInitialized || !Sentry) return next();
    return Sentry.expressRequestHandler()(req, res, next);
  };
}

/**
 * Express error handler: Sentry error handler (must be AFTER all routes, BEFORE other error handlers)
 * Captures unhandled errors.
 */
export function sentryErrorHandler() {
  return (err: any, req: any, res: any, next: any) => {
    if (!sentryInitialized || !Sentry) return next(err);
    return Sentry.expressErrorHandler()(err, req, res, next);
  };
}

/**
 * Manually capture an exception (e.g., in catch blocks for non-fatal errors)
 */
export function captureException(err: unknown, context?: Record<string, unknown>): void {
  if (!sentryInitialized || !Sentry) {
    logger.error({ err, context }, "Unhandled error (Sentry not configured)");
    return;
  }
  Sentry.withScope((scope: any) => {
    if (context) scope.setExtras(context);
    Sentry.captureException(err);
  });
}

/**
 * Manually capture a message (e.g., for warnings or important events)
 */
export function captureMessage(message: string, level: "info" | "warning" | "error" = "info"): void {
  if (!sentryInitialized || !Sentry) return;
  Sentry.captureMessage(message, level);
}

export function isSentryEnabled(): boolean {
  return sentryInitialized;
}
