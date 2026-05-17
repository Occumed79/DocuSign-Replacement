export interface SecurityAlert {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  type: string;
  createdAt: string;
  requestId?: number;
  description: string;
}

export interface FraudReviewItem {
  requestId: number;
  anomalyScore: number;
  severity: "low" | "medium" | "high" | "critical";
  flags: string[];
  requiresManualReview: boolean;
}

export interface IntegrityStatus {
  requestId: number;
  documentHashValid: boolean;
  evidenceHashesValid: boolean;
  finalEvidenceHashValid: boolean;
  tamperDetected: boolean;
}
