import type { Request, Response } from "express";
import { forwardSecurityEvent } from "../lib/siem";
import { logger } from "../lib/logger";

export async function cspReportHandler(req: Request, res: Response): Promise<void> {
  const report = req.body?.["csp-report"] ?? req.body;

  await forwardSecurityEvent({
    type: "csp_violation_reported",
    category: "runtime_hardening",
    severity: "medium",
    ipAddress: req.ip,
    details: {
      report,
      userAgent: req.get("user-agent") ?? null,
      path: req.path,
    },
  }).catch(err => {
    logger.error({ err }, "Failed to record CSP violation report");
  });

  res.status(204).end();
}
