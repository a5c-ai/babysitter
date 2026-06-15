# slo-config — Install Instructions

Set up SLO-as-code for your project — define Service Level Objectives in YAML, generate Prometheus recording + alerting rules via **sloth** or **OpenSLO**, and track error budget burn with multi-window multi-burn-rate alerts. No dashboards ship by default; data first, pretty graphs later.

## Step 1: Interview the User

### Stage 1: Project Analysis

Before asking questions, analyze the project:
1. Detect Prometheus / Mimir / Thanos setup: `prometheus.yml`, `prometheus/rules/`, `mimir-*`, `thanos-*`
2. Detect existing SLO tooling: `sloth.yaml`, `.sloth/`, `openslo/`, `slo/*.yaml`, `.slo/`
3. Detect existing recording rules: `rules/`, `alerts/`, `*.rules.yml`
4. Detect metric naming conventions: `http_requests_total`, `http_server_request_duration_seconds`, custom
5. Detect Grafana: `grafana/`, `dashboards/`, provisioning config
6. Check which services exist (CODEOWNERS, service catalog, or infer from deploy pipelines)
7. Summarize findings to the user

### Stage 2: SLO Tooling Choice

Ask which tool to use:

| Tool | Pros | Cons |
|------|------|------|
| **sloth** | Opinionated, generates MWMB alerts, single binary, Kubernetes-native CRD | Prometheus-only, YAML dialect is sloth-specific |
| **OpenSLO** | CNCF spec, vendor-neutral, supported by Nobl9 / Sloth / pyrra | Tooling still maturing; generator per vendor |
| **pyrra** | Go operator, UI, generates rules from OpenSLO | Requires K8s deployment |
| **custom** | Just hand-write Prometheus rules | No framework support |

Default recommendation: **sloth** for Prometheus-only shops, **OpenSLO + pyrra** for K8s-native shops.

### Stage 3: SLO Scope

Ask which SLOs to scaffold per service (multi-select):

1. **Availability** — `sum(rate(requests{code!~"5.."}[5m])) / sum(rate(requests[5m]))`
2. **Latency** — `histogram_quantile(0.95, rate(duration_seconds_bucket[5m])) < 0.3`
3. **Freshness** — `time() - max(last_success_timestamp) < 300` (for batch jobs)
4. **Correctness** — business-metric specific (e.g. `payment_success_rate`)

### Stage 4: Objective Target

For each SLO, ask the objective (%):

- Low-risk public website: `99.0%`
- Typical SaaS backend: `99.5%` or `99.9%`
- Payment / auth / regulated: `99.95%` or `99.99%`

Reminder: every additional 9 roughly 10× the engineering cost. 99.999% is for NASA, not for your CRUD app.

### Stage 5: Error Budget Policy

Ask:
- Burn-rate alert windows: MWMB 1h/5m fast + 6h/30m slow (default sloth) vs. custom
- What to do on budget exhaustion? (default: freeze feature deploys until budget recovers)
- Who gets paged on fast burn? (default: primary on-call)

## Step 2: Install sloth

### Option A — Binary

```bash
curl -sSL https://github.com/slok/sloth/releases/latest/download/sloth-linux-amd64 \
  -o /usr/local/bin/sloth
chmod +x /usr/local/bin/sloth
sloth version
```

### Option B — Docker

```bash
docker run --rm -v "$PWD:/data" ghcr.io/slok/sloth:latest version
```

### Option C — Kubernetes operator

```bash
kubectl apply -f https://github.com/slok/sloth/releases/latest/download/sloth.yaml
```

## Step 3: Scaffold SLO Definitions

```bash
mkdir -p slo/
```

Create `slo/payments.yaml`:

```yaml
version: "prometheus/v1"
service: "payments"
labels:
  team: "platform"
  tier: "1"
slos:
  - name: "requests-availability"
    objective: 99.9
    description: "99.9% of payment requests succeed over 28d"
    sli:
      events:
        error_query: sum(rate(http_requests_total{job="payments",code=~"5.."}[{{.window}}]))
        total_query: sum(rate(http_requests_total{job="payments"}[{{.window}}]))
    alerting:
      name: PaymentsHighErrorBudgetBurn
      labels:
        severity: page
      annotations:
        summary: "Payments error budget burning too fast"
        runbook_url: "https://docs.example.com/runbooks/services/payments#budget-burn"
      page_alert:
        labels: { severity: page }
      ticket_alert:
        labels: { severity: ticket }

  - name: "requests-latency"
    objective: 99.0
    description: "99% of payment requests complete under 300ms over 28d"
    sli:
      events:
        error_query: |
          sum(rate(http_request_duration_seconds_count{job="payments"}[{{.window}}]))
          -
          sum(rate(http_request_duration_seconds_bucket{job="payments",le="0.3"}[{{.window}}]))
        total_query: sum(rate(http_request_duration_seconds_count{job="payments"}[{{.window}}]))
    alerting:
      name: PaymentsLatencyBudgetBurn
      labels: { severity: page }
      page_alert: { labels: { severity: page } }
      ticket_alert: { labels: { severity: ticket } }
```

