import type { Request, Response } from "express";
import type { AuthorizedUser } from "./rbac";
import { readStepUpTokenFromHeaders, verifyStepUpToken } from "./step-up-auth";

export function isStepUpEnforcementEnabled(): boolean {
  return process.env.REQUIRE_WEBAUTHN_FOR_PRIVILEGED_ACTIONS === "true";
}

export async function requirePrivilegedStepUp(params: {
  req: Request;
  res: Response;
  user: AuthorizedUser;
  purpose: string;
  consume?: boolean;
}): Promise<boolean> {
  if (!isStepUpEnforcementEnabled()) {
    return true;
  }

  const token = readStepUpTokenFromHeaders(params.req.headers as Record<string, string | string[] | undefined>);
  const verified = await verifyStepUpToken({
    userId: params.user.id,
    purpose: params.purpose,
    token,
    consume: params.consume ?? true,
  });

  if (!verified) {
    params.res.status(403).json({
      error: "WebAuthn step-up authentication required",
      stepUpRequired: true,
      purpose: params.purpose,
    });
    return false;
  }

  return true;
}
