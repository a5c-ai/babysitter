# runbooks — Configuration

## 1. Configuration Options Table

| Option | Values | Default | Where |
|--------|--------|---------|-------|
| `docsHost` | `github`, `mkdocs`, `docusaurus`, `backstage`, `external` | `github` | URL template for `runbook_url` |
| `baseUrl` | URL | `./docs/runbooks` | Prefix for alert annotations |
| `pagingProvider` | `pagerduty`, `opsgenie`, `incident.io`, `grafana-oncall`, `none` | detected | payload format |
| `sevLevels` | array | `[SEV-1, SEV-2, SEV-3, SEV-4]` | `severity.md` matrix |
| `autoLinkAlerts` | `on`, `off` | `on` | Prometheus annotation injection |
| `postmortemRequired` | severity threshold | `SEV-2` | postmortem tracking |
| `onCallShiftLength` | duration | `1w` | rotation doc |
| `handoffDay` | weekday | `Monday` | rotation doc |
| `runbookUrlPattern` | template string | `{baseUrl}/services/{service}#{alert-slug}` | annotation generator |
| `requireRunbookPerAlert` | `on`, `off` | `on` | CI check |

## 2. Change the Runbook URL Pattern

For MkDocs or Docusaurus hosted docs:

```yaml
# babysitter plugin config
runbookUrlPattern: "https://docs.example.com/runbooks/services/{service}/#{alert-slug}"
```

For Backstage TechDocs:

```yaml
runbookUrlPattern: "https://backstage.example.com/docs/default/component/{service}/runbook/#{alert-slug}"
```

## 3. Add a New Severity Level

Edit `docs/runbooks/incidents/severity.md`:

```markdown
| SEV-0 | Multi-region outage, regulated data exposure | Immediate | Page primary + exec on-call |
```

Update PagerDuty escalation policy and re-run:

```bash
babysitter run:create \
  --process-id runbooks-sync-severity \
  --entry .a5c/processes/runbooks/sync-severity.js#process
```

## 4. Require a Runbook Per Alert (CI check)

Add `.github/workflows/runbook-check.yml`:

```yaml
name: Runbook coverage
on: [pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - name: Every alert must have runbook_url
        run: |
          missing=$(grep -L 'runbook_url' prometheus/rules/*.yml || true)
          if [ -n "$missing" ]; then
            echo "Missing runbook_url in: $missing"; exit 1
          fi
```

## 5. Integration with PagerDuty

Set Terraform variables:

```hcl
variable "pagerduty_runbook_base" {
  default = "https://docs.example.com/runbooks"
}

resource "pagerduty_service" "payments" {
  name = "payments"
  auto_resolve_timeout = 14400
  # runbook URL is attached per-alert, not per-service
}
```

## 6. Integration with Opsgenie

Add `details.runbook` to every team's alert payload template. In Alertmanager:

```yaml
receivers:
  - name: opsgenie-payments
    opsgenie_configs:
      - api_key: $OPSGENIE_KEY
        details:
          runbook: '{{ .CommonAnnotations.runbook_url }}'
```

## 7. Rotate On-Call Schedule Format

Switch from weekly to follow-the-sun:

```markdown
**Primary rotation:** <link>
**Shift length:** 8 hours, 3 shifts/day across AMER/EMEA/APAC
**Handoff:** at shift boundary, sync in #oncall-handoff
```

## 8. Auto-generate Service Runbooks

Run:

```bash
agent-platform call \
  --harness claude-code \
  --process .a5c/processes/runbooks/scaffold-service.js#process \
  --prompt "Generate runbook entries for every alert in prometheus/rules/<service>.yml"
```

## 9. Require Postmortem Within N Days

Edit `docs/runbooks/postmortems/template.md` front-matter:

```yaml
---
severity: SEV-2
due: 5 business days
reviewer: <sre-lead>
---
```

Optionally add a GitHub Action that opens a postmortem tracking issue when an incident is resolved in PagerDuty (webhook → `actions/github-script`).

## 10. Link Dashboards to Runbooks

For Grafana, use the "Links" panel option per dashboard:

```json
"links": [
  { "title": "Runbook", "url": "https://docs.example.com/runbooks/services/payments", "targetBlank": true }
]
```

## 11. Stale-runbook Reminder

Add a scheduled workflow that opens an issue for any service runbook not touched in 180 days:

```yaml
on:
  schedule:
    - cron: '0 9 * * 1'  # Monday 09:00
jobs:
  stale:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - name: Find stale runbooks
        run: |
          find docs/runbooks/services -name '*.md' -mtime +180 -print
```
