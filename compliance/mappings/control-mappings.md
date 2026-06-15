# Control Mappings

**Purpose**: Map PacketPath controls to multiple compliance frameworks  
**Last Updated**: 2026-06-15

## Frameworks Mapped

- NIST SP 800-53 Rev 5
- FedRAMP Moderate
- HIPAA Security Rule
- SOC 2 Trust Services Criteria
- ISO 27001:2022 Annex A
- OWASP ASVS
- GDPR

## Control Mapping Table

| PacketPath Control | NIST 800-53 | FedRAMP | HIPAA | SOC 2 | ISO 27001 | OWASP ASVS | GDPR |
|-------------------|-------------|---------|-------|-------|------------|------------|------|
| Access review procedure | AC-2 | AC-2 | §164.308(a)(3)(ii)(A) | CC6.1 | A.5.15 | V2.1.1 | Art. 32 |
| Session timeout (30 min idle) | AC-7 | AC-7 | §164.312(a)(2)(iii) | CC6.1 | A.5.17 | V2.5.1 | Art. 32 |
| Device trust policy | IA-3 | IA-3 | §164.312(a)(2)(ii) | CC6.1 | A.8.1 | V2.8.1 | Art. 32 |
| DATA_SENSITIVITY_MODE | SC-7 | SC-7 | §164.312(a)(2)(iv) | CC6.6 | A.8.12 | V2.9.1 | Art. 32 |
| Anti-replay checks | SC-8 | SC-8 | §164.312(c)(1) | CC6.6 | A.8.12 | V2.8.3 | Art. 32 |
| Signing link revocation | SC-8 | SC-8 | §164.312(c)(1) | CC6.6 | A.8.12 | V2.8.3 | Art. 32 |
| Malware scanning adapter | SI-3 | SI-3 | §164.312(d)(2) | CC7.1 | A.8.7 | V5.1.1 | Art. 32 |
| File type/size restrictions | SI-7 | SI-7 | §164.312(c)(1) | CC7.1 | A.8.12 | V5.3.1 | Art. 32 |
| Incident response plan | IR-4 | IR-4 | §164.308(a)(6) | CC4.1 | A.5.24 | V8.1.1 | Art. 33 |
| Tabletop exercise | IR-4 | IR-4 | §164.308(a)(6) | CC4.1 | A.5.24 | V8.1.1 | Art. 33 |
| Vulnerability scanning | RA-5 | RA-5 | §164.308(a)(5)(ii)(B) | CC7.3 | A.8.8 | V5.2.1 | Art. 32 |
| Vulnerability remediation SLA | SI-2 | SI-2 | §164.308(a)(5)(ii)(B) | CC7.3 | A.8.8 | V5.2.1 | Art. 32 |
| Baseline configuration | CM-2 | CM-2 | §164.308(a)(5)(ii)(A) | CC8.1 | A.8.9 | V7.1.1 | Art. 32 |
| Configuration management | CM-6 | CM-6 | §164.308(a)(5)(ii)(A) | CC8.1 | A.8.9 | V7.1.1 | Art. 32 |
| Change management | CM-7 | CM-7 | §164.308(a)(5)(ii)(A) | CC8.1 | A.8.24 | V7.2.1 | Art. 32 |
| Backup/restore procedure | CP-2 | CP-2 | §164.308(a)(7)(i) | CC7.5 | A.8.13 | V8.3.1 | Art. 32 |
| ROPA | AU-6 | AU-6 | §164.308(a)(1)(ii)(D) | CC2.2 | A.5.9 | V7.3.1 | Art. 30 |
| DPIA | AR-4 | AR-4 | N/A | CC3.1 | A.5.24 | V8.1.1 | Art. 35 |
| Privacy notice | AR-4 | AR-4 | §164.520 | CC2.2 | A.5.10 | V7.3.1 | Art. 13 |
| Data subject request procedure | AR-4 | AR-4 | §164.526 | CC2.2 | A.5.12 | V7.3.1 | Art. 15-21 |

## Framework-Specific Mappings

### NIST SP 800-53 Rev 5

| Control | Description | Implementation |
|---------|-------------|----------------|
| AC-2 | Access Control | Access review procedure, RBAC |
| AC-7 | Concurrent Session Control | Session timeout enforcement |
| IA-3 | Authenticator Management | Device trust policy |
| SC-7 | Boundary Protection | DATA_SENSITIVITY_MODE |
| SC-8 | Transmission Confidentiality and Integrity | Anti-replay, link revocation |
| SI-3 | Malicious Code Protection | Malware scanning adapter |
| SI-7 | Software and Information Integrity | File type/size restrictions |
| IR-4 | Incident Handling | Incident response plan, tabletop exercise |
| RA-5 | Vulnerability Monitoring | Vulnerability scanning |
| SI-2 | Flaw Remediation | Vulnerability remediation SLA |
| CM-2 | Baseline Configuration | Baseline configuration documentation |
| CM-6 | Configuration Management | Configuration management plan |
| CM-7 | Least Functionality | Change management plan |
| CP-2 | Contingency Plan | Backup/restore procedure |
| AU-6 | Audit Review | ROPA |
| AR-4 | Risk Assessment | DPIA |

### HIPAA Security Rule

