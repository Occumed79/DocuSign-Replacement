# Evidence Directory

This directory contains evidence supporting compliance controls.

## Structure

```
evidence/
  README.md (this file)
  control-evidence-index.md
  screenshots/
  scans/
  sbom/
  test-results/
```

## Evidence Types

### Screenshots
- Security configuration screenshots
- Admin interface screenshots
- Audit log samples
- Error handling examples
- Security warning examples

### Scans
- Dependency vulnerability scans
- Container vulnerability scans
- CodeQL analysis results
- Secret scanning results
- OWASP ZAP baseline scans

### SBOM
- Software Bill of Materials
- Dependency lists
- License information
- Vulnerability data

### Test Results
- Security test results
- Unit test coverage
- Integration test results
- Penetration test results (when available)

## Control Evidence Index

See `control-evidence-index.md` for a mapping of controls to evidence files.

## Adding Evidence

When adding evidence:
1. Use descriptive filenames
2. Include date in filename
3. Document the control being evidenced
4. Update control-evidence-index.md
5. Remove sensitive data before committing

## Sensitive Data

Do not commit:
- Real PHI/CUI data
- Real user credentials
- Real API keys or secrets
- Production database dumps
- Real patient information

Use sanitized test data or placeholders instead.
