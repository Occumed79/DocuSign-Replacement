# SIEM Forwarding

## Goal

Forward security and audit events into centralized monitoring platforms.

## Planned Destinations

- Microsoft Sentinel
- Splunk
- Elastic
- Datadog
- Chronicle

## Planned Events

- failed login attempts
- signature completion events
- suspicious token activity
- evidence verification failures
- secret-scanning alerts
- dependency vulnerability alerts

## Recommended Transport

- HTTPS webhook forwarding
- Syslog forwarding
- OpenTelemetry
