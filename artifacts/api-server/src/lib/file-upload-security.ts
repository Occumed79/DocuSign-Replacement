import { isDemoMode, isProductionSensitivityMode } from "./env";

// Allowed file types for document uploads
const ALLOWED_DOCUMENT_TYPES = [
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
] as const;

// Maximum file sizes (in bytes)
const MAX_FILE_SIZE_DEMO = 10 * 1024 * 1024; // 10 MB for demo
const MAX_FILE_SIZE_PRODUCTION = 50 * 1024 * 1024; // 50 MB for production

export interface FileUploadValidationResult {
  valid: boolean;
  error?: string;
  maxSize?: number;
  allowedTypes?: readonly string[];
}

/**
 * Validate file upload based on content type and size
 */
export function validateFileUpload(
  contentType: string,
  fileSize: number
): FileUploadValidationResult {
  // Check file type
  if (!ALLOWED_DOCUMENT_TYPES.includes(contentType as any)) {
    return {
      valid: false,
      error: `File type "${contentType}" is not allowed. Allowed types: ${ALLOWED_DOCUMENT_TYPES.join(", ")}`,
      allowedTypes: ALLOWED_DOCUMENT_TYPES,
    };
  }

  // Check file size
  const maxSize = isProductionSensitivityMode() ? MAX_FILE_SIZE_PRODUCTION : MAX_FILE_SIZE_DEMO;
  if (fileSize > maxSize) {
    return {
      valid: false,
      error: `File size ${fileSize} bytes exceeds maximum allowed size of ${maxSize} bytes (${maxSize / 1024 / 1024} MB)`,
      maxSize,
    };
  }

  return { valid: true, maxSize, allowedTypes: ALLOWED_DOCUMENT_TYPES };
}

/**
 * Get maximum file size for current sensitivity mode
 */
export function getMaxFileSize(): number {
  return isProductionSensitivityMode() ? MAX_FILE_SIZE_PRODUCTION : MAX_FILE_SIZE_DEMO;
}

/**
 * Get allowed file types
 */
export function getAllowedFileTypes(): readonly string[] {
  return ALLOWED_DOCUMENT_TYPES;
}

/**
 * Check if file type is allowed
 */
export function isFileTypeAllowed(contentType: string): boolean {
  return ALLOWED_DOCUMENT_TYPES.includes(contentType as any);
}

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(filename: string): string {
  // Remove path separators and special characters
  return filename
    .replace(/[\/\\]/g, "_") // Replace path separators
    .replace(/\.\./g, "_") // Remove parent directory references
    .replace(/[<>:"|?*]/g, "_") // Remove Windows reserved characters
    .replace(/^\.+/, "") // Remove leading dots
    .slice(0, 255); // Limit length
}

/**
 * Generate safe filename for storage
 */
export function generateSafeFilename(originalFilename: string): string {
  const sanitized = sanitizeFilename(originalFilename);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  const ext = sanitized.includes(".") ? sanitized.split(".").pop() : "";
  const base = ext ? sanitized.slice(0, -ext.length - 1) : sanitized;
  return `${base}_${timestamp}_${random}.${ext}`;
}
