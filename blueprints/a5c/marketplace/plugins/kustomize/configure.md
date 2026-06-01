# kustomize — Configuration

## 1. Configuration Options Table

| Option | Values | Default | Where |
|--------|--------|---------|-------|
| `kustomizeVersion` | semver | `v5.5.0` | workflow setup action |
| `kubeconformTarget` | k8s version | `1.30.0` | workflow `-kubernetes-version` |
| `strictMode` | `true`, `false` | `true` | `kubeconform -strict` |
| `namePrefix` | string | per-overlay | overlay `kustomization.yaml` |
| `namespace` | string | per-overlay | overlay `kustomization.yaml` |
| `imagePinStrategy` | `tag`, `digest` | `digest` in prod, `tag` in non-prod | `images:` block |
| `useComponents` | `true`, `false` | `false` | `components:` block |
| `generatorBehavior` | `create`, `merge`, `replace` | `merge` in overlays | `configMapGenerator.behavior` |
| `commonLabels` | map | `app.kubernetes.io/*` | `base/kustomization.yaml` |
| `commonAnnotations` | map | `{}` | `base/kustomization.yaml` |

## 2. Add an Environment

```bash
mkdir -p k8s/overlays/qa
cat > k8s/overlays/qa/kustomization.yaml <<'YAML'
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: <appname>-qa
namePrefix: qa-
resources:
  - ../../base
images:
  - name: <registry>/<appname>
    newTag: qa-latest
YAML
```

Add `qa` to the CI matrix in `.github/workflows/kustomize.yml`.

## 3. Switch Image Pinning

### Tag to digest (prod)

```yaml
images:
  - name: <registry>/<appname>
    digest: sha256:abc123...
```

### Digest to tag (dev)

```yaml
images:
  - name: <registry>/<appname>
    newTag: dev-latest
```

Update automation:

```bash
cd k8s/overlays/prod
kustomize edit set image <registry>/<appname>=@sha256:$(cat new-digest.txt)
```

## 4. Add a Patch

### Strategic merge patch

```yaml
patches:
  - path: patch-envvars.yaml
    target: { kind: Deployment, name: <appname> }
```

### JSON 6902 patch

```yaml
patches:
  - target: { kind: Deployment, name: <appname> }
    patch: |-
      - op: replace
        path: /spec/replicas
        value: 5
```

## 5. Toggle a Component

```yaml
# k8s/overlays/prod/kustomization.yaml
components:
  - ../../components/monitoring
  - ../../components/networkpolicy
```

Omit from overlays where the component is not wanted.

## 6. Generators — ConfigMap / Secret

```yaml
configMapGenerator:
  - name: <appname>-config
    behavior: merge
    literals:
      - FEATURE_FLAGS=foo=1,bar=0
    files:
      - nginx.conf

secretGenerator:
  - name: <appname>-secrets
    behavior: create
    envs:
      - .env.prod          # DO NOT commit plaintext secrets
```

For real secrets, prefer SealedSecrets / external-secrets / SOPS rather than `secretGenerator` with plaintext files.

## 7. Disable Hash Suffixes on Generators

```yaml
generatorOptions:
  disableNameSuffixHash: true
```

Useful when referenced by name elsewhere; sacrifices automatic rollout on config change.

## 8. Change Kubernetes Target Version

```yaml
- run: kubeconform -kubernetes-version 1.31.0 -strict dist.yaml
```

Match the oldest live cluster.

## 9. Render Helm Chart via Kustomize

```yaml
helmCharts:
  - name: postgresql
    repo: oci://registry-1.docker.io/bitnamicharts
    version: 15.0.0
    releaseName: pg
    valuesFile: values-postgres.yaml
```

Run with:

```bash
kustomize build --enable-helm k8s/overlays/dev
```

CI must pass `--enable-helm` and have `helm` on PATH.

## 10. Transformer Functions (kustomize fn)

```yaml
transformers:
  - |-
    apiVersion: builtin
    kind: LabelTransformer
    metadata: { name: add-env }
    labels: { env: prod }
    fieldSpecs:
      - path: metadata/labels
        create: true
```

Or use containerized functions:

```yaml
transformers:
  - image: gcr.io/kustomize-functions/example-tshirt:v0.1.0
```

## 11. Multi-cluster Layout

```
k8s/overlays/<cluster>/<env>/
```

Example:

```
k8s/overlays/
├── us-east-1/
│   ├── dev/
│   └── prod/
└── eu-west-1/
    ├── dev/
    └── prod/
```

Update the CI matrix to include cluster dimension.

## 12. Dry-Run Against a Live Cluster

```bash
kustomize build k8s/overlays/prod | kubectl diff -f -
kustomize build k8s/overlays/prod | kubectl apply --dry-run=server -f -
```

## 13. Hook into Babysitter

```bash
babysitter run:create \
  --process-id k8s-overlay-audit \
  --entry .a5c/processes/k8s/audit.js#process \
  --prompt "Audit k8s/overlays/prod for resource limits, readinessProbe, and NetworkPolicy coverage" \
  --json
```
