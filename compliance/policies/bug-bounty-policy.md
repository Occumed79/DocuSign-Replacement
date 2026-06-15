# Bug Bounty Program Policy

**Document Version**: 1.0  
**Effective Date**: 2026-06-15  
**Review Frequency**: Quarterly  
**Owner**: Security Team

## Purpose

This policy establishes the PacketPath Bug Bounty Program to encourage responsible disclosure of security vulnerabilities in our systems.

## Program Scope

### In Scope

- **Domains**: *.packetpath.com
- **Web Applications**: All public-facing web applications
- **API Endpoints**: All public API endpoints
- **Mobile Applications**: iOS and Android applications
- **Authentication**: Login, MFA, password reset flows
- **Data Protection**: Encryption, data transmission
- **Session Management**: Session handling, cookies

### Out of Scope

- Third-party services (AWS, Render, etc.)
- Physical security
- Social engineering
- DDoS attacks
- Spam or rate limiting issues
- UI/UX bugs without security impact
- Previously reported vulnerabilities
- Vulnerabilities in outdated versions

## Vulnerability Categories

### Critical

- Remote code execution (RCE)
- SQL injection
- Authentication bypass
- Privilege escalation
- Sensitive data exposure
- Payment fraud

**Reward**: $5,000

### High

- XSS (stored or reflected)
- CSRF
- IDOR (insecure direct object reference)
- SSRF (server-side request forgery)
- XXE (XML external entity)
- Authentication weaknesses

**Reward**: $2,500

### Medium

- Information disclosure
- Missing security headers
- Weak encryption
- Session fixation
- Open redirect
- Clickjacking

**Reward**: $1,000

### Low

- Missing CSP
- Missing X-Frame-Options
- Version disclosure
- Cookie security issues
- Minor configuration issues

**Reward**: $500

## Rules of Engagement

### Allowed Testing Methods

- Automated scanning tools
- Manual testing techniques
- Proof-of-concept exploits
- Network reconnaissance

### Prohibited Actions

- DDoS or any form of denial of service
- Accessing or modifying user data
- Social engineering of employees
- Physical attacks on offices or data centers
- Spamming or sending unsolicited emails
- Publishing vulnerabilities before disclosure
- Testing on production data

### Testing Limits

- Stop testing if you encounter significant degradation
- Limit testing to your own accounts
- Do not test on other users' accounts
- Do not attempt to access other users' data
- Report issues immediately upon discovery

## Submission Process

### Reporting Format

Reports must include:

- **Vulnerability Description**: Clear explanation of the vulnerability
- **Steps to Reproduce**: Detailed steps to reproduce the issue
- **Proof of Concept**: Screenshots, videos, or code demonstrating the issue
- **Impact Assessment**: Description of potential impact
- **Suggested Fix**: Recommendations for remediation

### Submission Method

- **Email**: security@occumed.com
- **PGP Key**: [Key ID] for encrypted submissions
- **Response Time**: Within 24 hours

### Required Information

- Researcher name or handle
- Contact information
- Vulnerability category
- Severity assessment
- Proof of concept

## Reward Process

### Eligibility

- First report of a vulnerability
- Vulnerability not previously known
- Vulnerability within scope
- Compliance with rules of engagement
- Clear, actionable report

### Reward Determination

- Severity based on CVSS score
- Impact on PacketPath systems
- Quality of report
- Ease of reproduction

### Payment

- Payment within 30 days of fix
- Payment via PayPal or wire transfer
- Tax forms required for payments >$600
- Public recognition (optional)

## Disclosure Policy

### Timeline

- **Triage**: 24-48 hours
- **Validation**: 3-5 business days
- **Remediation**: Based on severity
- **Public Disclosure**: After fix deployment

### Coordinated Disclosure

- Coordinate with security team
- Agree on disclosure timeline
- Credit researcher (if desired)
- Publish security advisory

### Safe Harbor

- Researchers acting in good faith are protected
- No legal action for compliant research
- No legal action for accidental issues
- Legal action for malicious activities

## Recognition

### Hall of Fame

- Public recognition on trust center
- Optional researcher profile
- Optional company logo
- Optional case study

### Swag

- PacketPath swag pack
- Certificate of recognition
- Invitation to private events

### Career Opportunities

- Priority consideration for security roles
- Access to security team
- Speaking opportunities

## Legal

### Good Faith

- This policy applies to good faith security research
- Malicious activities will be prosecuted
- Legal action for violations of law

### Indemnification

- PacketPath not liable for researcher actions
- Researchers assume liability for their actions
- PacketPath not liable for system downtime

### Jurisdiction

- Governed by laws of [Jurisdiction]
- Disputes resolved through arbitration
- Severability clause applies

## Program Changes

### Modifications

- Changes posted on trust center
- 30-day notice for major changes
- Minor changes posted immediately
- Researchers notified of changes

### Termination

- Right to terminate program at any time
- Right to suspend program temporarily
- Right to modify scope at any time
- Right to modify rewards at any time

## Contact

### Security Team

- **Email**: security@occumed.com
- **PGP Key**: [Key ID]
- **Response Time**: Within 24 hours

### General Inquiries

- **Email**: info@occumed.com
- **Website**: https://packetpath.com
- **Response Time**: Within 48 hours

## References

- OWASP Bug Bounty Playbook
- ISO 29147: Vulnerability Disclosure
- FIRST: Framework for Incident Response and Security Teams
