# Security Overview

**Last Updated**: 2026-06-15

## Our Security Philosophy

At PacketPath, security is not an afterthought—it's foundational to everything we build. We believe that trust is earned through transparency, rigorous security practices, and continuous improvement.

## Security Architecture

### Defense in Depth

We employ a layered security approach:

- **Network Security**: VPC isolation, security groups, WAF
- **Application Security**: Input validation, output encoding, secure session management
- **Data Security**: Encryption at rest (AES-256-GCM) and in transit (TLS 1.3)
- **Identity Security**: Multi-factor authentication, role-based access control
- **Monitoring**: Real-time threat detection, SIEM integration

### Key Security Features

- **Encryption**: All sensitive data encrypted using AES-256-GCM
- **Authentication**: MFA required for all administrative access
- **Session Management**: 30-minute idle timeout, 8-hour maximum session
- **Access Control**: Role-based access with regular reviews
- **Audit Logging**: Comprehensive logging of all system access and changes
- **Vulnerability Management**: Automated scanning with defined SLAs
- **Incident Response**: 24/7 monitoring and response capabilities

## Compliance Certifications

### Current Status

- **SOC 2 Type II**: In progress - Target: 2027-10-31
- **ISO 27001**: In progress - Target: 2027-03-31
- **HIPAA**: Compliant - Security Rule implementation complete
- **GDPR**: Compliant - Privacy controls implemented
- **FedRAMP Moderate**: Planned - Target: 2028

### Compliance Frameworks

We align our security controls with multiple industry standards:

- NIST SP 800-53 Rev 5
- CIS Controls v8
- OWASP ASVS 4.0
- ISO 27001:2022
- SOC 2 Trust Services Criteria

## Security Practices

### Data Protection

- **Encryption at Rest**: AES-256-GCM for all sensitive data
- **Encryption in Transit**: TLS 1.3 for all network communications
- **Key Management**: Secure key generation, rotation, and storage
- **Data Retention**: Defined retention periods based on data classification

### Access Control

- **Authentication**: Multi-factor authentication for all users
- **Authorization**: Role-based access control (RBAC)
- **Session Management**: Secure session handling with timeout enforcement
- **Access Reviews**: Quarterly access reviews for all users

### Vulnerability Management

- **Scanning**: Automated dependency and container scanning
- **Remediation SLA**:
  - Critical: 48 hours
  - High: 7 days
  - Medium: 30 days
  - Low: 90 days
- **Penetration Testing**: Annual third-party penetration testing

### Incident Response

- **Monitoring**: 24/7 security monitoring
- **Response**: Trained incident response team
- **Notification**: Defined breach notification procedures
- **Testing**: Quarterly tabletop exercises

### Business Continuity

- **Backups**: Daily automated backups with 7-year retention
- **Disaster Recovery**: Tested disaster recovery procedures
- **RTO**: 4 hours for critical systems
- **RPO**: 1 hour for critical data

## Privacy

### Data Collection

We collect only the data necessary to provide our services:

- User account information (name, email)
- Document metadata
- Signature data
- Audit logs
- IP addresses and user agents for security

### Data Processing

All data processing is conducted in accordance with:

- GDPR Articles 13-21
- HIPAA Privacy Rule
- CCPA requirements

### Your Rights

You have the right to:
- Access your personal data
- Correct inaccurate data
- Request deletion of your data
- Export your data
- Object to processing
- Lodge a complaint with supervisory authorities

## Third-Party Security

### Vendor Management

- Security assessments for all third-party vendors
- Data processing agreements (DPAs)
- Regular vendor reviews
- Subprocessor transparency

### Cloud Infrastructure

- AWS cloud infrastructure
- FedRAMP authorized services
- SOC 2 certified providers
- Regular security assessments

## Bug Bounty Program

We welcome responsible disclosure of security vulnerabilities. If you discover a security issue, please report it to security@occumed.com.

### Scope

- *.packetpath.com
- API endpoints
- Authentication mechanisms

### Exclusions

- Third-party services
- Physical security
- Social engineering

### Rewards

- Critical: $5,000
- High: $2,500
- Medium: $1,000
- Low: $500

## Security Contact

For security questions or to report a vulnerability:

- **Email**: security@occumed.com
- **PGP Key**: [Key ID]
- **Response Time**: Within 24 hours

## Resources

- [Privacy Policy](/privacy)
- [Terms of Service](/terms)
- [Subprocessor List](/subprocessors)
- [Whitepapers](/whitepapers)
