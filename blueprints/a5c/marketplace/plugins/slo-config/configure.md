# slo-config — Configuration

## 1. Configuration Options Table

| Option | Values | Default | Where |
|--------|--------|---------|-------|
| `tool` | `sloth`, `openslo`, `pyrra`, `custom` | `sloth` | generator binary |
| `specDir` | path | `slo/` | source of truth SLO YAMLs |
| `outputDir` | path | `prometheus/rules/slo/` | generated rules |
| `sloWindow` | duration | `28d` | rolling window per SLO |
| `fastBurnAlert` | `on`, `off` | `on` | MWMB 1h/5m alert |
| `slowBurnAlert` | `on`, `off` | `on` | MWMB 6h/30m alert |
| `pageSeverity` | label value | `page` | fast-burn severity |
| `ticketSeverity` | label value | `ticket` | slow-burn severity |
| `defaultObjective` | percentage | `99.9` | applied if unspecified |
| `requireRunbookUrl` | `on`, `off` | `on` | CI check on alert annotations |
| `driftCheck` | `on`, `off` | `on` | CI fails if generated rules drifted |

## 2. Change SLO Window

Edit each SLO definition:

```yaml
slos:
  - name: "requests-availability"
    objective: 99.9
    # sloth uses a fixed 28d window by default;
    # override time_window explicitly:
    time_window: 30d  # if sloth config supports it
```

For finer control, migrate to pyrra / OpenSLO which support per-SLO windows natively.

## 3. Adjust Objective Target

```yaml
slos:
  - name: "requests-availability"
    objective: 99.95   # was 99.9
```

Each additional "9" tightens the burn-rate thresholds proportionally. Run `sloth generate` and review the resulting alert thresholds before committing.

## 4. Add a New SLI Type

### Freshness (for batch / streaming jobs)

```yaml
slos:
  - name: "ingest-freshness"
    objective: 99.5
    description: "Ingest lag < 5 minutes 99.5% of the time"
    sli:
      raw:
        error_ratio_query: |
          (
            time() - max(ingest_last_success_timestamp{job="ingest"})
          ) > 300
```

### Correctness (business metric)

```yaml
slos:
  - name: "payment-correctness"
    objective: 99.99
    sli:
      events:
        error_query: sum(rate(payment_result{status="mismatch"}[{{.window}}]))
        total_query: sum(rate(payment_result[{{.window}}]))
```

## 5. Change Alert Labels & Routing

```yaml
alerting:
  labels:
    team: "platform"
    slack_channel: "platform-oncall"
  page_alert:
    labels:
      severity: page
      pagerduty_service: payments-prod
  ticket_alert:
    labels:
      severity: ticket
      jira_project: PAYOPS
```

Then in `alertmanager.yml` route on `pagerduty_service` / `jira_project`.

## 6. Customize Burn-rate Windows

sloth default MWMB: 1h/5m (fast), 6h/30m (slow), 3d/6h (ticket), 3d/1d (informational).

To override (sloth `slo` field):

```yaml
slos:
  - name: "requests-availability"
    objective: 99.9
    alerting:
      page_alert:
        labels: { severity: page }
        # sloth exposes configuration via its config file, not per-SLO
```

For fine-grained control, switch to pyrra where each SLO specifies `burnrates`.

## 7. Multi-window Tests via `promtool`

Create `prometheus/rules/slo/tests/payments.test.yml`:

```yaml
rule_files:
  - ../payments.yml
tests:
  - interval: 1m
    input_series:
      - series: 'http_requests_total{job="payments",code="200"}'
        values: '600+60x60'
      - series: 'http_requests_total{job="payments",code="500"}'
        values: '0+12x60'
    alert_rule_test:
      - eval_time: 10m
        alertname: PaymentsHighErrorBudgetBurn
        exp_alerts:
          - exp_labels: { severity: page }
```

Run:

```bash
promtool test rules prometheus/rules/slo/tests/*.yml
```

## 8. Enforce Runbook URL

Add to the CI workflow:

```yaml
- name: Every SLO alert must have runbook_url
  run: |
    missing=$(yq '.groups[].rules[] | select(.alert != null) | select(.annotations.runbook_url == null) | .alert' prometheus/rules/slo/*.yml)
    if [ -n "$missing" ]; then
      echo "Missing runbook_url on alerts: $missing"; exit 1
    fi
```

## 9. Switch to OpenSLO + pyrra

```bash
mkdir -p slo-openslo/
# Translate each slo/*.yaml to OpenSLO format (apiVersion: openslo/v1)
```

Deploy pyrra operator:

```bash
kubectl apply -f https://github.com/pyrra-dev/pyrra/releases/latest/download/install.yaml
```

Apply SLOs as CRDs:

```bash
kubectl apply -f slo-openslo/
```

Remove the `sloth generate` step from CI; pyrra reconciles Prometheus rules in-cluster.

## 10. Exclude a Service Temporarily

Move the spec out of `slo/`:

```bash
mkdir -p slo/.disabled
mv slo/<service>.yaml slo/.disabled/
sloth generate -i slo/ -o prometheus/rules/slo/
```

CI will remove the generated rule file in the same PR.

## 11. Error-budget Burndown Report

Add a monthly process that queries Prometheus for budget consumption and opens an issue summarizing which services exhausted budget:

```bash
babysitter run:create \
  --process-id slo-monthly-burndown \
  --entry .a5c/processes/slo-config/burndown.js#process \
  --prompt "Compute per-service error budget burn for the last calendar month and open a summary issue" \
  --json
```
