import path from "path";
import { existsSync, readFileSync } from "fs";

export interface FrontendBuildValidation {
  indexPath: string;
  assetPaths: string[];
}

function normalizeAssetPath(assetUrl: string): string | null {
  const withoutQuery = assetUrl.split(/[?#]/, 1)[0];
  if (!withoutQuery || /^(?:https?:)?\/\//i.test(withoutQuery) || withoutQuery.startsWith("data:")) {
    return null;
  }

  return withoutQuery.replace(/^\/+/, "");
}

/**
 * Validate the Vite production artifact before Express starts serving it.
 *
 * A raw source index.html references /src/main.tsx. Serving that file from a
 * production web server produces the exact symptom we want to prevent: the
 * dark HTML shell appears, but React never mounts. We also verify that every
 * local script/stylesheet referenced by the built index actually exists so a
 * bad deploy fails loudly instead of becoming a blank page.
 */
export function validateFrontendBuild(clientDir: string): FrontendBuildValidation {
  const indexPath = path.join(clientDir, "index.html");
  if (!existsSync(indexPath)) {
    throw new Error(`Frontend build is missing index.html at ${indexPath}`);
  }

  const html = readFileSync(indexPath, "utf8");

  if (/\bsrc=["']\/src\/main\.tsx["']/i.test(html)) {
    throw new Error(
      "Frontend deployment contains the Vite source index instead of a production build. " +
        "Run the packet-path Vite build and serve dist/public.",
    );
  }

  const assetUrls = new Set<string>();
  for (const match of html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)) {
    assetUrls.add(match[1]);
  }
  for (const match of html.matchAll(/<link\b[^>]*\brel=["'][^"']*stylesheet[^"']*["'][^>]*\bhref=["']([^"']+)["'][^>]*>/gi)) {
    assetUrls.add(match[1]);
  }
  // Also handle href appearing before rel.
  for (const match of html.matchAll(/<link\b[^>]*\bhref=["']([^"']+)["'][^>]*\brel=["'][^"']*stylesheet[^"']*["'][^>]*>/gi)) {
    assetUrls.add(match[1]);
  }

  const assetPaths: string[] = [];
  for (const assetUrl of assetUrls) {
    const relative = normalizeAssetPath(assetUrl);
    if (!relative) continue;

    const assetPath = path.join(clientDir, relative);
    assetPaths.push(assetPath);
    if (!existsSync(assetPath)) {
      throw new Error(`Frontend build references a missing asset: ${assetUrl} (${assetPath})`);
    }
  }

  if (assetPaths.length === 0) {
    throw new Error("Frontend build index.html does not reference any local production assets.");
  }

  return { indexPath, assetPaths };
}
