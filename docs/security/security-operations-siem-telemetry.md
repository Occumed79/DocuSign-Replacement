# Security Operations, SIEM, and Telemetry

## Purpose

PacketPath records structured security operations events and can forward normalized events to external SIEM/webhook destinations.

This layer supports security dashboards, fraud review workflows, tamper alert monitoring, and operational review of high-risk activity.

## Implemented Database Tables

```text
lib/db/src/schema/security-operations.ts
```

### security_operations_events

Stores normalized SOC-style events with:

- event ID
- event type
- category
- severity
- request ID
- actor user ID
- correlation ID
- details payload
- acknowledgement state
- timestamp

### siem_deliveries

Tracks SIEM/webhook delivery attempts with:

- event ID
- destination URL hash
- delivery status
- HTTP status
- attempts
- last error
- delivered timestamp

## Implemented SIEM Helper

```text
artifacts/api-server/src/lib/siem.ts
```

Implemented behavior:

- event normalization
- event ID generation
- security operations event persistence
- outbound SIEM/webhook forwarding
- optional HMAC signing
- delivery status tracking
- delivery failure logging

## Environment Variables

### SIEM_WEBHOOK_URLS

Comma-separated list of webhook targets:

```env
SIEM_WEBHOOK_URLS=https://siem.example/webhook,https://soc.example/events
```

### SIEM_WEBHOOK_SIGNING_SECRET

Optional shared secret used to HMAC-sign outbound event payloads:

```env
SIEM_WEBHOOK_SIGNING_SECRET=change-me
```

If configured, outbound requests include:

```http
X-PacketPath-Signature-SHA256: <hmac>
X-PacketPath-Event-ID: <eventId>
X-PacketPath-Event-Type: <eventType>
```

## Implemented APIs

```text
artifacts/api-server/src/routes/security-operations.ts
```

Routes:

```http
GET /api/security/operations/summary
GET /api/security/operations/events
POST /api/security/operations/events/:eventId/acknowledge
GET /api/security/operations/siem-deliveries
```

Required permission:

```text
security:review
```

## Dashboard Support

The summary endpoint provides:

- SIEM configured status
- total security event count
- severity counts
- SIEM delivery counts
- recent critical events
- recent failed deliveries

## Known Limitations

- Event ingestion is implemented, but not every security-sensitive route emits a normalized security operations event yet.
- SIEM retries/dead-letter queues are not yet implemented.
- Delivery status is tracked per attempt, but retry orchestration is future work.
- No live websocket/SSE event stream yet.
- HMAC verification must be configured by the receiving SIEM/webhook endpoint.

## Future Enhancements

- retry worker for failed SIEM deliveries
- dead-letter queue
- event suppression rules
- alert acknowledgement notes
- analyst assignment
- live event streaming
- dashboard UI widgets
- integration with fraud review queue
- integration with integrity ledger verification results
