/**
 * White-label branding routes (admin only)
 * GET  /api/branding         — get current (default) branding config
 * PUT  /api/branding         — update branding config
 * GET  /api/branding/public  — public endpoint for signing page to fetch branding
 */

import { Router, type IRouter } from "express";
import { z } from "zod/v4";
import { db } from "@workspace/db";
import { clinicBrandingTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../lib/require-auth";

const router: IRouter = Router();


const BrandingSchema = z.object({
  clinicName: z.string().min(1).max(200),
  logoUrl: z.string().url().nullable().optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  emailFromName: z.string().max(100).optional(),
  emailFromAddress: z.string().email().nullable().optional(),
  emailFooterText: z.string().max(500).nullable().optional(),
  signingPageTagline: z.string().max(200).nullable().optional(),
  faviconUrl: z.string().url().nullable().optional(),
});

async function getDefaultBranding() {
  const [branding] = await db
    .select()
    .from(clinicBrandingTable)
    .where(eq(clinicBrandingTable.isDefault, true))
    .limit(1);
  return branding ?? null;
}

// GET /api/branding — authenticated
router.get("/branding", async (req, res): Promise<void> => {
  const userId = await requireAdmin(req, res);
  if (!userId) return;
  const branding = await getDefaultBranding();
  res.json(branding ?? { clinicName: "Occu-Med Occupational Health", primaryColor: "#2563eb", accentColor: "#7c3aed", emailFromName: "PacketPath" });
});

// GET /api/branding/public — no auth, used by signing page
router.get("/branding/public", async (_req, res): Promise<void> => {
  const branding = await getDefaultBranding();
  // Only expose safe display fields
  if (!branding) {
    res.json({ clinicName: "Occu-Med Occupational Health", primaryColor: "#2563eb", accentColor: "#7c3aed", logoUrl: null, signingPageTagline: null });
    return;
  }
  res.json({
    clinicName: branding.clinicName,
    primaryColor: branding.primaryColor,
    accentColor: branding.accentColor,
    logoUrl: branding.logoUrl,
    faviconUrl: branding.faviconUrl,
    signingPageTagline: branding.signingPageTagline,
  });
});

// PUT /api/branding
router.put("/branding", async (req, res): Promise<void> => {
  const userId = await requireAdmin(req, res);
  if (!userId) return;

  const parsed = BrandingSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid branding data", details: parsed.error.issues }); return; }

  const existing = await getDefaultBranding();

  if (existing) {
    const [updated] = await db
      .update(clinicBrandingTable)
      .set({ ...parsed.data })
      .where(eq(clinicBrandingTable.id, existing.id))
      .returning();
    res.json(updated);
  } else {
    const [created] = await db
      .insert(clinicBrandingTable)
      .values({ ...parsed.data, isDefault: true, createdById: userId })
      .returning();
    res.json(created);
  }
});

export default router;
