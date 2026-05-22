# argocd-gitops — Install Instructions

Scaffold an [Argo CD](https://argo-cd.readthedocs.io/) GitOps layout: `Application` manifests, the app-of-apps bootstrap pattern, sync-wave ordering for dependency management, and CI that lints manifests and detects drift between desired (git) and actual (cluster) state. Assumes Argo CD is already installed in the target cluster (or provides notes to install it).

## Step 1: Interview the User

### Stage 1: Project Analysis

Before asking questions, analyze the project:
1. Check for existing `argocd/`, `gitops/`, or `argo-apps/` directories
2. Check for existing Helm charts or kustomize overlays that Applications would reference
3. Check for existing ArgoCD CRs anywhere: `grep -Rl 'argoproj.io' .`
4. Check whether the Argo CD operator is already deployed (via cluster access if available): `kubectl get ns argocd`
5. Detect repo URL for `repoURL` defaults
6. Summarize findings

### Stage 2: Topology

Ask:

1. **Single cluster, single environment** — One Application, one target
2. **Single cluster, multi-env** — Multiple Applications (`app-dev`, `app-staging`, `app-prod`)
3. **Multi-cluster** — ApplicationSet with cluster generator
4. **Tenants** — ApplicationSet with git-directory generator per tenant

### Stage 3: App-of-Apps Layout

Ask whether to bootstrap with the app-of-apps pattern:

- **Yes** (default) — Root `Application` deploys child Applications from `gitops/apps/*.yaml`
- **No** — Maintain each Application manually in Argo CD UI/CLI

### Stage 4: Source Type

Ask what the Applications render:

| Source | Notes |
|--------|-------|
| Kustomize | `spec.source.path` points to an overlay |
| Helm (chart dir) | `spec.source.helm.valueFiles` |
| Helm (OCI/repo) | `spec.source.chart` + `spec.source.repoURL` oci:// |
| Plain YAML | `spec.source.path` + directory recurse |
| Multiple sources | `spec.sources[]` (Argo 2.6+) |

### Stage 5: Sync Policy

Ask:
- Automated sync? (default: yes for non-prod, manual for prod)
- Self-heal (revert manual cluster edits)? (default: yes for automated)
- Prune deleted resources? (default: yes)
- Retry on failure? (default: 5 retries, exponential backoff)
- Sync windows (maintenance schedules)? (default: none)

### Stage 6: Drift Detection

Ask:
- Run drift detection in CI on PR? (default: yes, via `argocd app diff --local`)
- Fail PR if drift is detected? (default: warn only initially)

## Step 2: Scaffold Directory Layout

```bash
mkdir -p gitops/bootstrap
mkdir -p gitops/apps
mkdir -p gitops/projects
```

```
gitops/
├── bootstrap/
│   └── root-app.yaml        # app-of-apps entry point
├── projects/
│   └── default.yaml         # AppProject definitions
└── apps/
    ├── frontend-dev.yaml
    ├── frontend-staging.yaml
    ├── frontend-prod.yaml
    └── backend-prod.yaml
```

## Step 3: Root Application (App-of-Apps)

`gitops/bootstrap/root-app.yaml`:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: root
  namespace: argocd
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  project: default
  source:
    repoURL: https://github.com/<owner>/<repo>.git
    targetRevision: main
    path: gitops/apps
    directory:
      recurse: true
      include: '*.yaml'
  destination:
    server: https://kubernetes.default.svc
    namespace: argocd
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
      - PruneLast=true
```

Bootstrap once:

```bash
kubectl apply -n argocd -f gitops/bootstrap/root-app.yaml
```

Subsequent changes to `gitops/apps/*.yaml` propagate automatically.

## Step 4: Project

`gitops/projects/default.yaml`:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata:
  name: default
  namespace: argocd
spec:
  description: Default project
  sourceRepos:
    - https://github.com/<owner>/<repo>.git
    - oci://ghcr.io/<owner>/charts
  destinations:
    - namespace: '*'
      server: https://kubernetes.default.svc
  clusterResourceWhitelist:
    - group: '*'
      kind: '*'
  namespaceResourceWhitelist:
    - group: '*'
      kind: '*'
```

## Step 5: Per-Environment Application

`gitops/apps/frontend-prod.yaml`:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: frontend-prod
  namespace: argocd
  annotations:
    argocd.argoproj.io/sync-wave: "10"
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  project: default
  source:
    repoURL: https://github.com/<owner>/<repo>.git
    targetRevision: main
    path: k8s/overlays/prod
  destination:
    server: https://kubernetes.default.svc
    namespace: frontend
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
      - ServerSideApply=true
    retry:
      limit: 5
      backoff: { duration: 5s, factor: 2, maxDuration: 3m }
```

Non-prod variant with more permissive sync:

```yaml
# frontend-dev.yaml — auto-sync, self-heal on
metadata:
  name: frontend-dev
  annotations:
    argocd.argoproj.io/sync-wave: "0"
spec:
  source: { targetRevision: main, path: k8s/overlays/dev }
  destination: { namespace: frontend-dev }
  syncPolicy: { automated: { prune: true, selfHeal: true } }
```

## Step 6: Sync Waves

Order resources or Applications by wave (lower goes first):

| Wave | Resource |
|------|----------|
| -10 | Namespaces, CRDs |
| -5  | Secrets / ConfigMaps |
| 0   | Databases (StatefulSets) |
| 5   | Backends (Deployments) |
| 10  | Frontends |
| 15  | Ingress / Gateway |

Apply as annotation:

```yaml
metadata:
  annotations:
    argocd.argoproj.io/sync-wave: "-10"
```

## Step 7: ApplicationSet (Multi-Cluster / Multi-Tenant)

`gitops/apps/appset-envs.yaml`:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: frontend-all-envs
  namespace: argocd
spec:
  generators:
    - list:
        elements:
          - env: dev
            wave: "0"
          - env: staging
            wave: "5"
          - env: prod
            wave: "10"
  template:
    metadata:
      name: 'frontend-{{env}}'
      annotations:
        argocd.argoproj.io/sync-wave: '{{wave}}'
    spec:
      project: default
      source:
        repoURL: https://github.com/<owner>/<repo>.git
        targetRevision: main
        path: 'k8s/overlays/{{env}}'
      destination:
        server: https://kubernetes.default.svc
        namespace: 'frontend-{{env}}'
      syncPolicy:
        automated: { prune: true, selfHeal: true }
```

Cluster generator for multi-cluster:

```yaml
generators:
  - clusters:
      selector:
        matchLabels:
          env: prod
```

## Step 8: CI — Manifest Validation + Drift Detection

Create `.github/workflows/argocd.yml`:

```yaml
name: argocd-gitops

on:
  pull_request:
    paths: ['gitops/**', 'k8s/**', 'charts/**']

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6

      - name: Install tooling
        run: |
          curl -sSL -o argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
          chmod +x argocd && sudo mv argocd /usr/local/bin/
          curl -fsSL https://github.com/yannh/kubeconform/releases/latest/download/kubeconform-linux-amd64.tar.gz | tar xz
          sudo mv kubeconform /usr/local/bin/

      - name: Validate Application manifests
        run: |
          kubeconform -strict -summary \
            -schema-location default \
            -schema-location 'https://raw.githubusercontent.com/datreeio/CRDs-catalog/main/{{.Group}}/{{.ResourceKind}}_{{.ResourceAPIVersion}}.json' \
            gitops/**/*.yaml

      - name: argocd app lint
        run: |
          for app in gitops/apps/*.yaml; do
            argocd app lint --file "$app" || exit 1
          done

  drift:
    runs-on: ubuntu-latest
    needs: lint
    if: vars.ARGOCD_SERVER != ''
    steps:
      - uses: actions/checkout@v6

      - name: argocd login
        run: |
          argocd login "${{ vars.ARGOCD_SERVER }}" \
            --auth-token "${{ secrets.ARGOCD_TOKEN }}" \
            --grpc-web

      - name: Diff apps
        continue-on-error: true
        run: |
          for app in frontend-prod backend-prod; do
            echo "=== $app ==="
            argocd app diff "$app" --local gitops/apps --grpc-web || true
          done
```

## Step 9: Optional — Notifications & Rollouts

Install the [argocd-notifications](https://argocd-notifications.readthedocs.io/) controller for Slack/email on sync failures, and consider [Argo Rollouts](https://argo-rollouts.readthedocs.io/) for progressive delivery (canary/blue-green) — both complement this plugin.

## Step 10: Install Scripts

```json
{
  "scripts": {
    "argocd:sync:prod": "argocd app sync frontend-prod --grpc-web",
    "argocd:diff:prod": "argocd app diff frontend-prod --local gitops/apps --grpc-web",
    "argocd:bootstrap": "kubectl apply -n argocd -f gitops/bootstrap/root-app.yaml"
  }
}
```

## Step 11: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name argocd-gitops --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 12: Verify Setup

1. `kubectl apply -n argocd -f gitops/bootstrap/root-app.yaml` creates the root
2. Argo CD UI shows the root app as Synced, with child apps listed
3. Edits to `gitops/apps/*.yaml` propagate to the cluster
4. Sync-wave ordering is respected (inspect Timeline in UI)
5. CI validates manifests and (optionally) reports drift

## Reference

- Argo CD: https://argo-cd.readthedocs.io/
- App of Apps pattern: https://argo-cd.readthedocs.io/en/stable/operator-manual/cluster-bootstrapping/
- Sync waves: https://argo-cd.readthedocs.io/en/stable/user-guide/sync-waves/
- ApplicationSet: https://argo-cd.readthedocs.io/en/stable/operator-manual/applicationset/
- argocd CLI: https://argo-cd.readthedocs.io/en/stable/user-guide/commands/argocd/
- argocd-notifications: https://argocd-notifications.readthedocs.io/
