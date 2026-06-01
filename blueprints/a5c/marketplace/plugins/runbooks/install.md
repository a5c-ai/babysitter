# runbooks — Install Instructions

Set up an operational runbook library for your project — scaffold `docs/runbooks/`, seed an on-call response template, integrate with PagerDuty or Opsgenie, and wire runbook links into alert payloads so responders land on the right page in the worst 3AM of their lives.

## Step 1: Interview the User

### Stage 1: Project Analysis

Before asking questions, analyze the project:
1. Check for existing `docs/` or `documentation/` folders and note the format (Markdown, MkDocs, Docusaurus, Sphinx, mdBook)
2. Detect any existing runbook prior art: `runbook.md`, `RUNBOOK*`, `docs/ops/`, `docs/sre/`, `ops/playbooks/`
3. Detect alerting / monitoring config: `prometheus/`, `alertmanager.yml`, `grafana/`, `datadog/`, `newrelic/`, `sentry*`
4. Detect on-call tooling hints: `.pagerduty.yml`, Opsgenie API references in `.env.example`, `incident.io` references
5. Detect service catalog: `catalog-info.yaml` (Backstage), `service.yaml`, `sre.yaml`
6. Check `README.md` for existing "On-call" / "Incident" / "Operations" sections
7. Summarize findings to the user

### Stage 2: Runbook Scope

Ask which runbook categories to scaffold (multi-select):

1. **Service runbooks** — per-service "what do I do when X alerts" pages
2. **Incident response** — severity matrix, paging, comms templates, status page updates
3. **On-call readiness** — onboarding checklist, escalation paths, shadow shifts
4. **Recovery procedures** — database failover, cache flush, rollback, feature-flag kill switches
5. **Post-incident review** — blameless postmortem template + tracking issue template
6. **All** — scaffold every category

### Stage 3: Paging Provider

Ask which provider(s) the project uses (multi-select):

| Provider | Integration Method |
|----------|-------------------|
| PagerDuty | Events API v2 + Terraform service definitions |
| Opsgenie | Alert API + team routing rules |
| incident.io | Slack-native, webhook-based |
| Grafana OnCall | Webhook → escalation chain |
| None / manual | Skip integration; runbooks stay link-only |

### Stage 4: Docs Host

Ask where runbooks will live:

1. **In-repo Markdown** under `docs/runbooks/` (default; renderable by GitHub)
2. **MkDocs Material** site (if `mkdocs.yml` detected)
3. **Docusaurus** (if `docusaurus.config.*` detected)
4. **Backstage TechDocs** (if `catalog-info.yaml` detected)
5. **External wiki** (Notion / Confluence) — scaffold stubs only, link from README

### Stage 5: Alert → Runbook Linking

Ask:
- Embed `runbook_url` annotations in Prometheus alert rules? (default: yes)
- Add `links` block to PagerDuty / Opsgenie payloads? (default: yes)
- Auto-derive runbook URL from alert name? (default: yes, pattern `https://<docs-host>/runbooks/<service>/<alert-slug>`)

## Step 2: Scaffold `docs/runbooks/`

```bash
mkdir -p docs/runbooks/{services,incidents,recovery,on-call,postmortems}
```

Create `docs/runbooks/README.md`:

```markdown
# Runbooks

Operational documentation for on-call responders. If you are paged, start here.

## Quick links
- [Incident severity matrix](./incidents/severity.md)
- [Paging rotation & escalation](./on-call/rotation.md)
- [Status page comms templates](./incidents/comms-templates.md)
- [Postmortem template](./postmortems/template.md)

## Service runbooks
See [`./services/`](./services/) — one file per service.

## Contributing
Every new alert **must** ship with a runbook entry. See [template.md](./services/template.md).
```

## Step 3: Seed Service Runbook Template

Create `docs/runbooks/services/template.md`:

```markdown
# <Service Name> Runbook

**Owner:** <team> · **Slack:** #<channel> · **Dashboard:** <link> · **Repo:** <link>

## Alerts
| Alert | Severity | Description | Section |
|-------|----------|-------------|---------|
| `ServiceDown` | SEV-1 | No healthy replicas for >2m | [§1](#1-servicedown) |
| `HighErrorRate` | SEV-2 | 5xx rate > 1% for 5m | [§2](#2-higherrorrate) |
| `LatencyP99High` | SEV-3 | p99 > 1s for 10m | [§3](#3-latencyp99high) |

## 1. ServiceDown
**Symptoms:** All pods in `CrashLoopBackOff` or `Pending`.
**First 5 minutes:**
1. `kubectl -n <ns> get pods -l app=<svc>` — capture pod state
2. `kubectl -n <ns> logs -l app=<svc> --tail=200 --previous`
3. Check deploy history: `kubectl rollout history deploy/<svc>`
4. If recent deploy — **rollback**: `kubectl rollout undo deploy/<svc>`
5. If rollback doesn't help — escalate to service owner and update status page

**Dashboards:** <grafana-link>
**Related:** [recovery/db-failover.md](../recovery/db-failover.md)

## 2. HighErrorRate
...

## 3. LatencyP99High
...

## Rollback procedure
...

## Dependencies
- Upstream: `<svc-a>`, `<svc-b>`
- Downstream: `<svc-c>`
- Data stores: `<postgres-cluster>`, `<redis-cluster>`
```

