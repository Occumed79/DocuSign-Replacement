import { describe, it, expect, beforeEach } from "vitest";
import {
  validateFileUpload,
  getMaxFileSize,
  getAllowedFileTypes,
  isFileTypeAllowed,
  sanitizeFilename,
  generateSafeFilename,
} from "./file-upload-security";

describe("file-upload-security", () => {
  describe("validateFileUpload", () => {
    it("should accept valid PDF file within size limit", () => {
      const result = validateFileUpload("application/pdf", 5 * 1024 * 1024);
      expect(result.valid).toBe(true);
      expect(result.maxSize).toBeDefined();
      expect(result.allowedTypes).toBeDefined();
    });

    it("should reject disallowed file type", () => {
      const result = validateFileUpload("application/exe", 1024);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("File type");
      expect(result.error).toContain("not allowed");
    });

    it("should reject file exceeding size limit in demo mode", () => {
      const result = validateFileUpload("application/pdf", 15 * 1024 * 1024);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("exceeds maximum allowed size");
    });

    it("should accept file within demo size limit", () => {
      const result = validateFileUpload("application/pdf", 10 * 1024 * 1024);
      expect(result.valid).toBe(true);
    });

    it("should reject file exactly at size limit + 1 byte", () => {
      const result = validateFileUpload("application/pdf", 10 * 1024 * 1024 + 1);
      expect(result.valid).toBe(false);
    });

    it("should accept all allowed document types", () => {
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.oasis.opendocument.text",
        "text/plain",
        "text/html",
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/tiff",
      ];

      for (const type of allowedTypes) {
        const result = validateFileUpload(type, 1024);
        expect(result.valid).toBe(true);
      }
    });
  });

  describe("getMaxFileSize", () => {
    it("should return a number", () => {
      const maxSize = getMaxFileSize();
      expect(typeof maxSize).toBe("number");
      expect(maxSize).toBeGreaterThan(0);
    });
  });

  describe("getAllowedFileTypes", () => {
    it("should return array of allowed types", () => {
      const types = getAllowedFileTypes();
      expect(Array.isArray(types)).toBe(true);
      expect(types.length).toBeGreaterThan(0);
      expect(types).toContain("application/pdf");
    });
  });

  describe("isFileTypeAllowed", () => {
    it("should return true for allowed types", () => {
      expect(isFileTypeAllowed("application/pdf")).toBe(true);
      expect(isFileTypeAllowed("image/png")).toBe(true);
    });

    it("should return false for disallowed types", () => {
      expect(isFileTypeAllowed("application/exe")).toBe(false);
      expect(isFileTypeAllowed("application/zip")).toBe(false);
      expect(isFileTypeAllowed("video/mp4")).toBe(false);
    });
  });

  describe("sanitizeFilename", () => {
    it("should remove path separators", () => {
      expect(sanitizeFilename("../../../etc/passwd")).not.toContain("/");
      expect(sanitizeFilename("../../../etc/passwd")).not.toContain("\\");
    });

    it("should remove parent directory references", () => {
      expect(sanitizeFilename("..")).not.toContain("..");
      expect(sanitizeFilename("...")).not.toContain("..");
    });

    it("should remove Windows reserved characters", () => {
      expect(sanitizeFilename("file<>name")).not.toContain("<");
      expect(sanitizeFilename("file<>name")).not.toContain(">");
      expect(sanitizeFilename('file:"name')).not.toContain(":");
      expect(sanitizeFilename("file|name")).not.toContain("|");
      expect(sanitizeFilename("file?name")).not.toContain("?");
      expect(sanitizeFilename("file*name")).not.toContain("*");
    });

    it("should remove leading dots", () => {
      expect(sanitizeFilename(".hidden")).not.toMatch(/^\./);
      expect(sanitizeFilename("..hidden")).not.toMatch(/^\./);
    });

    it("should limit filename length", () => {
      const longName = "a".repeat(300);
      const sanitized = sanitizeFilename(longName);
      expect(sanitized.length).toBeLessThanOrEqual(255);
    });

    it("should preserve safe filenames", () => {
      expect(sanitizeFilename("document.pdf")).toBe("document.pdf");
      expect(sanitizeFilename("my-file_v1.txt")).toBe("my-file_v1.txt");
    });
  });

  describe("generateSafeFilename", () => {
    it("should add timestamp and random suffix", () => {
      const result = generateSafeFilename("document.pdf");
      expect(result).toMatch(/document_\d+_[a-z0-9]+\.pdf$/);
    });

    it("should sanitize the original filename", () => {
      const result = generateSafeFilename("../../../etc/passwd");
      expect(result).not.toContain("/");
      expect(result).not.toContain("\\");
      expect(result).not.toContain("..");
    });

    it("should handle files without extensions", () => {
      const result = generateSafeFilename("README");
      expect(result).toMatch(/README_\d+_[a-z0-9]+$/);
    });

    it("should handle files with multiple dots", () => {
      const result = generateSafeFilename("file.name.with.dots.txt");
      expect(result).toMatch(/file\.name\.with\.dots_\d+_[a-z0-9]+\.txt$/);
    });
  });
});
