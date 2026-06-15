# signed-commits — Configuration

## 1. Configuration Options Table

| Option | Values | Default | Where |
|--------|--------|---------|-------|
| `backend` | `ssh`, `gpg`, `gitsign`, `any` | `ssh` | contributor docs + verification logic |
| `enforceLocal` | `on`, `off` | `on` | pre-commit hook |
| `enforcePrePush` | `on`, `off` | `off` | pre-push hook |
| `branchProtection` | `on`, `off` | `on` | GitHub API / UI |
| `ciVerify` | `on`, `off` | `on` | `.github/workflows/verify-signed-commits.yml` |
| `allowedSignersFile` | path | `.github/allowed-signers` | SSH verification |
| `gracePeriodDays` | integer | `14` | CI workflow `continue-on-error` toggle |
| `protectedBranches` | list | `main, staging` | branch protection + CI triggers |

## 2. Switch Backend

### SSH → GPG

```bash
git config --global gpg.format openpgp
git config --global user.signingkey <GPG_KEY_ID>
```

Each contributor repeats this. Update `CONTRIBUTING.md` to reflect the switch.

### SSH/GPG → gitsign

```bash
git config --global gpg.x509.program gitsign
git config --global gpg.format x509
```

Remove `user.signingkey` (gitsign doesn't use it). Update CI to verify via `gitsign verify`.

## 3. Adjust Allowed Signers

Add a new contributor:

```bash
echo 'carol@example.com namespaces="git" ssh-ed25519 AAAAC3Nz...' >> .github/allowed-signers
git add .github/allowed-signers
git commit -S -m "signed-commits: add carol"
```

Remove an offboarded contributor: delete the matching line, commit.

The file should itself live on a protected branch — changes to `.github/allowed-signers` must be signed by an existing allowed signer.

## 4. Warn-Only Grace Period

In `verify-signed-commits.yml`:

```yaml
jobs:
  verify:
    continue-on-error: true   # grace period — flip to false after <date>
```

Track the cutover date in a workflow comment. After the grace period, flip to `false` in the same commit that tightens branch protection.

## 5. Protected Branches

Add staging/release branches:

```yaml
on:
  pull_request:
    branches: [main, staging, release/*]
```

For branch protection API calls, repeat per branch:

```bash
for b in main staging; do
  gh api -X PUT "repos/$OWNER/$REPO/branches/$b/protection/required_signatures"
done
```

## 6. Exempt Bots

GitHub's own merge/squash commits are signed by GitHub. Other bot commits (Dependabot, Renovate, release-please) are also verified — GitHub signs them with the web-flow key. No action needed.

For custom bots, issue a GPG key pair, store the private key as a repo secret, and configure the bot to sign:

```yaml
- run: |
    echo "${{ secrets.BOT_GPG_PRIVATE_KEY }}" | gpg --batch --import
    git config user.email "bot@example.com"
    git config user.signingkey "$BOT_KEY_ID"
    git config commit.gpgsign true
```

## 7. Pre-push Hook (Stronger Local Check)

Verify every commit being pushed is signed. Add `.husky/pre-push`:

```bash
#!/usr/bin/env bash
remote=$1
url=$2
while read local_ref local_sha remote_ref remote_sha; do
  [ "$local_sha" = "0000000000000000000000000000000000000000" ] && continue
  unsigned=$(git log --pretty=format:'%H %G?' "$remote_sha..$local_sha" | awk '$2 !~ /^[GU]$/ {print $1}')
  if [ -n "$unsigned" ]; then
    echo "Unsigned commits detected, refusing to push:" >&2
    echo "$unsigned" >&2
    exit 1
  fi
done
```

`%G?` returns: `G` (good), `B` (bad), `U` (untrusted), `N` (no signature), `X`/`Y`/`R`/`E` (various errors).

## 8. Sigstore-Based CI Verification (gitsign)

```yaml
- uses: sigstore/cosign-installer@v3
- run: |
    for sha in $(git log --format=%H origin/${{ github.base_ref }}..HEAD); do
      gitsign verify \
        --certificate-identity-regexp ".+@${{ secrets.ORG_DOMAIN }}$" \
        --certificate-oidc-issuer https://github.com/login/oauth \
        "$sha"
    done
```

## 9. Emergency Bypass Procedure

Document in `SECURITY.md`:

1. Only org/repo admins can disable branch protection
2. Temporarily disable "Require signed commits" via UI
3. Push the emergency commit
4. Re-enable within the same change window
5. File a post-incident ticket documenting the bypass

## 10. Monitoring

Surface verification failures on a dashboard:

```yaml
- name: Report unverified count to metrics
  run: |
    count=$(gh pr list --search "is:merged merged:>=$(date -d '7 days ago' -I)" --json commits \
      --jq '[.[].commits[] | select(.verified==false)] | length')
    echo "Unverified merged commits (last 7d): $count"
```

Feed to Datadog/Prometheus if the org wants weekly signing hygiene telemetry.

## 11. Key Rotation

When a contributor's key expires or is revoked:

1. They regenerate and re-upload to GitHub
2. Update `.github/allowed-signers` in a signed commit
3. Old commits remain verified (signatures are point-in-time)
4. Any PR still referencing the old key will fail verification — rebase or re-sign

## 12. Combine with SLSA

Signed commits + SLSA provenance + SBOM form a complete supply-chain posture. Install all three plugins; each reinforces the others. See the `slsa-provenance` and `sbom` plugins for release-side attestations.
