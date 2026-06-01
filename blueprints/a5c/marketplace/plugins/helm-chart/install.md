# helm-chart — Install Instructions

Scaffold a Helm chart with `Chart.yaml`, templates, values schema, and a full CI feedback loop: `helm lint`, `helm-docs` for README generation, `kubeval`/`kubeconform` for schema validation against Kubernetes API versions, and a release workflow that packages and pushes to an OCI registry or GitHub Pages.

## Step 1: Interview the User

### Stage 1: Project Analysis

Before asking questions, analyze the project:
1. Check for existing `charts/`, `deploy/`, `helm/`, or `Chart.yaml` anywhere in the repo
2. Read `package.json`/`pyproject.toml`/`go.mod` to identify the app language (informs image references and template defaults)
3. Check for existing `Dockerfile`s — charts usually need image repo + tag values
4. Check for `.github/workflows/*.yml` to avoid workflow name collisions
5. Detect Kubernetes manifests already checked in (`kubectl` YAML, kustomize overlays)
6. Summarize findings to the user

### Stage 2: Chart Layout

Ask the user:

1. **Single chart** — One chart for one application (default)
2. **Chart library** — Multiple charts in `charts/<chartname>/` umbrella layout
3. **Library chart** — Reusable templates consumed by other charts (`type: library`)
4. **Subchart dependencies** — This chart depends on upstream charts (postgres, redis, etc.)

### Stage 3: Workload Type

Ask which primary workload to scaffold:

| Workload | Templates |
|----------|-----------|
| Deployment + Service + Ingress | `deployment.yaml`, `service.yaml`, `ingress.yaml`, `hpa.yaml` |
| StatefulSet + headless Service | `statefulset.yaml`, `service.yaml`, `pvc.yaml` |
| DaemonSet | `daemonset.yaml` |
| CronJob | `cronjob.yaml` |
| Job (one-off) | `job.yaml` |
| Custom (generic) | Blank `_helpers.tpl` + empty templates dir |

### Stage 4: Validation Stack

Ask:
- Run `helm lint`? (default: yes)
- Render and validate against Kubernetes schemas with `kubeconform`? (default: yes — preferred over `kubeval`)
- Generate `values.schema.json` for `values.yaml` type-checking? (default: yes)
- Generate README via `helm-docs`? (default: yes)
- Run Chart.yaml `appVersion`/`version` linting? (default: yes)

### Stage 5: Release Target

Ask:
- **OCI registry** (ghcr.io, ECR, GAR, ACR, Harbor) — `helm push oci://...` (default)
- **GitHub Pages / Chart Museum** — `helm repo index` + static hosting
- **Artifact Hub** — Register the repo for public discovery
- **None** — CI-only, never publish

### Stage 6: Chart Metadata

Ask for:
- Chart name (default: repo name)
- Description
- `appVersion` (default: current git tag or `0.1.0`)
- `version` (default: `0.1.0`)
- Maintainers (default: detect from `CODEOWNERS` / git log)
- Keywords
- Icon URL (optional)

## Step 2: Install Helm and Tooling

```bash
# Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# helm-docs
go install github.com/norwoodj/helm-docs/cmd/helm-docs@latest
# or:
brew install norwoodj/tap/helm-docs

# kubeconform
brew install kubeconform
# or:
curl -fsSL https://github.com/yannh/kubeconform/releases/latest/download/kubeconform-linux-amd64.tar.gz | tar xz

# helm unittest (optional)
helm plugin install https://github.com/helm-unittest/helm-unittest
```

## Step 3: Scaffold the Chart

```bash
mkdir -p charts
helm create charts/<chartname>
```

Replace the generated `values.yaml` with a minimal baseline (keep only what the app uses). Delete templates you won't render (the default scaffold includes `tests/test-connection.yaml` and `hpa.yaml`; keep them only if used).

### Suggested `charts/<chartname>/Chart.yaml`

```yaml
apiVersion: v2
name: <chartname>
description: <description>
type: application
version: 0.1.0
appVersion: "0.1.0"
kubeVersion: ">=1.28.0"
icon: https://...
home: https://github.com/<owner>/<repo>
sources:
  - https://github.com/<owner>/<repo>
maintainers:
  - name: <team>
    email: <contact>
keywords:
  - <keyword>
annotations:
  artifacthub.io/changes: |
    - Initial release
```

### Subchart Dependencies

If the app needs postgres/redis/etc., add to `Chart.yaml`:

```yaml
dependencies:
  - name: postgresql
    version: "15.x.x"
    repository: oci://registry-1.docker.io/bitnamicharts
    condition: postgresql.enabled
```

Run:

```bash
helm dependency update charts/<chartname>
```

## Step 4: Generate `values.schema.json`

Install the helm values schema plugin:

```bash
helm plugin install https://github.com/karuppiah7890/helm-schema-gen
helm schema-gen charts/<chartname>/values.yaml > charts/<chartname>/values.schema.json
```

