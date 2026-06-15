# sbom — Uninstall Instructions

## Step 1: Interview the User

Ask what to remove:

1. **PR checks only** — Remove the PR SBOM workflow, keep release attachment
2. **Release attachment only** — Remove SBOM from release workflow, keep PR generation
3. **Everything** — Remove all SBOM workflows, scripts, and license allowlist
4. **Selective** — Let the user pick

**Warning**: Removing SBOM generation means new vulnerabilities introduced via dependency changes will no longer be flagged automatically, and downstream consumers lose the ability to audit your dependency tree. Confirm before proceeding.

## Step 2: Remove CI Workflows

```bash
rm -f .github/workflows/sbom.yml
```

If SBOM steps were added into `release.yml`, edit and remove only:
- the `sbom-release` job
- `actions/attest-sbom` steps
- any `anchore/sbom-action` usage

## Step 3: Remove Container SBOM Attestation

Edit the Docker build step(s) and drop `sbom: true` and `provenance: true` from `docker/build-push-action@v6` inputs (if they were added solely for this plugin).

## Step 4: Remove License Allowlist

```bash
rm -f .allowed-licenses.txt
```

Edit the SBOM workflow and remove the License check step (already covered if the whole workflow file is deleted).

## Step 5: Remove Dependency Track Integration

Edit any workflow that posts to Dependency Track and remove the `curl -X POST .../api/v1/bom` step. Remove the secrets from `Settings → Secrets and variables → Actions`:

- `DTRACK_URL`
- `DTRACK_API_KEY`
- `DTRACK_PROJECT`

## Step 6: Remove CycloneDX Per-Ecosystem Tools (Optional)

```bash
npm uninstall -g @cyclonedx/cyclonedx-npm
pip uninstall -y cyclonedx-bom
```

Only if these were installed globally solely for this plugin.

## Step 7: Delete Local SBOM Artifacts

```bash
rm -f sbom.spdx.json sbom.cdx.json *.spdx.json *.cdx.json
```

Remove the `.gitignore` entries for SBOM files if desired.

## Step 8: Previously Attached Release SBOMs

SBOMs already attached to past GitHub Releases remain — do **not** retroactively remove them. Downstream consumers may be fetching them.

## Step 9: Previously Attached Container SBOMs

Container image SBOM attestations stored in the registry remain. They can be removed per-image with:

```bash
cosign clean ghcr.io/OWNER/REPO:TAG
```

Only do this if you have a specific reason — this also removes signatures.

## Step 10: Uninstall Syft / Grype Locally (Optional)

```bash
brew uninstall syft grype
# or
rm -f /usr/local/bin/syft /usr/local/bin/grype
```

Only if no other projects use them.

## Step 11: Remove from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name sbom --project --json
```

## Notes

- Grype's vulnerability database cache in `~/.cache/grype/` can be removed with `rm -rf ~/.cache/grype/`
- Rekor transparency log entries from `actions/attest-sbom` are immutable and cannot be removed
- Existing Dependency Track projects retain their history; delete via the Dependency Track UI if desired
- CI history from the removed workflows remains in GitHub Actions run history
