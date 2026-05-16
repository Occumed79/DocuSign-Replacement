# GitHub Branch Protection and Repository Hardening

## Required Settings for `main`

Enable these settings in GitHub repository settings:

- Require a pull request before merging
- Require approvals before merging
- Require status checks to pass before merging
- Require branches to be up to date before merging
- Require CodeQL to pass
- Require Dependency-Check to pass
- Require Secret Scanning workflow to pass
- Require OpenSSF Scorecard workflow to pass
- Require SBOM workflow to pass where appropriate
- Block force pushes
- Block branch deletion
- Require conversation resolution before merge
- Require signed commits if practical
- Restrict who can push to `main`
- Include administrators if the team is ready for strict enforcement

## Recommended Repository Security Settings

- Enable Dependabot alerts
- Enable Dependabot security updates
- Enable secret scanning alerts where available
- Enable push protection where available
- Enable private vulnerability reporting if available
- Set GitHub Actions permissions to read-only by default
- Require approval for outside collaborators running workflows

## Operational Note

These controls cannot be fully enforced from repository files alone. They must be enabled in GitHub repository settings or via GitHub API by an admin.
