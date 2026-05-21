# Repository Hardening Guidance

## Branch Protection

Recommended GitHub protections for `main`:

- require pull requests
- require approvals
- require status checks
- require signed commits
- block force pushes
- block branch deletion
- require conversation resolution

## Security Features

Enable:

- secret scanning
- push protection
- Dependabot alerts
- Dependabot security updates
- code scanning
- private vulnerability reporting

## CI/CD Protections

- require passing security workflows
- require SBOM workflow success
- require secret scanning success
- require code review before deployment

## Access Governance

- minimum necessary access
- remove inactive collaborators
- require MFA for GitHub organization members
- separate admin and development accounts

## Future Enhancements

- OpenSSF Scorecard workflow
- Sigstore signing
- SLSA provenance
- deployment approvals
- environment protection rules
