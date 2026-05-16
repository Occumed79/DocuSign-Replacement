import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";

export interface NoncedResponseLocals {
  cspNonce?: string;
}

export function cspNonceMiddleware(req: Request, res: Response, next: NextFunction) {
  const nonce = crypto.randomBytes(16).toString("base64");
  (res.locals as NoncedResponseLocals).cspNonce = nonce;
  res.setHeader("X-CSP-Nonce", nonce);
  next();
}
