export interface RetentionPolicy {
  category: string;
  retentionDays: number;
  description: string;
}

export const SECURITY_RETENTION_POLICIES: RetentionPolicy[] = [
  {
    category: "audit_logs",
    retentionDays: 3650,
    description: "Audit logs retained for forensic and compliance purposes",
  },
  {
    category: "signature_evidence",
    retentionDays: 3650,
    description: "Signature evidence retained for legal defensibility",
  },
  {
    category: "security_alerts",
    retentionDays: 365,
    description: "Security alerts retained for operational review",
  },
  {
    category: "rate_limit_events",
    retentionDays: 90,
    description: "Rate-limit events retained for abuse detection",
  },
];
