import { describe, expect, it } from "vitest";
import { MEDICAL_SOURCE_REGISTRY } from "./medical-source-registry";

describe("medical source registry", () => {
  it("contains one uniquely fingerprinted entry for every built-in source family", () => {
    expect(MEDICAL_SOURCE_REGISTRY).toHaveLength(12);
    expect(new Set(MEDICAL_SOURCE_REGISTRY.map(entry => entry.sourceFamily)).size).toBe(12);
    expect(new Set(MEDICAL_SOURCE_REGISTRY.map(entry => entry.sha256)).size).toBe(12);
  });

  it("uses strict SHA-256 fingerprints and positive page counts", () => {
    for (const entry of MEDICAL_SOURCE_REGISTRY) {
      expect(entry.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(entry.pageCount).toBeGreaterThan(0);
      expect(["acroform", "overlay"]).toContain(entry.strategy);
      expect(entry.mappingVersion).toBeGreaterThan(0);
    }
  });

  it("classifies the supplied fillable sources as AcroForm and non-fillable sources as overlay", () => {
    const strategy = Object.fromEntries(MEDICAL_SOURCE_REGISTRY.map(entry => [entry.sourceFamily, entry.strategy]));
    expect(strategy["ds1843"]).toBe("acroform");
    expect(strategy["ds6561"]).toBe("acroform");
    expect(strategy["post-2-252-peace-officer"]).toBe("acroform");
    expect(strategy["post-2-264-dispatcher"]).toBe("acroform");
    expect(strategy["occumed-sedentary"]).toBe("acroform");
    expect(strategy["dd2807-1"]).toBe("overlay");
    expect(strategy["dd2795"]).toBe("overlay");
    expect(strategy["polar-1700"]).toBe("overlay");
  });
});
