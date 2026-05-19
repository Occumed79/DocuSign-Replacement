import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, integrityLedgerTable } from "@workspace/db";
import { requirePermission } from "../lib/rbac";
import { verifyIntegrityLedgerChain } from "../lib/integrity-ledger";

const router: IRouter = Router();

router.get("/signature-requests/:id/integrity-chain", async (req, res): Promise<void> => {
  const user = await requirePermission(req, res, "signature:verify_evidence");
  if (!user) return;

  const requestId = Number(req.params.id);
  const chain = await verifyIntegrityLedgerChain(requestId);
  res.json(chain);
});

router.get("/signature-requests/:id/integrity-ledger", async (req, res): Promise<void> => {
  const user = await requirePermission(req, res, "signature:verify_evidence");
  if (!user) return;

  const requestId = Number(req.params.id);
  const entries = await db
    .select()
    .from(integrityLedgerTable)
    .where(eq(integrityLedgerTable.requestId, requestId))
    .orderBy(integrityLedgerTable.createdAt, integrityLedgerTable.id);

  res.json({ requestId, entries });
});

export default router;
