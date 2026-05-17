export interface TelemetryEvent {
  name: string;
  timestamp: string;
  attributes?: Record<string, unknown>;
}

export function createTelemetryEvent(name: string, attributes?: Record<string, unknown>): TelemetryEvent {
  return {
    name,
    timestamp: new Date().toISOString(),
    attributes,
  };
}

export async function emitTelemetryEvent(event: TelemetryEvent): Promise<void> {
  if (!process.env.OTEL_EXPORT_ENABLED) {
    return;
  }

  console.log(JSON.stringify({
    type: "otel_event",
    event,
  }));
}