Scaffold one file per service. Use the service catalog or CODEOWNERS to enumerate.

## Step 4: Generate Prometheus Rules

```bash
mkdir -p prometheus/rules/slo
sloth generate -i slo/ -o prometheus/rules/slo/
```

This produces recording rules (for SLI, error budget, and burn rate) plus alerting rules (MWMB) per SLO file.

Inspect the output:

```bash
head -80 prometheus/rules/slo/payments.yml
```

## Step 5: Wire Rules into Prometheus

Edit `prometheus.yml`:

```yaml
rule_files:
  - "rules/slo/*.yml"
  - "rules/*.yml"
```

Reload Prometheus:

```bash
curl -X POST http://prometheus:9090/-/reload
```

Verify recording rules fire:

```bash
curl -s 'http://prometheus:9090/api/v1/query?query=slo:sli_error:ratio_rate5m' | jq .
```

## Step 6: Create the CI Workflow

Create `.github/workflows/slo.yml`:

```yaml
name: SLO rules

on:
  pull_request:
    paths:
      - 'slo/**'
      - 'prometheus/rules/slo/**'
      - '.github/workflows/slo.yml'
  push:
    branches: [main]
    paths:
      - 'slo/**'

jobs:
  generate-and-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - name: Install sloth
        run: |
          curl -sSL https://github.com/slok/sloth/releases/latest/download/sloth-linux-amd64 \
            -o /usr/local/bin/sloth
          chmod +x /usr/local/bin/sloth
      - name: Regenerate rules
        run: sloth generate -i slo/ -o prometheus/rules/slo/
      - name: Fail if generated rules drifted from committed output
        run: |
          if ! git diff --quiet prometheus/rules/slo/; then
            echo "::error::SLO rules are out of date. Run 'sloth generate -i slo/ -o prometheus/rules/slo/' and commit."
            git diff prometheus/rules/slo/
            exit 1
          fi
      - name: promtool check rules
        run: |
          docker run --rm -v "$PWD:/work" -w /work prom/prometheus:latest \
            promtool check rules prometheus/rules/slo/*.yml
      - name: promtool unit tests
        if: hashFiles('prometheus/rules/slo/tests/*.yml') != ''
        run: |
          docker run --rm -v "$PWD:/work" -w /work prom/prometheus:latest \
            promtool test rules prometheus/rules/slo/tests/*.yml
```

## Step 7: Error Budget Dashboard (Optional)

If Grafana is present, import the sloth-provided dashboard:

```bash
mkdir -p grafana/dashboards
curl -sSL https://raw.githubusercontent.com/slok/sloth/main/examples/grafana-dashboard.json \
  -o grafana/dashboards/sloth-slo.json
```

Provision via Grafana's file-based provisioning or upload manually.

## Step 8: Error Budget Policy

Create `docs/slo/policy.md`:

```markdown
# Error Budget Policy

## Budget states
- **Healthy** (>50% budget remaining): normal operations
- **Warning** (10–50%): feature velocity continues; reliability work prioritized
- **Exhausted** (<10%): **feature deploys frozen**; only reliability fixes + critical security patches ship until budget recovers to >25%

## On fast burn (2% of monthly budget in 1h)
- Page primary on-call
- Incident opened automatically
- Runbook linked via `runbook_url` annotation

## On slow burn (10% in 6h)
- Ticket opened, triaged within 1 business day
- Service owner notified in #slo-alerts
```

## Step 9: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name slo-config --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 10: Verify Setup

1. `slo/*.yaml` exists for every tier-1 service
2. `sloth generate` runs cleanly and produces `prometheus/rules/slo/*.yml`
3. `promtool check rules prometheus/rules/slo/*.yml` passes
4. Prometheus loads the new rule files without errors
5. `slo:sli_error:ratio_rate5m` and `slo:current_burn_rate:ratio` metrics are present
6. At least one burn-rate alert fires during a simulated bad-minute test
7. CI workflow blocks drift between `slo/` sources and generated rules
8. Error budget policy document committed and reviewed

## Reference

- sloth documentation: https://sloth.dev/
- OpenSLO spec: https://github.com/OpenSLO/OpenSLO
- pyrra: https://github.com/pyrra-dev/pyrra
- Google SRE workbook — implementing SLOs: https://sre.google/workbook/implementing-slos/
- Alerting on SLOs (MWMB): https://sre.google/workbook/alerting-on-slos/
