# kustomize — Install Instructions

Scaffold a [Kustomize](https://kustomize.io/) project: `base/` with shared manifests and `overlays/{dev,staging,prod}` with per-environment patches. Adds CI validation via `kustomize build | kubeconform` and optional `kustomize fn` function pipelines. Good fit when you want template-free YAML layering without learning Helm's Go-templates.

## Step 1: Interview the User

### Stage 1: Project Analysis

Before asking questions, analyze the project:
1. Check for existing `kustomization.yaml` files anywhere in the repo
2. Check for existing `deploy/`, `k8s/`, `manifests/` directories
3. Check for existing Helm charts (kustomize can render charts, but the primary pattern is raw YAML)
4. Check for existing ArgoCD `Application` / Flux `Kustomization` CRs (informs overlay paths)
5. Detect target Kubernetes version from any existing manifests (`apiVersion`)
6. Summarize findings

### Stage 2: Layout Shape

Ask:

1. **Classic** — `base/` + `overlays/{dev,staging,prod}`
2. **Components** — `base/` + `components/<feature>` reusable across overlays (Kustomize Components)
3. **Multi-tenant** — `base/` + `overlays/<tenant>/<env>/` nested
4. **Monorepo per-service** — `services/<svc>/{base,overlays}` for multiple apps in one repo

### Stage 3: Environments

Ask which overlays to scaffold (multi-select):
- `dev` (default on)
- `staging` (default on)
- `prod` (default on)
- `local` / `kind` / `minikube`
- `qa`
- Custom names

### Stage 4: Workloads

Ask which base resources to create:

- Deployment + Service
- Ingress / Gateway
- ConfigMap / Secret (with `configMapGenerator` / `secretGenerator`)
- HorizontalPodAutoscaler
- PodDisruptionBudget
- NetworkPolicy
- ServiceMonitor (Prometheus operator)

### Stage 5: Validation

Ask:
- Validate with `kubeconform`? (default: yes)
- Run `kustomize build` in CI per overlay? (default: yes)
- Enable strict mode (reject unknown fields)? (default: yes)
- Validate per target Kubernetes version? (default: 1.30)
- Use `kustomize fn` for transformers (e.g., set-image, namespace)? (default: no, opt in)

### Stage 6: Image Tagging

Ask:
- Should overlays pin image tags? (default: yes, prod pins by digest)
- Update tags via `kustomize edit set image` in CI on tag/release? (default: yes)

## Step 2: Install Kustomize and kubeconform

```bash
# Kustomize (standalone; kubectl embeds an older version)
brew install kustomize
# or:
curl -s "https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh" | bash

# kubeconform
brew install kubeconform
```

## Step 3: Scaffold Directory Layout

```bash
mkdir -p k8s/base
mkdir -p k8s/overlays/{dev,staging,prod}
```

### `k8s/base/kustomization.yaml`

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

commonLabels:
  app.kubernetes.io/name: <appname>
  app.kubernetes.io/managed-by: kustomize

resources:
  - deployment.yaml
  - service.yaml
  - configmap.yaml

configMapGenerator:
  - name: <appname>-config
    behavior: create
    literals:
      - LOG_LEVEL=info
```

### `k8s/base/deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: <appname>
spec:
  replicas: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: <appname>
  template:
    metadata:
      labels:
        app.kubernetes.io/name: <appname>
    spec:
      containers:
        - name: app
          image: <registry>/<appname>:placeholder
          ports: [{ containerPort: 8080 }]
          resources:
            requests: { cpu: 100m, memory: 128Mi }
            limits:   { cpu: 500m, memory: 512Mi }
          livenessProbe:
            httpGet: { path: /healthz, port: 8080 }
          readinessProbe:
            httpGet: { path: /ready, port: 8080 }
```

### `k8s/overlays/dev/kustomization.yaml`

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: <appname>-dev
namePrefix: dev-

resources:
  - ../../base

images:
  - name: <registry>/<appname>
    newTag: dev-latest

patches:
  - path: patch-replicas.yaml
    target: { kind: Deployment, name: <appname> }

configMapGenerator:
  - name: <appname>-config
    behavior: merge
    literals:
      - LOG_LEVEL=debug
```

### `k8s/overlays/prod/kustomization.yaml`

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: <appname>
namePrefix: ""

resources:
  - ../../base

images:
  - name: <registry>/<appname>
    digest: sha256:<pin-real-digest-here>

replicas:
  - name: <appname>
    count: 3

patches:
  - path: patch-resources.yaml
    target: { kind: Deployment, name: <appname> }
  - path: patch-hpa.yaml
    target: { kind: Deployment, name: <appname> }
```

## Step 4: Patches

### `k8s/overlays/dev/patch-replicas.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: <appname> }
spec:
  replicas: 1
