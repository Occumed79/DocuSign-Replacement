import fs from "node:fs";
import path from "node:path";

const distDir = path.resolve(import.meta.dirname, "..", "dist", "public");
const indexPath = path.join(distDir, "index.html");

if (!fs.existsSync(indexPath)) {
  throw new Error(`PacketPath build finalizer could not find ${indexPath}`);
}

let html = fs.readFileSync(indexPath, "utf8");

// Production is intentionally emitted as a single IIFE bundle. Vite still
// writes its HTML entry as type=module, so convert that tag to a normal deferred
// classic script. This removes WebKit's module graph loader from startup.
const moduleScriptPattern = /<script\s+type=["']module["']([^>]*?)src=["']([^"']+\.js)["']([^>]*)><\/script>/i;
const match = html.match(moduleScriptPattern);
if (!match) {
  throw new Error("PacketPath classic-build finalizer did not find the Vite module entry script");
}

const src = match[2];
html = html.replace(moduleScriptPattern, `<script defer src="${src}"></script>`);

if (/type=["']module["']/i.test(html)) {
  throw new Error("PacketPath production HTML still contains a module script after finalization");
}

fs.writeFileSync(indexPath, html);
console.log(`PacketPath classic browser bundle finalized: ${src}`);
