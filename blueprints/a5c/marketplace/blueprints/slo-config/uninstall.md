# slo-config — Uninstall Instructions

## Step 1: Interview the User

Ask what to remove:

1. **Processes and configs only** — Remove babysitter processes but keep `slo/`, generated rules, workflow, and dashboards
2. **Everything** — Remove SLO definitions, generated Prometheus rules, workflow, dashboards, and policy doc
3. **Selective** — Let the user choose specific services or layers

**Warning**: Removing SLO definitions silently drops reliability signal. Burn-rate alerts will stop firing. Confirm with the user; recommend keeping the definitions even without the plugin.

## Step 2: Remove the CI Workflow

```bash
rm -f .github/workflows/slo.yml
```

If the SLO job was added to an existing workflow, remove only that job.

## Step 3: Remove Generated Prometheus Rules

```bash
rm -rf prometheus/rules/slo/
```

Edit `prometheus.yml` and remove the line:

```yaml
rule_files:
  - "rules/slo/*.yml"
```

Reload Prometheus:

```bash
curl -X POST http://prometheus:9090/-/reload
```

## Step 4: Remove SLO Definitions

```bash
rm -rf slo/
```

**Only remove** if the user confirms — these are hand-written spec files and often worth keeping even if the generator tooling is dropped.

## Step 5: Uninstall sloth

### Binary

```bash
rm -f /usr/local/bin/sloth
```

### Kubernetes operator

```bash
kubectl delete -f https://github.com/slok/sloth/releases/latest/download/sloth.yaml
```

### Docker

No uninstall; stop referencing the image in CI.

## Step 6: Remove Grafana Dashboard

```bash
rm -f grafana/dashboards/sloth-slo.json
```

If the dashboard was manually uploaded to Grafana, delete it via the Grafana UI.

## Step 7: Remove Error Budget Policy Doc

```bash
rm -f docs/slo/policy.md
rmdir docs/slo 2>/dev/null || true
```

## Step 8: Remove Alertmanager Routing (if added)

If routes were added to `alertmanager.yml` for SLO-specific severity (`severity: page` / `severity: ticket`), review and remove only the SLO-specific routes:

```yaml
route:
  routes:
    - matchers: [ 'severity = page', 'source = slo' ]  # remove this
      receiver: pagerduty
```

## Step 9: Remove Processes

```bash
rm -rf .a5c/processes/slo-config
```

## Step 10: Remove from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name slo-config --project --json
```

## Notes

- Existing `slo:*` recording rule metrics will remain in Prometheus storage per retention policy — no action required, they will age out
- Historical burn-rate alert fires remain in Alertmanager silences / history
- If any runbook links referenced SLO burn-rate alerts, update those runbooks after uninstall
- Dropping SLOs without a replacement means the team is flying blind on reliability; recommend migrating to an alternative (Nobl9, Grafana SLO, pyrra) before final removal
