# helm-chart — Configuration

## 1. Configuration Options Table

| Option | Values | Default | Where |
|--------|--------|---------|-------|
| `kubeVersion` | semver range | `>=1.28.0` | `Chart.yaml` |
| `chartType` | `application`, `library` | `application` | `Chart.yaml` |
| `schemaValidation` | `on`, `off` | `on` | `values.schema.json` presence |
| `lintStrict` | `true`, `false` | `true` | `helm lint --strict` |
| `kubeconformTargetVersion` | k8s version | `1.30.0` | workflow `-kubernetes-version` |
| `kubeconformStrict` | `true`, `false` | `true` | workflow `-strict` |
| `releaseRegistry` | `oci`, `pages`, `chartmuseum`, `none` | `oci` | release workflow |
| `ociRegistry` | URL | `oci://ghcr.io/<owner>/charts` | release workflow |
| `artifactHubIndex` | `true`, `false` | `false` | `.artifacthub.yml` presence |
| `docsAutoUpdate` | `true`, `false` | `true` | CI README check |
| `unitTests` | `true`, `false` | `true` | `charts/<name>/tests/` presence |

## 2. Adjust Kubernetes Target Version

### Chart.yaml

```yaml
kubeVersion: ">=1.29.0-0 <1.32.0-0"
```

Helm refuses to install if the cluster version is outside this range.

### kubeconform (CI)

```yaml
- run: helm template charts/<name> | kubeconform -kubernetes-version 1.31.0 -strict
```

Match to your oldest supported cluster.

## 3. Custom Resource Definitions (CRDs)

Point kubeconform at a CRD schema catalog:

```bash
helm template charts/<name> | kubeconform \
  -schema-location default \
  -schema-location 'https://raw.githubusercontent.com/datreeio/CRDs-catalog/main/{{.Group}}/{{.ResourceKind}}_{{.ResourceAPIVersion}}.json' \
  -strict
```

For local CRD schemas:

```bash
kubeconform -schema-location ./schemas/{{.ResourceKind}}-{{.ResourceAPIVersion}}.json
```

## 4. Tune `values.schema.json`

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["image"],
  "properties": {
    "replicaCount": { "type": "integer", "minimum": 1, "maximum": 100 },
    "image": {
      "type": "object",
      "required": ["repository"],
      "properties": {
        "repository": { "type": "string", "pattern": "^[a-z0-9./-]+$" },
        "tag": { "type": "string" },
        "pullPolicy": { "enum": ["Always", "IfNotPresent", "Never"] }
      }
    },
    "environment": { "enum": ["dev", "staging", "prod"] }
  }
}
```

## 5. Disable Strict Mode (Temporary)

For migrating noisy charts:

```yaml
- run: helm lint charts/<name>     # drop --strict
- run: helm template charts/<name> | kubeconform -summary   # drop -strict
```

Flip back on once violations are cleared.

## 6. Switch Release Target

### OCI → GitHub Pages

```yaml
- uses: helm/chart-releaser-action@v1.6.0
  with:
    charts_dir: charts
    config: cr.yaml
  env:
    CR_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Enable Pages on the `gh-pages` branch.

### OCI → ChartMuseum

```bash
helm cm-push charts/<name> <museum-alias>
```

Requires `helm-push` plugin and a configured repo.

## 7. Add Artifact Hub Metadata

Create `charts/<name>/.artifacthub.yml`:

```yaml
license: Apache-2.0
screenshots:
  - title: Dashboard
    url: https://...
operator: false
```

And in `Chart.yaml`:

```yaml
annotations:
  artifacthub.io/changes: |
    - kind: added
      description: Horizontal Pod Autoscaler
  artifacthub.io/license: Apache-2.0
  artifacthub.io/links: |
    - name: source
      url: https://github.com/<owner>/<repo>
```

## 8. Bump Chart Version via Babysitter

```bash
babysitter run:create \
  --process-id helm-bump \
  --entry .a5c/processes/helm/bump.js#process \
  --prompt "Bump charts/<name> version (minor) because we added a new ingress annotation" \
  --json
```

## 9. Subchart Pinning

```yaml
dependencies:
  - name: postgresql
    version: "15.2.0"   # pin exact; avoid floating ranges in prod
    repository: oci://registry-1.docker.io/bitnamicharts
```

Run `helm dependency update charts/<name>` after each edit; commit `Chart.lock`.

## 10. Template Debug Output

```bash
helm template charts/<name> --debug --values charts/<name>/values-dev.yaml > /tmp/rendered.yaml
helm install --dry-run --debug my-release charts/<name>
```

## 11. Enable CRDs-first Install Order

```yaml
# charts/<name>/crds/
# Helm installs CRDs before templates automatically; kubeconform in CI
# should validate CRDs separately:
- run: kubeconform -schema-location default charts/<name>/crds/*.yaml
```

## 12. Signed Chart Releases

```bash
helm package charts/<name> --sign --key '<keyname>' --keyring ~/.gnupg/secring.gpg
helm verify charts/<name>-0.1.0.tgz
```

Upload `.tgz` and `.tgz.prov` together to the registry.