| Control | Description | Implementation |
|---------|-------------|----------------|
| §164.308(a)(3)(ii)(A) | Access Management | Access review procedure |
| §164.312(a)(2)(iii) | Automatic Logoff | Session timeout |
| §164.312(a)(2)(ii) | Access Control | Device trust policy |
| §164.312(a)(2)(iv) | Encryption and Decryption | DATA_SENSITIVITY_MODE |
| §164.312(c)(1) | Integrity | Anti-replay, link revocation |
| §164.312(d)(2) | Transmission Security | Malware scanning |
| §164.308(a)(6) | Incident Response | Incident response plan |
| §164.308(a)(5)(ii)(B) | Protection from Malicious Software | Vulnerability scanning |
| §164.308(a)(5)(ii)(A) | Security Management Process | Baseline configuration |
| §164.308(a)(7)(i) | Contingency Plan | Backup/restore procedure |
| §164.308(a)(1)(ii)(D) | Audit Controls | ROPA |
| §164.520 | Notice of Privacy Practices | Privacy notice |
| §164.526 | Access of Individuals | Data subject request procedure |

### SOC 2 Trust Services Criteria

| Control | Description | Implementation |
|---------|-------------|----------------|
| CC6.1 | Logical Access | Access review, device trust, session timeout |
| CC6.6 | Encryption | DATA_SENSITIVITY_MODE, anti-replay |
| CC7.1 | System Operations | Malware scanning, file restrictions |
| CC4.1 | Monitoring | Incident response, tabletop exercise |
| CC7.3 | Monitoring | Vulnerability scanning, remediation SLA |
| CC8.1 | Change Management | Baseline configuration, config management |
| CC7.5 | Backup | Backup/restore procedure |
| CC2.2 | Communication | ROPA, privacy notice |
| CC3.1 | Risk Assessment | DPIA |

### ISO 27001:2022 Annex A

| Control | Description | Implementation |
|---------|-------------|----------------|
| A.5.15 | Access Control | Access review procedure |
| A.5.17 | Authentication Information | Session timeout |
| A.8.1 | User Endpoint Devices | Device trust policy |
| A.8.12 | Data Leakage Prevention | DATA_SENSITIVITY_MODE, anti-replay |
| A.8.7 | Protection Against Malware | Malware scanning |
| A.8.12 | Data Leakage Prevention | File type/size restrictions |
| A.5.24 | Information Security Incident Management | Incident response plan |
| A.8.8 | Management of Technical Vulnerabilities | Vulnerability scanning, SLA |
| A.8.9 | Configuration Management | Baseline configuration, config management |
| A.8.24 | Change Management | Change management plan |
| A.8.13 | Information Backup | Backup/restore procedure |
| A.5.9 | Inventory of Information and Other Associated Assets | ROPA |
| A.5.24 | Information Security Incident Management | DPIA |
| A.5.10 | Acceptable Use of Information | Privacy notice |
| A.5.12 | Labelling of Information | Data subject request procedure |

### OWASP ASVS

| Control | Description | Implementation |
|---------|-------------|----------------|
| V2.1.1 | Authentication | Access review procedure |
| V2.5.1 | Session Management | Session timeout |
| V2.8.1 | Server-Side Controls | Device trust policy |
| V2.9.1 | Data Protection | DATA_SENSITIVITY_MODE |
| V2.8.3 | Session Management | Anti-replay, link revocation |
| V5.1.1 | File Upload | Malware scanning |
| V5.3.1 | File Upload | File type/size restrictions |
| V8.1.1 | Incident Response | Incident response plan |
| V5.2.1 | Vulnerability Management | Vulnerability scanning |
| V7.1.1 | Security Architecture | Baseline configuration |
| V7.2.1 | Security Architecture | Configuration management |
| V7.3.1 | Security Architecture | ROPA, privacy notice |
| V8.3.1 | Incident Response | Backup/restore procedure |

### GDPR

| Control | Description | Implementation |
|---------|-------------|----------------|
| Art. 32 | Security of Processing | All security controls |
| Art. 33 | Notification of Personal Data Breach | Incident response plan |
| Art. 30 | Records of Processing Activities | ROPA |
| Art. 35 | Data Protection Impact Assessment | DPIA |
| Art. 13 | Information to be Provided | Privacy notice |
| Art. 15-21 | Data Subject Rights | Data subject request procedure |

## Cross-Reference Index

### By Control Type

**Access Control:**
- Access review procedure
- Session timeout
- Device trust policy
- DATA_SENSITIVITY_MODE

**Data Protection:**
- Anti-replay checks
- Signing link revocation
- Malware scanning
- File type/size restrictions

**Incident Response:**
- Incident response plan
- Tabletop exercise

**Vulnerability Management:**
- Vulnerability scanning
- Vulnerability remediation SLA

**Configuration Management:**
- Baseline configuration
- Configuration management
- Change management

**Business Continuity:**
- Backup/restore procedure

**Privacy:**
- ROPA
- DPIA
- Privacy notice
- Data subject request procedure

## References

- NIST SP 800-53 Rev 5
- FedRAMP Moderate Baseline
- HIPAA Security Rule 45 CFR §164.302-318
- AICPA Trust Services Criteria
- ISO/IEC 27001:2022
- OWASP Application Security Verification Standard 4.0
- GDPR 2016/679
