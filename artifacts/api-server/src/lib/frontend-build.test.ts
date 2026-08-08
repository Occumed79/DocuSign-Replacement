import { afterEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { validateFrontendBuild } from "./frontend-build";

const tempDirs: string[] = [];

function makeDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "packetpath-frontend-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("validateFrontendBuild", () => {
  it("rejects the raw Vite source shell", () => {
    const dir = makeDir();
    fs.writeFileSync(
      path.join(dir, "index.html"),
      '<div id="root"></div><script type="module" src="/src/main.tsx"></script>',
    );

    expect(() => validateFrontendBuild(dir)).toThrow(/source index/i);
  });

  it("rejects a built index that references a missing asset", () => {
    const dir = makeDir();
    fs.writeFileSync(
      path.join(dir, "index.html"),
      '<link rel="stylesheet" href="/assets/app.css"><script type="module" src="/assets/app.js"></script>',
    );

    expect(() => validateFrontendBuild(dir)).toThrow(/missing asset/i);
  });

  it("accepts a production index when referenced assets exist", () => {
    const dir = makeDir();
    fs.mkdirSync(path.join(dir, "assets"));
    fs.writeFileSync(path.join(dir, "assets", "app.css"), "body{}\n");
    fs.writeFileSync(path.join(dir, "assets", "app.js"), "console.log('ok');\n");
    fs.writeFileSync(
      path.join(dir, "index.html"),
      '<link rel="stylesheet" href="/assets/app.css"><script type="module" src="/assets/app.js"></script>',
    );

    const result = validateFrontendBuild(dir);
    expect(result.assetPaths).toHaveLength(2);
  });
});
