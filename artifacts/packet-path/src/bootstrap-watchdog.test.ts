import { describe, expect, it } from "vitest";
import { BOOTSTRAP_WATCHDOG_MS } from "./bootstrap-watchdog";

describe("PacketPath bootstrap watchdog", () => {
  it("reports a stuck shell quickly enough to be actionable", () => {
    expect(BOOTSTRAP_WATCHDOG_MS).toBeLessThanOrEqual(8_000);
  });
});
