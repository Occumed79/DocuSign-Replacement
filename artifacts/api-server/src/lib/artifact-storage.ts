import { logger } from "./logger";

export interface StoredArtifact {
  stored: boolean;
  provider: "supabase" | "disabled";
  path: string;
  publicUrl?: string | null;
  error?: string;
}

function requiredSupabaseStorageEnv() {
  return {
    url: process.env.SUPABASE_URL?.replace(/\/$/, ""),
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    bucket: process.env.SUPABASE_STORAGE_BUCKET ?? "packetpath-finalized-artifacts",
  };
}

export function isArtifactStorageConfigured(): boolean {
  const env = requiredSupabaseStorageEnv();
  return Boolean(env.url && env.serviceRoleKey && env.bucket);
}

export async function storeFinalizedPdfArtifact(params: {
  requestId: number;
  pdfBuffer: Buffer;
  finalPdfHash: string;
}): Promise<StoredArtifact> {
  const env = requiredSupabaseStorageEnv();
  const objectPath = `signature-requests/${params.requestId}/final-${params.finalPdfHash}.pdf`;

  if (!env.url || !env.serviceRoleKey || !env.bucket) {
    return {
      stored: false,
      provider: "disabled",
      path: `hash-only://${objectPath}`,
      error: "Supabase artifact storage is not configured",
    };
  }

  const uploadUrl = `${env.url}/storage/v1/object/${encodeURIComponent(env.bucket)}/${objectPath}`;

  try {
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.serviceRoleKey}`,
        apikey: env.serviceRoleKey,
        "Content-Type": "application/pdf",
        "x-upsert": "false",
        "Cache-Control": "private, max-age=31536000, immutable",
      },
      body: params.pdfBuffer,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Supabase upload failed: ${response.status} ${response.statusText} ${body}`.trim());
    }

    return {
      stored: true,
      provider: "supabase",
      path: `supabase://${env.bucket}/${objectPath}`,
      publicUrl: null,
    };
  } catch (err: any) {
    logger.error({ err, requestId: params.requestId }, "Failed to store finalized PDF artifact");
    return {
      stored: false,
      provider: "supabase",
      path: `hash-only://${objectPath}`,
      error: err?.message ?? "Unknown artifact storage error",
    };
  }
}
