# slsa-provenance — Uninstall Instructions

## Step 1: Interview the User

Ask what to remove:

1. **Workflows only** — Remove SLSA release workflows, keep verification script
2. **Everything** — Remove workflows, verification script, README snippet
3. **Selective** — Let the user pick per artifact type (generic / container / npm / go)

**Warning**: Removing SLSA provenance means future releases will no longer carry verifiable build attestations. Downstream consumers who rely on `slsa-verifier` or `npm audit signatures` will lose that guarantee. Confirm before proceeding.

## Step 2: Remove Release Workflows

```bash
rm -f .github/workflows/release-slsa.yml
rm -f .github/workflows/release-container-slsa.yml
rm -f .github/workflows/release-npm-slsa.yml
rm -f .github/workflows/release-go-slsa.yml
```

If SLSA steps were merged into an existing `release.yml`, remove only those jobs/steps — do not delete the whole workflow file.

## Step 3: Remove Verification Script

```bash
rm -f scripts/verify-release.sh
```

## Step 4: Remove README Section

Edit `README.md` and delete the `## Verifying release provenance` section.

## Step 5: Remove Cosign Key Material (If Used)

Only if long-lived keys were configured (not keyless):

```bash
rm -f cosign.key cosign.pub
```

Remove the `COSIGN_PASSWORD` secret from `Settings → Secrets and variables → Actions`.

## Step 6: Disable KMS Bindings (If Used)

If cosign was configured with KMS:

- **AWS KMS**: revoke the IAM role's OIDC trust to GitHub Actions at `arn:aws:iam::*:role/...`
- **GCP KMS**: remove the Workload Identity Federation binding
- **Azure Key Vault**: remove the federated credential from the App Registration

## Step 7: Leave Existing Provenance Artifacts in Place

Previously published releases retain their `.intoto.jsonl` attestations on the GitHub release. Do **not** retroactively remove them — downstream consumers may be verifying against them. New releases simply won't produce new ones.

## Step 8: Container Registry Cleanup (Optional)

Previously pushed images retain their signature objects in the registry (`sha256-<digest>.sig`). Leave them in place — removing signatures retroactively breaks consumers mid-deployment.

## Step 9: Remove from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name slsa-provenance --project --json
```

## Notes

- Sigstore Rekor transparency log entries are append-only and cannot be removed — this is by design for audit purposes
- npm provenance records on the npm registry are immutable once published — older versions keep their provenance
- CI history from the removed workflows remains in GitHub Actions run history
- If replacing with GitHub's built-in `actions/attest-build-provenance@v2`, see the `sbom` plugin as a lighter-weight alternative
