# argocd-gitops — Configuration

## 1. Configuration Options Table

| Option | Values | Default | Where |
|--------|--------|---------|-------|
| `automatedSync` | `true`, `false` | `true` (dev), `false` (prod) | `spec.syncPolicy.automated` |
| `selfHeal` | `true`, `false` | `true` | `spec.syncPolicy.automated.selfHeal` |
| `prune` | `true`, `false` | `true` | `spec.syncPolicy.automated.prune` |
| `retryLimit` | integer | `5` | `spec.syncPolicy.retry.limit` |
| `retryBackoff` | duration | `5s → 3m (factor 2)` | `spec.syncPolicy.retry.backoff` |
| `serverSideApply` | `true`, `false` | `true` | `syncOptions: ServerSideApply=true` |
| `createNamespace` | `true`, `false` | `true` | `syncOptions: CreateNamespace=true` |
| `pruneLast` | `true`, `false` | `true` | `syncOptions: PruneLast=true` |
| `syncWave` | integer | per-resource | `metadata.annotations["argocd.argoproj.io/sync-wave"]` |
| `revisionHistoryLimit` | integer | `10` | `spec.revisionHistoryLimit` |
| `ignoreDifferences` | list | `[]` | `spec.ignoreDifferences` |

## 2. Switch Sync Mode

### Manual → Automated

```yaml
syncPolicy:
  automated:
    prune: true
    selfHeal: true
```

### Automated → Manual (prod freeze)

```yaml
syncPolicy: {}   # or remove entirely
```

Trigger manual sync: `argocd app sync frontend-prod`.

## 3. Ignore Noisy Diffs

Controllers (HPA, operator) may rewrite fields; exclude them from drift:

```yaml
spec:
  ignoreDifferences:
    - group: apps
      kind: Deployment
      jsonPointers:
        - /spec/replicas          # HPA owns this
    - group: ''
      kind: Service
      jsonPointers:
        - /spec/clusterIP
        - /spec/clusterIPs
```

## 4. Sync Windows

Configure in `AppProject` for maintenance schedules:

```yaml
spec:
  syncWindows:
    - kind: deny
      schedule: '0 22 * * FRI'
      duration: 60h
      applications: ['*prod*']
      manualSync: false
    - kind: allow
      schedule: '0 9 * * MON-FRI'
      duration: 9h
      applications: ['*']
      manualSync: true
```

## 5. Progressive Rollout via Sync Waves

Ensure infrastructure settles before app resources:

```yaml
# namespace.yaml
metadata:
  annotations:
    argocd.argoproj.io/sync-wave: "-10"

# configmap.yaml
metadata:
  annotations:
    argocd.argoproj.io/sync-wave: "-5"

# deployment.yaml
metadata:
  annotations:
    argocd.argoproj.io/sync-wave: "0"

# ingress.yaml
metadata:
  annotations:
    argocd.argoproj.io/sync-wave: "10"
```

## 6. Multi-Source Apps

Combine Helm chart with values from a separate repo:

```yaml
spec:
  sources:
    - chart: my-chart
      repoURL: oci://ghcr.io/<owner>/charts
      targetRevision: 1.2.0
      helm:
        valueFiles:
          - $values/envs/prod/values.yaml
    - repoURL: https://github.com/<owner>/gitops-values.git
      targetRevision: main
      ref: values
```

## 7. ApplicationSet Generators

### Git directory

```yaml
generators:
  - git:
      repoURL: https://github.com/<owner>/<repo>.git
      revision: main
      directories:
        - path: k8s/overlays/*
```

### Matrix (combining generators)

```yaml
generators:
  - matrix:
      generators:
        - clusters: { selector: { matchLabels: { env: prod } } }
        - git:
            repoURL: https://github.com/<owner>/<repo>.git
            directories: [ { path: k8s/overlays/*/apps/* } ]
```

## 8. RBAC

`AppProject` scoped permissions:

```yaml
spec:
  roles:
    - name: ci
      policies:
        - p, proj:default:ci, applications, sync, default/*, allow
        - p, proj:default:ci, applications, get, default/*, allow
      jwtTokens: []
```

Generate CI token:

```bash
argocd proj role create-token default ci --expires-in 90d
```

## 9. Webhook for Instant Syncs

Configure a GitHub webhook to `https://<argocd>/api/webhook` (Content type: `application/json`). Argo CD syncs within ~5s instead of the polling interval (default 3m).

## 10. Notifications

Install [argocd-notifications](https://argocd-notifications.readthedocs.io/) and annotate:

```yaml
metadata:
  annotations:
    notifications.argoproj.io/subscribe.on-sync-failed.slack: my-channel
    notifications.argoproj.io/subscribe.on-health-degraded.slack: my-channel
```

## 11. Drift-Detection Babysitter Process

```bash
babysitter run:create \
  --process-id argocd-drift \
  --entry .a5c/processes/argocd/drift.js#process \
  --prompt "Query argocd for any Application in OutOfSync state and open a fix PR" \
  --json
```

## 12. Rollback

```bash
argocd app history frontend-prod
argocd app rollback frontend-prod <revision>
```

Argo CD stores up to `spec.revisionHistoryLimit` prior deployments per Application.