```

### `k8s/overlays/prod/patch-resources.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: <appname> }
spec:
  template:
    spec:
      containers:
        - name: app
          resources:
            requests: { cpu: 500m, memory: 512Mi }
            limits:   { cpu: "2",  memory: 2Gi }
```

## Step 5: Components (Optional)

For features you want to toggle per overlay:

```
k8s/components/
├── monitoring/
│   ├── kustomization.yaml
│   └── servicemonitor.yaml
└── networkpolicy/
    ├── kustomization.yaml
    └── netpol.yaml
```

`k8s/components/monitoring/kustomization.yaml`:

```yaml
apiVersion: kustomize.config.k8s.io/v1alpha1
kind: Component

resources:
  - servicemonitor.yaml
```

Opt in from overlays:

```yaml
components:
  - ../../components/monitoring
```

## Step 6: Render and Validate Locally

```bash
kustomize build k8s/overlays/dev | kubeconform -strict -summary -kubernetes-version 1.30.0
kustomize build k8s/overlays/prod | kubeconform -strict -summary -kubernetes-version 1.30.0
```

Common issues:
- `Invalid value: "": object name may not be empty` — missing `metadata.name` on a patch target
- `unable to find api field in struct` — wrong `apiVersion` for current cluster
- `images` entry not applied — `name:` must match the exact image string in the base, before tagging

## Step 7: CI Workflow

Create `.github/workflows/kustomize.yml`:

```yaml
name: kustomize

on:
  pull_request:
    paths:
      - 'k8s/**'
      - '.github/workflows/kustomize.yml'
  push:
    branches: [main]
    paths:
      - 'k8s/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        overlay: [dev, staging, prod]
    steps:
      - uses: actions/checkout@v6

      - uses: imranismail/setup-kustomize@v2
        with:
          kustomize-version: v5.5.0

      - name: Install kubeconform
        run: |
          curl -fsSL https://github.com/yannh/kubeconform/releases/latest/download/kubeconform-linux-amd64.tar.gz | tar xz
          sudo mv kubeconform /usr/local/bin/

      - name: Build
        run: kustomize build k8s/overlays/${{ matrix.overlay }} > dist.yaml

      - name: kubeconform
        run: |
          kubeconform -strict -summary -kubernetes-version 1.30.0 \
            -schema-location default \
            -schema-location 'https://raw.githubusercontent.com/datreeio/CRDs-catalog/main/{{.Group}}/{{.ResourceKind}}_{{.ResourceAPIVersion}}.json' \
            dist.yaml

      - name: Upload rendered manifest
        uses: actions/upload-artifact@v4
        with:
          name: rendered-${{ matrix.overlay }}
          path: dist.yaml
```

## Step 8: Image Tag Automation

Add a release step that updates the overlay's image tag:

```yaml
- name: Set image
  working-directory: k8s/overlays/prod
  run: |
    kustomize edit set image <registry>/<appname>=@sha256:${{ steps.digest.outputs.sha }}
    git config user.email "ci@example.com"
    git config user.name "ci"
    git add kustomization.yaml
    git commit -m "chore(prod): bump image to ${{ github.ref_name }}"
    git push
```

## Step 9: Install Scripts

Add to `package.json` (or a Makefile):

```json
{
  "scripts": {
    "k8s:render:dev": "kustomize build k8s/overlays/dev",
    "k8s:render:prod": "kustomize build k8s/overlays/prod",
    "k8s:apply:dev": "kustomize build k8s/overlays/dev | kubectl apply -f -",
    "k8s:diff:prod": "kustomize build k8s/overlays/prod | kubectl diff -f -"
  }
}
```

## Step 10: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name kustomize --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 11: Verify Setup

1. `kustomize build k8s/overlays/dev` outputs valid YAML
2. `kustomize build k8s/overlays/prod | kubeconform -strict` passes
3. Each overlay applies labels, namespace, and image transforms correctly
4. CI matrix runs validation per overlay
5. `kubectl apply --dry-run=server -k k8s/overlays/dev` succeeds against a cluster
6. Image tag edits via `kustomize edit set image` are reflected in build output

## Reference

- Kustomize: https://kubectl.docs.kubernetes.io/references/kustomize/
- Components: https://kubectl.docs.kubernetes.io/guides/config_management/components/
- kubeconform: https://github.com/yannh/kubeconform
- CRDs catalog: https://github.com/datreeio/CRDs-catalog
- kustomize fn: https://kubectl.docs.kubernetes.io/references/kustomize/cmd/fn/
