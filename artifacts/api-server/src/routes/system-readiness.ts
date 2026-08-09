import { Router, type IRouter } from "express";
import { requireAdmin } from "../lib/require-auth";
import { isArtifactStorageConfigured } from "../lib/artifact-storage";
import { getDataSensitivityMode } from "../lib/env";
import { isMedicalQuestionnaireEmailConfigured } from "../lib/medical-questionnaire-email";

const router: IRouter = Router();

router.get("/system/readiness", async (req, res): Promise<void> => {
  const userId = await requireAdmin(req, res);
  if (!userId) return;

  const checks = {
    database: {
      configured: Boolean(process.env.DATABASE_URL),
      required: true,
      description: "Primary PostgreSQL database",
    },
    smtp: {
      configured: isMedicalQuestionnaireEmailConfigured(),
      required: true,
      description: "Recipient invitation and reminder email delivery",
    },
    sentry: {
      configured: Boolean(process.env.SENTRY_DSN?.trim()),
      required: false,
      description: "Production error telemetry",
    },
    artifactStorage: {
      configured: isArtifactStorageConfigured(),
      required: false,
      description: "Durable finalized PDF artifact storage",
    },
    appBaseUrl: {
      configured: Boolean(process.env.APP_BASE_URL?.trim()),
      required: true,
      description: "Absolute public URL used in recipient links",
    },
    allowedOrigins: {
      configured: Boolean(process.env.ALLOWED_ORIGINS?.trim()),
      required: true,
      description: "Production CORS origin boundary",
    },
    encryption: {
      configured: Boolean(
        process.env.DB_ENCRYPTION_KEY?.trim()
        && process.env.MFA_ENCRYPTION_KEY?.trim()
        && process.env.BLIND_INDEX_KEY?.trim(),
      ),
      required: true,
      description: "Database, MFA, and blind-index key material",
    },
  };

  const requiredChecks = Object.values(checks).filter(check => check.required);
  const requiredReady = requiredChecks.every(check => check.configured);

  res.setHeader("Cache-Control", "private, no-store");
  res.json({
    requiredReady,
    dataSensitivityMode: getDataSensitivityMode(),
    runDbPushOnStartup: process.env.RUN_DB_PUSH_ON_STARTUP === "true",
    environment: process.env.NODE_ENV ?? "development",
    checks,
  });
});

export default router;
