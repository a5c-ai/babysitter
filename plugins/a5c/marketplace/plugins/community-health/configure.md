# community-health — Configuration

## 1. Configuration Options Table

| Option | Values | Default | Where |
|--------|--------|---------|-------|
| `codeOfConductBase` | `contributor-covenant-2.1`, `citizen-code`, `custom` | `contributor-covenant-2.1` | `CODE_OF_CONDUCT.md` |
| `conductContact` | email | required | `CODE_OF_CONDUCT.md` |
| `securityContact` | email | required | `SECURITY.md` |
| `supportedVersions` | matrix | latest+previous | `SECURITY.md` |
| `reviewTurnaround` | duration | `72h` | `CONTRIBUTING.md` |
| `disclosureTimeline` | `30d`, `90d`, `180d` | `90d` | `SECURITY.md` |
| `fundingPlatforms` | list | empty for private | `.github/FUNDING.yml` |
| `issueTemplates` | `on`, `off` | `on` | `.github/ISSUE_TEMPLATE/` |
| `blankIssuesEnabled` | `on`, `off` | `off` | `.github/ISSUE_TEMPLATE/config.yml` |
| `discussionsLinked` | `on`, `off` | `on` | `SUPPORT.md` + issue config contact_links |
| `dcoRequired` | `on`, `off` | `off` | `CONTRIBUTING.md` |

## 2. Swap the Code of Conduct

### Citizen Code of Conduct

```bash
curl -o CODE_OF_CONDUCT.md https://raw.githubusercontent.com/stumpsyn/policies/master/citizen_code_of_conduct.md
```

### Custom

Start from the Contributor Covenant template and modify. Keep the enforcement ladder — it's the part that's actionable.

## 3. Update Security Contacts

Edit `SECURITY.md`:

```markdown
## Reporting a Vulnerability

Email security@example.org — PGP key [here](https://example.org/pgp.asc).
Or use [private vulnerability reporting](../../security/advisories/new).
```

Add `.well-known/security.txt` at the repo root for machine-readable contacts:

```
Contact: mailto:security@example.org
Encryption: https://example.org/pgp.asc
Expires: 2027-01-01T00:00:00.000Z
Preferred-Languages: en
Canonical: https://example.org/.well-known/security.txt
```

## 4. Change Supported Versions

Edit `SECURITY.md`:

```markdown
| Version | Supported |
|---------|-----------|
| 3.x     | yes       |
| 2.x     | security-only |
| 1.x     | no        |
```

## 5. Adjust Disclosure Timeline

```markdown
- **Fix target**: 30 days for high/critical, 60 days for medium, 90 days for low
- **Public disclosure**: 90 days after fix or 120 days after report, whichever first
```

## 6. Enable GitHub Sponsors

```yaml
# .github/FUNDING.yml
github: [maintainer1, maintainer2]
custom: ['https://donate.example.org']
```

Enable Sponsors on each maintainer's GitHub profile first.

## 7. Enforce DCO on PRs

Add to `CONTRIBUTING.md`:

```markdown
## Developer Certificate of Origin

All commits must be signed-off (`git commit -s`). See
https://developercertificate.org/ for the terms.
```

Add a DCO GitHub App or workflow to enforce:

```yaml
name: DCO
on: [pull_request]
jobs:
  dco:
    runs-on: ubuntu-latest
    steps:
      - uses: tim-actions/dco@master
```

## 8. Expand Issue Templates

Add `.github/ISSUE_TEMPLATE/documentation.yml`, `regression.yml`, `rfc.yml` as needed (see `pr-templates` plugin for YAML schema).

## 9. Link to External Governance

If the project has a `GOVERNANCE.md` or uses a foundation-level CoC:

```markdown
<!-- In README.md -->
## Community

- This project is governed by the [Example Foundation Code of Conduct](https://foundation.example.org/coc).
- See [GOVERNANCE.md](GOVERNANCE.md) for decision-making process.
```

## 10. Bulk Placeholder Replacement

```bash
babysitter run:create \
  --process-id community-health-populate \
  --entry .a5c/processes/community-health/populate.js#process \
  --prompt "Replace all <REPLACE_WITH_...> placeholders in community files using the values from .a5c/project-profile.json" \
  --json
```

## 11. Monitor Community Profile Score

```bash
# Add to README or a monitoring workflow
gh api repos/:owner/:repo/community/profile --jq '.health_percentage'
```

Aim for 100 and audit quarterly.
