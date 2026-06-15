# Records of Processing Activities (ROPA)

**Document Version**: 1.0  
**Effective Date**: 2026-06-15  
**Review Frequency**: Annually  
**Owner**: Privacy Officer

## Purpose

This document records all processing activities of personal data by PacketPath in accordance with Article 30 of the GDPR.

## Data Controller

**Name**: Occu-Med Occupational Health  
**Address**: [Address]  
**Contact**: privacy@occumed.com  
**DPO**: [Name] - privacy@occumed.com

## Processing Activities

### Activity 1: User Account Management

| Field | Description |
|-------|-------------|
| **Purpose** | User authentication and access control |
| **Data Categories** | Name, email address, IP address, user agent |
| **Data Subjects** | Application users (staff, administrators) |
| **Recipients** | None (internal use only) |
| **International Transfers** | None |
| **Retention** | Account active + 7 years after termination |
| **Security Measures** | Encryption at rest, MFA, access controls, audit logging |
| **Legal Basis** | Contract performance (Article 6(1)(b)) |

### Activity 2: Electronic Signature Processing

| Field | Description |
|-------|-------------|
| **Purpose** | Facilitate electronic document signing |
| **Data Categories** | Name, email address, signature data, IP address, user agent, document content, form responses |
| **Data Subjects** | Document signers (patients, staff, third parties) |
| **Recipients** | Document creator, document recipients |
| **International Transfers** | None (data stored in US) |
| **Retention** | 7 years (HIPAA requirement) |
| **Security Measures** | AES-256-GCM encryption, integrity ledger, audit logging, access controls |
| **Legal Basis** | Contract performance (Article 6(1)(b)), legitimate interest (Article 6(1)(f)) |

### Activity 3: Case Management

| Field | Description |
|-------|-------------|
| **Purpose** | Manage occupational health cases and associated documents |
| **Data Categories** | Patient name, case details, medical information, document references |
| **Data Subjects** | Patients |
| **Recipients** | Authorized healthcare providers, case managers |
| **International Transfers** | None (data stored in US) |
| **Retention** | 7 years after case closure (HIPAA requirement) |
| **Security Measures** | AES-256-GCM encryption, role-based access, audit logging |
| **Legal Basis** | Contract performance (Article 6(1)(b)), legal obligation (Article 6(1)(c)) |

### Activity 4: Audit Logging

| Field | Description |
|-------|-------------|
| **Purpose** | Security monitoring, compliance, incident investigation |
| **Data Categories** | User ID, action performed, timestamp, IP address, user agent, resource accessed |
| **Data Subjects** | All system users |
| **Recipients** | Security team, auditors |
| **International Transfers** | None |
| **Retention** | 7 years (HIPAA requirement) |
| **Security Measures** | Immutable storage, access controls, encryption |
| **Legal Basis** | Legal obligation (Article 6(1)(c)), legitimate interest (Article 6(1)(f)) |

### Activity 5: Email Communications

| Field | Description |
|-------|-------------|
| **Purpose** | Send signing invitations, reminders, notifications |
| **Data Categories** | Name, email address, document title, signing link |
| **Data Subjects** | Document recipients |
| **Recipients** | Email service provider (SendGrid/SMTP) |
| **International Transfers** | Yes (via email service provider) |
| **Retention** | Email logs retained 90 days |
| **Security Measures** | TLS encryption, secure SMTP, access controls |
| **Legal Basis** | Contract performance (Article 6(1)(b)) |

### Activity 6: Authentication and MFA

| Field | Description |
|-------|-------------|
| **Purpose** | User authentication and multi-factor authentication |
| **Data Categories** | Email address, password hash, TOTP secret, backup codes, device information |
| **Data Subjects** | Application users |
| **Recipients** | None (internal use only) |
| **International Transfers** | None |
| **Retention** | Account active + 7 years after termination |
| **Security Measures** | AES-256-GCM encryption, salted hashing, rate limiting |
| **Legal Basis** | Contract performance (Article 6(1)(b)) |

## Data Categories

| Category | Description | Sensitive |
|----------|-------------|-----------|
| Name | Full name of individuals | No |
| Email Address | Email address for communication | No |
| IP Address | Network IP address | Yes (in some jurisdictions) |
| User Agent | Browser/device identifier | No |
| Signature Data | Electronic signature image/data | Yes |
| Document Content | Content of signed documents | Yes (may contain PHI) |
| Form Responses | Form field responses | Yes (may contain PHI) |
| Medical Information | Health-related data | Yes (PHI) |
| Password Hash | Hashed password for authentication | Yes |
| TOTP Secret | Secret for MFA | Yes |

## Data Subjects

| Category | Description |
|----------|-------------|
| Patients | Individuals receiving occupational health services |
| Staff | Employees of Occu-Med Occupational Health |
| Administrators | System administrators with elevated access |
| Third Parties | External signers (e.g., insurance representatives) |

## Recipients

| Recipient | Purpose | Data Transfer Method |
|-----------|---------|---------------------|
| Internal Staff | Case management, document processing | Direct database access |
| Healthcare Providers | Patient care coordination | Direct database access |
| Email Service Provider | Email delivery | API/SMTP |
| Cloud Storage Provider | Document storage (if S3 used) | API |
| Auditors | Compliance audit | Secure export |

## International Transfers

Currently, PacketPath does not transfer personal data outside of the United States. All data is stored and processed within US-based infrastructure.

If international transfers are required in the future, appropriate safeguards (SCCs, BCRs) will be implemented in accordance with GDPR Chapter V.

## Security Measures

### Technical Measures
- AES-256-GCM encryption for sensitive data at rest
- TLS 1.3 for data in transit
- Multi-factor authentication
- Role-based access control
- Audit logging and monitoring
- Immutable integrity ledger for signatures
- Regular security scanning

### Organizational Measures
- Access review procedures
- Incident response plan
- Security awareness training
- Data protection policies
- Third-party risk assessments
- Regular security audits

## Retention Periods

| Data Type | Retention Period | Legal Basis |
|-----------|-----------------|-------------|
| User accounts | Active + 7 years | HIPAA, business necessity |
| Signature records | 7 years | HIPAA §164.312(b) |
| Audit logs | 7 years | HIPAA §164.312(b) |
| Case data | 7 years after closure | HIPAA §164.312(b) |
| Email logs | 90 days | Operational necessity |
| Backup data | Per backup policy | Operational necessity |

## Legal Bases

| Legal Basis | Article | Application |
|-------------|---------|-------------|
| Contract | 6(1)(b) | User accounts, signature processing |
| Legal Obligation | 6(1)(c) | Audit logging, case management |
| Legitimate Interest | 6(1)(f) | Security monitoring, fraud prevention |
| Consent | 6(1)(a) | Marketing communications (if applicable) |

## Review and Updates

This ROPA will be reviewed annually and updated when:
- New processing activities are added
- Existing activities change significantly
- Data categories are added or removed
- Recipients change
- Legal basis changes
- Retention periods change

## References

- GDPR Article 30: Records of processing activities
- GDPR Article 5: Principles relating to processing of personal data
- GDPR Article 6: Lawfulness of processing
- HIPAA Security Rule §164.308(a)(1)
- HIPAA Security Rule §164.312(b)
