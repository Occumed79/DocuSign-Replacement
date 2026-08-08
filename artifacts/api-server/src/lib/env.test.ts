import { describe, it, expect, beforeEach } from "vitest";
import { validateEnvironment, getDataSensitivityMode, isProductionSensitivityMode, isDemoMode } from "./env";

describe("validateEnvironment", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset to original environment before each test
    process.env = { ...originalEnv };
  });

  it("should not throw in development mode", () => {
    process.env.NODE_ENV = "development";
    expect(() => validateEnvironment()).not.toThrow();
  });

  it("should not throw when NODE_ENV is not set", () => {
    delete process.env.NODE_ENV;
    expect(() => validateEnvironment()).not.toThrow();
  });

  describe("production mode", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
    });

    it("should throw when DATABASE_URL is missing", () => {
      delete process.env.DATABASE_URL;
      expect(() => validateEnvironment()).toThrow("DATABASE_URL is required in production");
    });

    it("should throw when SESSION_SECRET is missing", () => {
      delete process.env.SESSION_SECRET;
      expect(() => validateEnvironment()).toThrow("SESSION_SECRET is required in production");
    });

    it("should throw when DB_ENCRYPTION_KEY is missing", () => {
      delete process.env.DB_ENCRYPTION_KEY;
      expect(() => validateEnvironment()).toThrow("DB_ENCRYPTION_KEY is required in production");
    });

    it("should throw when MFA_ENCRYPTION_KEY is missing", () => {
      delete process.env.MFA_ENCRYPTION_KEY;
      expect(() => validateEnvironment()).toThrow("MFA_ENCRYPTION_KEY is required in production");
    });

    it("should throw when BLIND_INDEX_KEY is missing", () => {
      delete process.env.BLIND_INDEX_KEY;
      expect(() => validateEnvironment()).toThrow("BLIND_INDEX_KEY is required in production");
    });

    it("should throw when DB_ENCRYPTION_KEY is a placeholder", () => {
      process.env.DATABASE_URL = "postgresql://test";
      process.env.SESSION_SECRET = "valid-secret";
      process.env.DB_ENCRYPTION_KEY = "change-me";
      process.env.MFA_ENCRYPTION_KEY = "a".repeat(64);
      process.env.BLIND_INDEX_KEY = "b".repeat(64);
      expect(() => validateEnvironment()).toThrow("DB_ENCRYPTION_KEY is required in production");
    });

    it("should throw when DB_ENCRYPTION_KEY is empty string", () => {
      process.env.DATABASE_URL = "postgresql://test";
      process.env.SESSION_SECRET = "valid-secret";
      process.env.DB_ENCRYPTION_KEY = "";
      process.env.MFA_ENCRYPTION_KEY = "a".repeat(64);
      process.env.BLIND_INDEX_KEY = "b".repeat(64);
      expect(() => validateEnvironment()).toThrow("DB_ENCRYPTION_KEY is required in production");
    });

    it("should throw when DB_ENCRYPTION_KEY is not 64 hex chars", () => {
      process.env.DATABASE_URL = "postgresql://test";
      process.env.SESSION_SECRET = "valid-secret";
      process.env.DB_ENCRYPTION_KEY = "not-hex-and-too-short";
      process.env.MFA_ENCRYPTION_KEY = "a".repeat(64);
      process.env.BLIND_INDEX_KEY = "b".repeat(64);
      expect(() => validateEnvironment()).toThrow("DB_ENCRYPTION_KEY must be exactly 64 hexadecimal characters");
    });

    it("should throw when DB_ENCRYPTION_KEY is 63 hex chars", () => {
      process.env.DATABASE_URL = "postgresql://test";
      process.env.SESSION_SECRET = "valid-secret";
      process.env.DB_ENCRYPTION_KEY = "a".repeat(63);
      process.env.MFA_ENCRYPTION_KEY = "a".repeat(64);
      process.env.BLIND_INDEX_KEY = "b".repeat(64);
      expect(() => validateEnvironment()).toThrow("DB_ENCRYPTION_KEY must be exactly 64 hexadecimal characters");
    });

    it("should throw when DB_ENCRYPTION_KEY is 65 hex chars", () => {
      process.env.DATABASE_URL = "postgresql://test";
      process.env.SESSION_SECRET = "valid-secret";
      process.env.DB_ENCRYPTION_KEY = "a".repeat(65);
      process.env.MFA_ENCRYPTION_KEY = "a".repeat(64);
      process.env.BLIND_INDEX_KEY = "b".repeat(64);
      expect(() => validateEnvironment()).toThrow("DB_ENCRYPTION_KEY must be exactly 64 hexadecimal characters");
    });

    it("should throw when DB_ENCRYPTION_KEY contains non-hex characters", () => {
      process.env.DATABASE_URL = "postgresql://test";
      process.env.SESSION_SECRET = "valid-secret";
      process.env.DB_ENCRYPTION_KEY = "g".repeat(64); // 'g' is not hex
      process.env.MFA_ENCRYPTION_KEY = "a".repeat(64);
      process.env.BLIND_INDEX_KEY = "b".repeat(64);
      expect(() => validateEnvironment()).toThrow("DB_ENCRYPTION_KEY must be exactly 64 hexadecimal characters");
    });

    it("should throw when MFA_ENCRYPTION_KEY is not 64 hex chars", () => {
      process.env.DATABASE_URL = "postgresql://test";
      process.env.SESSION_SECRET = "valid-secret";
      process.env.DB_ENCRYPTION_KEY = "a".repeat(64);
      process.env.MFA_ENCRYPTION_KEY = "not-hex-and-too-short";
      process.env.BLIND_INDEX_KEY = "b".repeat(64);
      expect(() => validateEnvironment()).toThrow("MFA_ENCRYPTION_KEY must be exactly 64 hexadecimal characters");
    });

    it("should throw when BLIND_INDEX_KEY is not 64 hex chars", () => {
      process.env.DATABASE_URL = "postgresql://test";
      process.env.SESSION_SECRET = "valid-secret";
      process.env.DB_ENCRYPTION_KEY = "a".repeat(64);
      process.env.MFA_ENCRYPTION_KEY = "b".repeat(64);
      process.env.BLIND_INDEX_KEY = "not-hex-and-too-short";
      expect(() => validateEnvironment()).toThrow("BLIND_INDEX_KEY must be exactly 64 hexadecimal characters");
    });

    it("should not throw when all keys are valid 64-char hex strings", () => {
      process.env.DATABASE_URL = "postgresql://test";
      process.env.SESSION_SECRET = "valid-secret";
      process.env.DB_ENCRYPTION_KEY = "a".repeat(64);
      process.env.MFA_ENCRYPTION_KEY = "b".repeat(64);
      process.env.BLIND_INDEX_KEY = "c".repeat(64);
      expect(() => validateEnvironment()).not.toThrow();
    });

    it("should not throw when all keys are valid mixed-case hex strings", () => {
      process.env.DATABASE_URL = "postgresql://test";
      process.env.SESSION_SECRET = "valid-secret";
      process.env.DB_ENCRYPTION_KEY = "aBcDeF1234567890".repeat(4); // 64 chars
      process.env.MFA_ENCRYPTION_KEY = "FEDCBA0987654321".repeat(4); // 64 chars
      process.env.BLIND_INDEX_KEY = "0123456789ABCDEF".repeat(4); // 64 chars
      expect(() => validateEnvironment()).not.toThrow();
    });

    it("should set default PORT to 8080 when not set", () => {
      process.env.DATABASE_URL = "postgresql://test";
      process.env.SESSION_SECRET = "valid-secret";
      process.env.DB_ENCRYPTION_KEY = "a".repeat(64);
      process.env.MFA_ENCRYPTION_KEY = "b".repeat(64);
      process.env.BLIND_INDEX_KEY = "c".repeat(64);
      delete process.env.PORT;
      validateEnvironment();
      expect(process.env.PORT).toBe("8080");
    });

    it("should throw when DATA_SENSITIVITY_MODE is invalid", () => {
      process.env.DATABASE_URL = "postgresql://test";
      process.env.SESSION_SECRET = "valid-secret";
      process.env.DB_ENCRYPTION_KEY = "a".repeat(64);
      process.env.MFA_ENCRYPTION_KEY = "b".repeat(64);
      process.env.BLIND_INDEX_KEY = "c".repeat(64);
      process.env.DATA_SENSITIVITY_MODE = "invalid-mode";
      expect(() => validateEnvironment()).toThrow("DATA_SENSITIVITY_MODE must be one of");
    });

    it("should accept valid DATA_SENSITIVITY_MODE values", () => {
      process.env.DATABASE_URL = "postgresql://test";
      process.env.SESSION_SECRET = "valid-secret";
      process.env.DB_ENCRYPTION_KEY = "a".repeat(64);
      process.env.MFA_ENCRYPTION_KEY = "b".repeat(64);
      process.env.BLIND_INDEX_KEY = "c".repeat(64);
      
      const validModes = ["demo", "commercial", "phi", "cui"];
      for (const mode of validModes) {
        process.env.DATA_SENSITIVITY_MODE = mode;
        expect(() => validateEnvironment()).not.toThrow();
      }
    });

    it("should default DATA_SENSITIVITY_MODE to demo when not set", () => {
      process.env.DATABASE_URL = "postgresql://test";
      process.env.SESSION_SECRET = "valid-secret";
      process.env.DB_ENCRYPTION_KEY = "a".repeat(64);
      process.env.MFA_ENCRYPTION_KEY = "b".repeat(64);
      process.env.BLIND_INDEX_KEY = "c".repeat(64);
      delete process.env.DATA_SENSITIVITY_MODE;
      validateEnvironment();
      expect(process.env.DATA_SENSITIVITY_MODE).toBe("demo");
    });
  });
});

