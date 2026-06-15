# Access Review Procedure

**Document Version**: 1.0  
**Effective Date**: 2026-06-15  
**Review Frequency**: Quarterly  
**Owner**: Security Team

## Purpose

This document establishes the procedure for conducting periodic access reviews to ensure that user access rights are appropriate, necessary, and aligned with the principle of least privilege.

## Scope

This procedure applies to all users with access to PacketPath systems, including:
- Administrators
- Staff users
- Third-party contractors
- System service accounts

## Roles and Responsibilities

| Role | Responsibility |
|------|----------------|
| Security Team | Conduct access reviews, document findings, revoke unnecessary access |
| System Owner | Approve access changes for their systems |
| Data Owner | Approve access to sensitive data |
| Manager | Confirm direct reports' access requirements |

## Access Review Schedule

| Review Type | Frequency | Trigger |
|-------------|-----------|---------|
| User Access Review | Quarterly | Calendar schedule |
| Privileged Access Review | Monthly | Calendar schedule |
| Role/Group Review | Quarterly | Calendar schedule |
| Third-Party Access Review | Monthly | Contract renewal |
| Role Change Review | Immediate | Job function change |
| Termination Review | Immediate | Employee termination |

## Access Review Process

### 1. Preparation

1. Generate access report from database
2. List all users with active accounts
3. Identify users with privileged access
4. Identify users with access to PHI/CUI data
5. Identify dormant accounts (no activity > 90 days)

### 2. Review

For each user, verify:
- Current job function and responsibilities
- Business justification for each access right
- Whether access is still needed
- Whether access level is appropriate
- Whether user has completed required training

### 3. Decision

For each access right, choose one of:
- **Retain**: Access is still appropriate and necessary
- **Modify**: Access level needs adjustment
- **Revoke**: Access is no longer needed or justified

### 4. Implementation

1. Document all decisions in access review log
2. Implement approved changes within 5 business days
3. Notify users of access changes
4. Update access review tracker

### 5. Verification

1. Confirm changes were implemented correctly
2. Verify revoked users cannot access systems
3. Document verification results

## Access Review Template

```markdown
## Access Review - [Quarter/Year]

**Review Period**: [Start Date] - [End Date]  
**Reviewer**: [Name]  
**Review Date**: [Date]

### Summary
- Total Users Reviewed: [Number]
- Access Retained: [Number]
- Access Modified: [Number]
- Access Revoked: [Number]
- Dormant Accounts: [Number]

### Detailed Findings

| User | Role | Access Level | Decision | Justification | Action Date |
|------|------|--------------|----------|---------------|-------------|
| [Name] | [Role] | [Level] | [Retain/Modify/Revoke] | [Reason] | [Date] |

### Issues Identified
1. [Description]
2. [Description]

### Remediation Actions
1. [Action] - [Owner] - [Due Date]
2. [Action] - [Owner] - [Due Date]

### Approval
Reviewer: [Signature] - [Date]
Security Manager: [Signature] - [Date]
```

## Exceptions

Exceptions to access revocation must be:
- Documented in writing
- Approved by Security Manager
- Reviewed quarterly
- Temporary with defined end date

## Metrics

Track the following metrics:
- Percentage of users reviewed on schedule
- Number of access rights revoked
- Time from review to implementation
- Number of exceptions granted
- Number of dormant accounts

## References

- NIST SP 800-53 Rev 5: AC-2, AC-2(1), AC-2(2), AC-2(3), AC-2(4)
- SOC 2 CC6.1, CC6.2, CC6.3, CC6.4, CC6.5, CC6.6, CC6.7
- ISO 27001 A.9.2.1, A.9.2.2, A.9.2.3, A.9.2.4, A.9.2.5, A.9.2.6
