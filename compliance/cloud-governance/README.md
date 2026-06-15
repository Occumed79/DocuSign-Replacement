# Cloud Governance

**Provider**: AWS  
**Scope**: PacketPath Electronic Signature Platform  
**Status**: In Progress

## Governance Areas

### Identity and Access Management
- IAM policies and roles
- MFA enforcement
- Access key rotation
- Root account protection
- Password policies

### Data Governance
- Data classification
- Encryption at rest
- Encryption in transit
- Data retention policies
- Data lifecycle management

### Network Security
- VPC configuration
- Security groups
- NACLs
- WAF rules
- DDoS protection

### Resource Management
- Resource tagging
- Cost allocation
- Resource limits
- Auto-scaling policies
- Backup strategies

### Compliance Monitoring
- AWS Config rules
- CloudTrail logging
- GuardDuty findings
- Security Hub
- Audit Manager

## Cloud Controls

### AWS Well-Architected Framework
- Security Pillar
- Reliability Pillar
- Performance Efficiency Pillar
- Cost Optimization Pillar
- Operational Excellence Pillar

### CIS AWS Benchmark
- Level 1 controls
- Level 2 controls
- Automated checks
- Manual checks

## Evidence Collection

### Evidence Types
- AWS Config snapshots
- CloudTrail logs
- GuardDuty reports
- Security Hub findings
- Cost and usage reports

### Evidence Location
- `/compliance/evidence/` - General evidence
- `/compliance/cloud-governance/evidence/` - Cloud governance specific evidence

## Control Mapping

See `/compliance/mappings/cloud-governance-mapping.md` for detailed mapping of cloud controls to compliance frameworks.

## References

- AWS Well-Architected Framework
- CIS AWS Benchmark
- NIST SP 800-53
- FedRAMP Cloud Computing Security Requirements
