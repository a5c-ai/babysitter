# kustomize — Uninstall Instructions

## Step 1: Interview the User

Ask what to remove:

1. **CI only** — Remove the validation workflow, keep overlay directories
2. **Everything** — Remove `k8s/` tree and workflow
3. **Selective** — Keep base, remove one or more overlays (common when retiring an environment)

**Warning**: If ArgoCD/Flux syncs from these overlay paths, deleting them breaks live deployments. Point those controllers at a new source first.

## Step 2: Check Downstream Consumers

```bash
grep -R "k8s/overlays" .                # Same repo
grep -R "k8s/base" .
```

Outside this repo, check ArgoCD `Application` specs or Flux `Kustomization` CRs whose `spec.path` points here.

## Step 3: Remove CI Workflow

```bash
rm -f .github/workflows/kustomize.yml
```

If validation steps were added to an existing workflow, remove only those steps.

## Step 4: Remove Overlays and Base

Complete removal:

```bash
rm -rf k8s/overlays
rm -rf k8s/base
rm -rf k8s/components
rmdir k8s 2>/dev/null || true
```

Selective (e.g., retire `qa`):

```bash
rm -rf k8s/overlays/qa
```

## Step 5: Remove Render/Apply Scripts

Edit `package.json` (or `Makefile`) and delete:

```json
{
  "scripts": {
    "k8s:render:dev": "...",
    "k8s:render:prod": "...",
    "k8s:apply:dev": "...",
    "k8s:diff:prod": "..."
  }
}
```

## Step 6: Uninstall Tooling (Optional)

Only if unused elsewhere.

```bash
brew uninstall kustomize
brew uninstall kubeconform
```

## Step 7: Clean Cluster Resources (Optional)

If rendered resources were previously applied and you want them removed:

```bash
kustomize build k8s/overlays/dev | kubectl delete --ignore-not-found -f -
```

Do this BEFORE removing the overlay files if you want a clean teardown.

## Step 8: Remove Processes

```bash
rm -rf .a5c/processes/kustomize
```

## Step 9: Remove from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name kustomize --project --json
```

## Notes

- Any `kustomize edit set image` tagged commits in git history remain
- If migrating to Helm, re-render your overlays with `kustomize build > starter.yaml` and use that as the basis for chart templates
- Rendered manifest artifacts in past CI runs are not affected