Review and tighten constraints: mark required fields (`image.repository`, `image.tag`), add `enum` for environments, set `minimum`/`maximum` for replica counts.

`helm install` will reject invalid values against this schema.

## Step 5: Run helm-docs

```bash
helm-docs --chart-search-root charts/
```

Generates `charts/<chartname>/README.md` from `Chart.yaml` + annotations on `values.yaml` keys:

```yaml
# -- Number of replicas
replicaCount: 1

# -- Container image
image:
  # -- Image repository
  repository: nginx
  # -- Image tag (defaults to .Chart.AppVersion)
  tag: ""
```

## Step 6: Add Tests with helm-unittest (Optional)

Create `charts/<chartname>/tests/deployment_test.yaml`:

```yaml
suite: deployment
templates:
  - deployment.yaml
tests:
  - it: sets replicas from values
    set:
      replicaCount: 3
    asserts:
      - equal:
          path: spec.replicas
          value: 3

  - it: exposes container port
    asserts:
      - contains:
          path: spec.template.spec.containers[0].ports
          content:
            containerPort: 80
            protocol: TCP
```

Run:

```bash
helm unittest charts/<chartname>
```

## Step 7: Create CI Workflow

Create `.github/workflows/helm-ci.yml`:

```yaml
name: helm

on:
  pull_request:
    paths:
      - 'charts/**'
      - '.github/workflows/helm-ci.yml'
  push:
    branches: [main]
    paths:
      - 'charts/**'

jobs:
  lint-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0

      - uses: azure/setup-helm@v4
        with:
          version: v3.16.3

      - uses: helm/chart-testing-action@v2
        with:
          version: v3.11.0

      - name: Run chart-testing (lint)
        run: ct lint --config .github/ct.yaml --target-branch ${{ github.event.repository.default_branch }}

      - name: Install kubeconform
        run: |
          curl -fsSL https://github.com/yannh/kubeconform/releases/latest/download/kubeconform-linux-amd64.tar.gz | tar xz
          sudo mv kubeconform /usr/local/bin/

      - name: Render and validate
        run: |
          for chart in charts/*/; do
            helm template "$chart" | kubeconform \
              -strict \
              -summary \
              -kubernetes-version 1.30.0 \
              -schema-location default \
              -schema-location 'https://raw.githubusercontent.com/datreeio/CRDs-catalog/main/{{.Group}}/{{.ResourceKind}}_{{.ResourceAPIVersion}}.json'
          done

      - name: helm unittest
        run: |
          helm plugin install https://github.com/helm-unittest/helm-unittest
          for chart in charts/*/; do
            [ -d "$chart/tests" ] && helm unittest "$chart"
          done

      - name: Verify README is up to date
        run: |
          docker run --rm -v "$PWD:/helm-docs" jnorwood/helm-docs:latest --chart-search-root charts/
          git diff --exit-code charts/*/README.md || \
            (echo "helm-docs output changed — run helm-docs locally and commit"; exit 1)
```

Create `.github/ct.yaml`:

```yaml
chart-dirs:
  - charts
check-version-increment: true
validate-maintainers: false
helm-extra-args: --timeout 600s
```

## Step 8: Release Workflow

Create `.github/workflows/helm-release.yml`:

```yaml
name: helm-release

on:
  push:
    tags: ['<chartname>-v*']

permissions:
  contents: write
  packages: write

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6

      - uses: azure/setup-helm@v4
        with:
          version: v3.16.3

      - name: Helm login to GHCR
        run: echo "${{ secrets.GITHUB_TOKEN }}" | helm registry login ghcr.io -u ${{ github.actor }} --password-stdin

      - name: Package and push
        run: |
          for chart in charts/*/; do
            helm package "$chart" -d dist/
          done
          for pkg in dist/*.tgz; do
            helm push "$pkg" oci://ghcr.io/${{ github.repository_owner }}/charts
          done
```

Consumers install with:

```bash
helm install my-release oci://ghcr.io/<owner>/charts/<chartname> --version 0.1.0
```

## Step 9: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name helm-chart --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 10: Verify Setup

1. `helm lint charts/<chartname>` passes
2. `helm template charts/<chartname>` renders valid manifests
3. `helm template charts/<chartname> | kubeconform -strict` passes
4. `helm-docs` output matches committed README
5. `helm install <release> charts/<chartname> --dry-run` succeeds
6. CI workflow green on a PR that bumps `Chart.yaml` version
7. Tagging `<chartname>-v0.1.0` publishes to the configured registry

## Reference

- Helm: https://helm.sh/docs/
- Chart best practices: https://helm.sh/docs/chart_best_practices/
- helm-docs: https://github.com/norwoodj/helm-docs
- kubeconform: https://github.com/yannh/kubeconform
- helm-unittest: https://github.com/helm-unittest/helm-unittest
- chart-testing: https://github.com/helm/chart-testing
- Artifact Hub annotations: https://artifacthub.io/docs/topics/annotations/helm/
