# Backup and Restore Procedure

**Document Version**: 1.0  
**Effective Date**: 2026-06-15  
**Review Frequency**: Quarterly  
**Owner**: DevOps Team

## Purpose

This document establishes the backup and restore procedures for PacketPath to ensure data availability, integrity, and recoverability in the event of data loss, corruption, or disaster.

## Scope

This procedure applies to:
- PostgreSQL database (primary data store)
- Application configuration files
- Encrypted secrets and keys
- Signed document storage (if using S3)
- Audit logs and security events

## Backup Strategy

### Backup Types

| Type | Frequency | Retention | Purpose |
|------|-----------|-----------|---------|
| Full Database Backup | Daily | 30 days | Point-in-time recovery |
| Incremental Backup | Hourly | 7 days | Minimize data loss |
| Configuration Backup | On change | 90 days | Configuration recovery |
| Secrets Backup | On change | 90 days | Key recovery |
| Audit Log Backup | Daily | 365 days | Compliance retention |

### Backup Schedule

**Daily (Full):**
- Time: 2:00 AM UTC
- Database: Full PostgreSQL dump
- Configuration: All environment and config files
- Retention: 30 daily backups

**Hourly (Incremental):**
- Time: Every hour
- Database: WAL (Write-Ahead Log) segments
- Retention: 168 hourly backups (7 days)

**Weekly (Archive):**
- Time: Sunday 3:00 AM UTC
- Database: Full backup with checksum
- Retention: 52 weekly backups (1 year)

## Backup Storage

### Primary Storage
- Location: Encrypted S3 bucket with versioning
- Region: Same as application region
- Encryption: AES-256 server-side encryption
- Access: IAM role with least privilege

### Secondary Storage (Cross-Region)
- Location: Encrypted S3 bucket in different region
- Replication: Cross-region replication enabled
- Retention: Same as primary
- Purpose: Disaster recovery

### Backup Encryption
- Database backups: Encrypted at rest with AES-256
- Configuration files: Encrypted with KMS key
- Secrets: Encrypted with separate KMS key
- In transit: TLS 1.3

## Backup Procedure

### Automated Backups

1. **Database Backup Script**
   ```bash
   # Full daily backup
   pg_dump -Fc -f backup_$(date +%Y%m%d).dump packetpath
   
   # Verify backup integrity
   pg_restore --list backup_$(date +%Y%m%d).dump
   
   # Upload to S3
   aws s3 cp backup_$(date +%Y%m%d).dump s3://packetpath-backups/db/
   ```

2. **Configuration Backup**
   ```bash
   # Export environment variables (excluding secrets)
   printenv | grep -v "SECRET\|KEY\|TOKEN" > config_$(date +%Y%m%d).env
   
   # Upload to S3
   aws s3 cp config_$(date +%Y%m%d).env s3://packetpath-backups/config/
   ```

3. **Backup Verification**
   - Check backup file size (should be consistent)
   - Verify backup can be restored to test environment
   - Validate backup checksum
   - Confirm S3 upload success

### Manual Backup Triggers

Perform manual backup before:
- Major application upgrades
- Database schema changes
- Configuration changes
- Security patch deployment

## Restore Procedure

### Prerequisites

1. Identify backup to restore
2. Verify backup integrity
3. Notify stakeholders of planned restore
4. Schedule maintenance window
5. Prepare rollback plan

### Database Restore

**Full Restore:**
```bash
# Download backup from S3
aws s3 cp s3://packetpath-backups/db/backup_YYYYMMDD.dump .

# Stop application
pm2 stop packetpath

# Restore database
pg_restore -d packetpath backup_YYYYMMDD.dump

# Verify data integrity
psql -d packetpath -c "SELECT COUNT(*) FROM signature_requests;"

# Start application
pm2 start packetpath
```

**Point-in-Time Recovery:**
```bash
# Restore from base backup
pg_restore -d packetpath backup_YYYYMMDD.dump

# Replay WAL logs to specific time
pg_ctl start -D /var/lib/postgresql/data
recovery_target_time = '2026-06-15 14:30:00 UTC'
```

### Configuration Restore

```bash
# Download config from S3
aws s3 cp s3://packetpath-backups/config/config_YYYYMMDD.env .

# Review and update environment variables
# Apply changes to application

# Restart application
pm2 restart packetpath
```

## Disaster Recovery

### Recovery Time Objectives (RTO)

| System | RTO | RPO |
|--------|-----|-----|
| Database | 4 hours | 1 hour |
| Application | 2 hours | 1 hour |
| Configuration | 1 hour | 24 hours |

### Disaster Recovery Scenarios

**Scenario 1: Database Corruption**
1. Identify last good backup
2. Restore to standby database
3. Verify data integrity
4. Switch traffic to standby
5. Rebuild primary database

**Scenario 2: Region Outage**
1. Activate cross-region backup
2. Deploy application to DR region
3. Update DNS to point to DR region
4. Monitor system health

**Scenario 3: Ransomware Attack**
1. Isolate affected systems
2. Identify last clean backup
3. Restore from clean backup
4. Scan for malware
5. Update credentials
6. Monitor for recurrence

## Testing

### Backup Testing

**Weekly:**
- Verify backup files exist in S3
- Check backup file sizes
- Validate backup checksums

**Monthly:**
- Restore backup to test environment
- Verify data integrity
- Test application functionality
- Document restore time

**Quarterly:**
- Full disaster recovery drill
- Test cross-region recovery
- Update recovery procedures

### Restore Testing Metrics

Track and report:
- Backup success rate
- Restore success rate
- Average restore time
- Data integrity verification rate

## Monitoring and Alerts

### Alerts

Configure alerts for:
- Backup failure
- Backup size anomaly (>20% deviation)
- Backup location unreachable
- Restore failure
- Disk space threshold (<20% free)

### Monitoring

Monitor:
- Backup job execution
- Backup storage capacity
- Backup retention compliance
- Restore job execution

## Compliance Requirements

### Retention Requirements

- Audit logs: 7 years (HIPAA)
- Transaction records: 7 years (HIPAA)
- User data: Per data retention policy
- System logs: 1 year

### Verification Requirements

- Annual third-party audit of backup procedures
- Quarterly internal review
- Monthly backup integrity verification

## References

- NIST SP 800-53 Rev 5: CP-2, CP-3, CP-4, CP-5, CP-6, CP-7, CP-8, CP-9, CP-10
- HIPAA Security Rule §164.308(a)(7)(i)
- SOC 2 CC8.2
- ISO 27001 A.12.3.1, A.12.3.2, A.12.3.3