## Step 4: Seed Incident Response Templates

Create `docs/runbooks/incidents/severity.md`:

```markdown
# Severity Matrix

| Severity | Criteria | Response time | Paging |
|----------|----------|---------------|--------|
| SEV-1 | Production down, data loss, security incident | 5 min | Page primary + manager |
| SEV-2 | Major feature broken, degraded performance for >10% users | 15 min | Page primary |
| SEV-3 | Minor feature broken, small user impact | 1 hour | Ticket, no page |
| SEV-4 | Cosmetic, no user impact | Next business day | Ticket |
```

Create `docs/runbooks/incidents/comms-templates.md` with status-page update templates (investigating / identified / monitoring / resolved) and Slack announcement templates.

## Step 5: Seed On-Call Onboarding

Create `docs/runbooks/on-call/rotation.md`:

```markdown
# On-Call Rotation

**Primary rotation:** <pagerduty-schedule-link>
**Secondary / backup:** <pagerduty-schedule-link>
**Shift length:** 1 week, handoff at Monday 10:00 local time

## Before your first shift (checklist)
- [ ] Access to production monitoring (Grafana, Datadog, Sentry)
- [ ] PagerDuty mobile app installed and push notifications tested
- [ ] `kubectl` / cloud CLI credentials working against prod
- [ ] Read every service runbook in `docs/runbooks/services/`
- [ ] Shadow at least one shift with the previous primary
- [ ] Know how to file a postmortem (see `postmortems/template.md`)

## Handoff checklist
- [ ] Open incidents summary
- [ ] Ongoing deploys / feature flags
- [ ] Scheduled maintenance this week
- [ ] Known noisy alerts under investigation
```

## Step 6: Seed Postmortem Template

Create `docs/runbooks/postmortems/template.md` with sections: Summary, Timeline, Impact, Root cause, Contributing factors, What went well, What went poorly, Action items (with owner + due date), and a reminder that postmortems are **blameless**.

## Step 7: Wire Alerts to Runbooks

### Prometheus alert rules

Add `runbook_url` annotation to every alert:

```yaml
- alert: HighErrorRate
  expr: rate(http_requests_total{code=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.01
  for: 5m
  annotations:
    summary: "High 5xx rate on {{ $labels.service }}"
    runbook_url: "https://docs.example.com/runbooks/services/{{ $labels.service }}#2-higherrorrate"
```

### PagerDuty Events API v2

Include a `links` block in every event payload:

```json
{
  "routing_key": "<integration-key>",
  "event_action": "trigger",
  "payload": { "summary": "...", "severity": "error", "source": "<svc>" },
  "links": [
    { "href": "https://docs.example.com/runbooks/services/<svc>#<alert>", "text": "Runbook" },
    { "href": "https://grafana.example.com/d/<uid>", "text": "Dashboard" }
  ]
}
```

### Opsgenie Alert API

```json
{
  "message": "HighErrorRate on payments",
  "alias": "payments-high-error-rate",
  "details": { "runbook": "https://docs.example.com/runbooks/services/payments#2-higherrorrate" },
  "tags": ["sev-2", "payments"]
}
```

## Step 8: PagerDuty / Opsgenie Integration Checklist

Walk the user through (and record status in `docs/runbooks/on-call/integration-status.md`):

- [ ] Service registered with a unique integration key per environment
- [ ] Escalation policy configured (primary → secondary → manager after 15m)
- [ ] Business-hours vs. after-hours routing rules
- [ ] Maintenance window scheduling documented
- [ ] Event rules to deduplicate flapping alerts
- [ ] Suppress alerts during known deploys (deploy-tracking integration)
- [ ] Test page fired end-to-end from monitoring → pager → ack → resolve

## Step 9: Link from README

Add to top-level `README.md`:

```markdown
## On-call / Operations
If you are on-call, start at [`docs/runbooks/`](./docs/runbooks/README.md).
```

## Step 10: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name runbooks --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 11: Verify Setup

1. `docs/runbooks/` tree exists with README, template, severity matrix, and postmortem template
2. At least one service runbook filled in (the service most likely to page)
3. Alert rules include `runbook_url` annotation (`grep -r runbook_url prometheus/ | wc -l` > 0)
4. Paging provider payloads include a `links` / `details.runbook` entry
5. README links to `docs/runbooks/`
6. Integration checklist saved with current state

## Reference

- Google SRE workbook — runbook chapter: https://sre.google/workbook/on-call/
- PagerDuty Events API v2: https://developer.pagerduty.com/docs/events-api-v2/overview/
- Opsgenie Alert API: https://docs.opsgenie.com/docs/alert-api
- Blameless postmortems: https://www.atlassian.com/incident-management/postmortem/blameless
