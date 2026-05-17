import type { FraudReviewItem, IntegrityStatus, SecurityAlert } from "../../types/security-ops";

interface Props {
  alerts: SecurityAlert[];
  fraudQueue: FraudReviewItem[];
  integrityStatuses: IntegrityStatus[];
}

export function SecurityOperationsDashboard({
  alerts,
  fraudQueue,
  integrityStatuses,
}: Props) {
  return {
    alertsCount: alerts.length,
    fraudQueueCount: fraudQueue.length,
    tamperEvents: integrityStatuses.filter(v => v.tamperDetected).length,
    criticalAlerts: alerts.filter(v => v.severity === "critical").length,
  };
}
