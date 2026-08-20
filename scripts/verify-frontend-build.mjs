import fs from "node:fs";
import path from "node:path";

const clientDir = path.resolve(process.argv[2] || "artifacts/packet-path/dist/public");
const indexPath = path.join(clientDir, "index.html");

function fail(message) {
  console.error(`Frontend build verification failed: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(indexPath)) {
  fail(`missing ${indexPath}`);
}

const html = fs.readFileSync(indexPath, "utf8");

if (/\bsrc=["']\/src\/main\.tsx["']/i.test(html)) {
  fail("index.html still references /src/main.tsx; this is the source shell, not a Vite production build");
}

const localAssets = new Set();
for (const match of html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)) {
  localAssets.add(match[1]);
}
for (const match of html.matchAll(/<link\b[^>]*\bhref=["']([^"']+)["'][^>]*\brel=["'][^"']*stylesheet[^"']*["'][^>]*>/gi)) {
  localAssets.add(match[1]);
}
for (const match of html.matchAll(/<link\b[^>]*\brel=["'][^"']*stylesheet[^"']*["'][^>]*\bhref=["']([^"']+)["'][^>]*>/gi)) {
  localAssets.add(match[1]);
}

const checked = [];
for (const assetUrl of localAssets) {
  const clean = assetUrl.split(/[?#]/, 1)[0];
  if (!clean || /^(?:https?:)?\/\//i.test(clean) || clean.startsWith("data:")) continue;

  const isExpectedRootAsset = clean === "/bootstrap-recovery.js" || clean.startsWith("/assets/");
  if (!isExpectedRootAsset) {
    fail(`production index references an unexpected off-root asset URL: ${assetUrl}`);
  }

  const assetPath = path.join(clientDir, clean.replace(/^\/+/, ""));
  checked.push(assetPath);
  if (!fs.existsSync(assetPath)) {
    fail(`index.html references missing asset ${assetUrl}`);
  }
}

if (checked.length === 0) {
  fail("index.html does not reference any local production script or stylesheet assets");
}

if (![...localAssets].some(assetUrl => assetUrl.split(/[?#]/, 1)[0] === "/bootstrap-recovery.js")) {
  fail("index.html is missing the pre-React bootstrap recovery script");
}

console.log(`Frontend build verified: ${indexPath} (${checked.length} local assets checked, root asset paths enforced)`);
