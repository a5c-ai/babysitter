# helm-chart — Uninstall Instructions

## Step 1: Interview the User

Ask what to remove:

1. **CI only** — Remove lint/release workflows, keep the chart for manual packaging
2. **Everything** — Remove `charts/<chartname>/`, workflows, and chart-testing config
3. **Selective** — Let the user choose

**Warning**: Removing the chart directory while Helm releases are live in a cluster leaves those releases without an upstream chart. Pin consumers to a previously-published tagged version before removing.

## Step 2: Check for Live Releases

```bash
helm list --all-namespaces | grep <chartname>
```

If results appear, either uninstall them (`helm uninstall <release>`) or notify cluster operators to pin to a published OCI/tar artifact before proceeding.

## Step 3: Remove GitHub Actions Workflows

```bash
rm -f .github/workflows/helm-ci.yml
rm -f .github/workflows/helm-release.yml
rm -f .github/ct.yaml
```

## Step 4: Remove the Chart(s)

```bash
rm -rf charts/<chartname>
# or remove the whole dir:
rm -rf charts/
```

## Step 5: Remove Tooling (Optional)

Only if unused elsewhere.

```bash
helm plugin uninstall unittest
helm plugin uninstall schema-gen
# Binaries:
rm -f $(which helm-docs)
rm -f $(which kubeconform)
```

## Step 6: Remove OCI Artifacts (Optional)

Published chart versions on `ghcr.io/<owner>/charts/<chartname>` are NOT deleted automatically. To purge:

```bash
gh api --method DELETE "/user/packages/container/charts%2F<chartname>/versions/<version-id>"
```

Consider keeping published versions for downstream users.

## Step 7: Revoke Registry Credentials

If a bespoke registry token was issued:
1. Registry provider → revoke
2. Repo → Settings → Secrets → delete the secret

## Step 8: Remove Processes

```bash
rm -rf .a5c/processes/helm-chart
```

## Step 9: Remove from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name helm-chart --project --json
```

## Notes

- Any `values.yaml` files consumed by external deployment tools (ArgoCD `Application`, Flux `HelmRelease`) will break once the chart directory is removed — update those manifests first
- `.helmignore` and `values.schema.json` are removed with the chart
- Consumers pinned to `oci://ghcr.io/.../<chartname>:0.1.0` continue to work; they only see deletion if you purge the OCI artifacts
