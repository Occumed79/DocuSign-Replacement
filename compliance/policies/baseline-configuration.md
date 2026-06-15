# Baseline Configuration

**Document Version**: 1.0  
**Effective Date**: 2026-06-15  
**Review Frequency**: Quarterly  
**Owner**: DevOps Team

## Purpose

This document establishes the baseline security configuration for PacketPath systems to ensure consistent security posture across all environments.

## System Components

### Application Server

**Platform**: Node.js/TypeScript  
**Runtime**: Node.js 20.x LTS  
**Framework**: Express.js  
**Database**: PostgreSQL 15+

**Security Configuration:**
- TLS 1.3 only (no TLS 1.0, 1.1, 1.2)
- HSTS enabled with max-age=31536000
- Secure headers: X-Content-Type-Options, X-Frame-Options, CSP
- Rate limiting: 40 requests/15min for public endpoints
- Session timeout: 30 min idle, 8 hour max
- Password policy: Minimum 12 characters, complexity required
- MFA required for all users

### Database Server

**Platform**: PostgreSQL 15+  
**Authentication**: SCRAM-SHA-256  
**Connection Security**: TLS required

**Security Configuration:**
- SSL/TLS required for all connections
- Encrypted at rest: AES-256
- Row-level security enabled
- Network access: Restricted to application server IPs only
- Backup encryption: AES-256
- Audit logging: Enabled for all DDL/DML

### Encryption Keys

**Key Management:**
- AES-256-GCM for data encryption
- 64-character hexadecimal keys (32 bytes)
- Keys stored in environment variables (not in code)
- Key rotation: Annually
- Key generation: Cryptographically secure random

**Required Keys:**
- SESSION_SECRET: Session signing
- DB_ENCRYPTION_KEY: Database field encryption
- MFA_ENCRYPTION_KEY: TOTP secret encryption
- BLIND_INDEX_KEY: Blind index hashing

### Environment Variables

**Required for Production:**
- DATABASE_URL: PostgreSQL connection string
- SESSION_SECRET: 64-char hex string
- DB_ENCRYPTION_KEY: 64-char hex string
- MFA_ENCRYPTION_KEY: 64-char hex string
- BLIND_INDEX_KEY: 64-char hex string
- DATA_SENSITIVITY_MODE: demo/commercial/phi/cui

**Optional for Production:**
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS: Email configuration
- TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN: SMS configuration
- SENTRY_DSN: Error monitoring
- CLAMAV_HOST, CLAMAV_PORT: Malware scanning
- VIRUSTOTAL_API_KEY: Alternative malware scanning

### Network Configuration

**Inbound Rules:**
- Port 443 (HTTPS): Allow from 0.0.0.0/0
- Port 22 (SSH): Allow from bastion host only
- Port 5432 (PostgreSQL): Allow from application server only

**Outbound Rules:**
- Allow HTTPS (443) to all
- Allow SMTP (587, 465) to email providers
- Allow DNS (53) to internal DNS servers

### File System

**Permissions:**
- Application files: Read-only for application user
- Configuration files: Read-only for application user
- Logs: Write-only for application user
- Temporary files: Isolated per process

**Directory Structure:**
- /opt/packetpath: Application root
- /var/log/packetpath: Application logs
- /etc/packetpath: Configuration files
- /tmp/packetpath: Temporary files

### Logging Configuration

**Log Levels:**
- Production: INFO, WARN, ERROR
- Development: DEBUG, INFO, WARN, ERROR

**Log Retention:**
- Application logs: 90 days
- Audit logs: 7 years (HIPAA requirement)
- Security events: 7 years

**Log Format:**
- JSON structured logging
- Include: timestamp, level, message, context, user_id, request_id
- Sanitize: Remove sensitive data (passwords, tokens, PHI)

### Monitoring and Alerting

**Metrics Collected:**
- CPU utilization
- Memory utilization
- Disk utilization
- Network I/O
- Request rate
- Error rate
- Response time

**Alert Thresholds:**
- CPU > 80% for 5 minutes
- Memory > 85% for 5 minutes
- Disk > 90%
- Error rate > 5%
- Response time > 2s (p95)

### Backup Configuration

**Backup Schedule:**
- Full database backup: Daily at 2:00 AM UTC
- Incremental backup: Hourly
- Configuration backup: On change
- Retention: 30 days daily, 52 weeks weekly

**Backup Storage:**
- Primary: Encrypted S3 bucket (same region)
- Secondary: Encrypted S3 bucket (different region)
- Encryption: AES-256 server-side

## Compliance Baselines

### FedRAMP Moderate

- SC-12: Cryptographic key management (implemented)
- SC-13: Cryptographic protection (implemented)
- AU-2: Audit events (implemented)
- AU-3: Audit record content (implemented)
- AC-2: Access control (partially implemented)
- AC-7: Concurrent session control (implemented)

### HIPAA Security Rule

- §164.308(a)(1): Security management process (implemented)
- §164.308(a)(2): Assigned security responsibility (documented)
- §164.308(a)(3): Workforce security (documented)
- §164.308(a)(4): Information access management (implemented)
- §164.308(a)(5): Security awareness and training (documented)
- §164.308(a)(6): Security incident procedures (documented)
- §164.308(a)(7): Contingency plan (documented)
- §164.308(a)(8): Evaluation (documented)
- §164.312(a)(1): Access control (implemented)
- §164.312(a)(2)(i): Unique user identification (implemented)
- §164.312(a)(2)(ii): Emergency access procedure (documented)
- §164.312(a)(2)(iii): Automatic logoff (implemented)
- §164.312(a)(2)(iv): Encryption and decryption (implemented)
- §164.312(b): Audit controls (implemented)
- §164.312(c)(1): Integrity (implemented)
- §164.312(c)(2): Mechanism to authenticate electronic PHI (implemented)
- §164.312(d)(1): Transmission security (implemented)
- §164.312(d)(2): Encryption (implemented)

### SOC 2

- CC6.1: Logical and physical access controls (implemented)
- CC6.2: Logical access controls (implemented)
- CC6.3: Logical access controls (implemented)
- CC6.4: Logical access controls (documented)
- CC6.5: Logical access controls (documented)
- CC6.6: Logical access controls (documented)
- CC6.7: Logical access controls (documented)
- CC7.1: System monitoring (implemented)
- CC7.2: System monitoring (implemented)
- CC7.3: System monitoring (documented)
- CC7.4: System monitoring (documented)
- CC7.5: System monitoring (documented)
- CC7.6: System monitoring (documented)
- CC8.1: Change management (documented)
- CC8.2: Change management (documented)

## Deviation Process

Any deviation from this baseline requires:
1. Risk assessment documenting the deviation
2. Approval from Security Manager
3. Compensating controls if applicable
4. Defined review date
5. Documentation in change management system

## References

- NIST SP 800-53 Rev 5: CM-2, CM-6, CM-7
- HIPAA Security Rule §164.308(a)(5)(ii)(B)
- SOC 2 CC6.1, CC8.1
- CIS Controls v8: Implementation Group 1