describe("DATA_SENSITIVITY_MODE helpers", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  it("should return demo mode by default", () => {
    delete process.env.DATA_SENSITIVITY_MODE;
    expect(getDataSensitivityMode()).toBe("demo");
  });

  it("should return configured mode", () => {
    process.env.DATA_SENSITIVITY_MODE = "phi";
    expect(getDataSensitivityMode()).toBe("phi");
  });

  it("should return true for production sensitivity modes", () => {
    process.env.DATA_SENSITIVITY_MODE = "phi";
    expect(isProductionSensitivityMode()).toBe(true);
    
    process.env.DATA_SENSITIVITY_MODE = "cui";
    expect(isProductionSensitivityMode()).toBe(true);
  });

  it("should return false for non-production sensitivity modes", () => {
    process.env.DATA_SENSITIVITY_MODE = "demo";
    expect(isProductionSensitivityMode()).toBe(false);
    
    process.env.DATA_SENSITIVITY_MODE = "commercial";
    expect(isProductionSensitivityMode()).toBe(false);
  });

  it("should return true for demo mode", () => {
    process.env.DATA_SENSITIVITY_MODE = "demo";
    expect(isDemoMode()).toBe(true);
  });

  it("should return false for non-demo modes", () => {
    process.env.DATA_SENSITIVITY_MODE = "commercial";
    expect(isDemoMode()).toBe(false);
    
    process.env.DATA_SENSITIVITY_MODE = "phi";
    expect(isDemoMode()).toBe(false);
    
    process.env.DATA_SENSITIVITY_MODE = "cui";
    expect(isDemoMode()).toBe(false);
  });
});
