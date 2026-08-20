import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const appPath = fileURLToPath(new URL("./app.ts", import.meta.url));
const appSource = fs.readFileSync(appPath, "utf8");

describe("production CSP bootstrap policy", () => {
  it("allows the same-origin Vite module bundle without strict-dynamic nonce gating", () => {
    expect(appSource).toContain('scriptSrc: ["\'self\'"]');
    expect(appSource).not.toContain('"\'strict-dynamic\'"');
    expect(appSource).not.toContain("requireTrustedTypesFor");
  });

  it("allows the Google Fonts stylesheet used by index.html", () => {
    expect(appSource).toContain('"https://fonts.googleapis.com"');
  });
});
