import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const appSource = fs.readFileSync(path.resolve(__dirname, "app.ts"), "utf8");

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
