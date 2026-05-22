# signed-commits — Install Instructions

Require verified, signed commits on every protected branch — walk each contributor through GPG, SSH, or Sigstore (gitsign) signing setup; add a pre-commit / pre-push hook that refuses unsigned commits locally; and add a CI workflow that verifies every commit in a PR is signed by a trusted signer before merge.

## Step 1: Interview the User

### Stage 1: Project Analysis

Before asking questions, analyze the project:
1. Check existing signing configuration:
   - `git config --get commit.gpgsign`
   - `git config --get gpg.format` (`openpgp` / `ssh` / `x509`)
   - `~/.gitconfig` for `user.signingkey`
2. Check `ALLOWED_SIGNERS` file for SSH signing: `git config --get gpg.ssh.allowedSignersFile`
3. Check the contributors list in `git shortlog -sne` to gauge rollout scope
4. Check branch protection rules on `main`, `staging` (via `gh api repos/:owner/:repo/branches/:branch/protection`)
5. Check for existing pre-commit framework: `.husky/`, `.pre-commit-config.yaml`, `lefthook.yml`
6. Summarize findings to the user

### Stage 2: Signing Backend

Ask which backend to standardize on (pick one, strongly recommend one per team — mixing is allowed but adds complexity):

1. **SSH signing** (recommended for new teams) — uses existing SSH keys, GitHub natively verifies
2. **GPG** — classic; widely supported; key management overhead
3. **Sigstore gitsign** — keyless OIDC-based; verification via Rekor; cutting edge
4. **Allow any** — require signed but accept all three (most permissive, highest rollout cost)

Default: **SSH signing**.

### Stage 3: Enforcement Points

Ask which enforcement layers to enable (multi-select):

1. **Pre-commit hook** — refuse to create unsigned commits locally
2. **Pre-push hook** — refuse to push commits with unsigned ancestors
3. **Branch protection: require signed commits** — GitHub blocks push of unsigned commits
4. **CI verification** — PR workflow that checks every commit in the PR is signed + verified
5. **All**

### Stage 4: Onboarding

Ask:
- Generate a per-contributor setup script? Default: **yes**
- Document both GitHub and GitLab/Bitbucket setup? Default: **GitHub only**
- Grace period for existing contributors who haven't configured signing? Default: **2 weeks warn-only, then enforce**

## Step 2: Contributor Setup — SSH Signing

Document in `CONTRIBUTING.md`:

```bash
# 1. Use an existing ed25519 key or generate one
ssh-keygen -t ed25519 -C "you@example.com"   # only if you don't have one

# 2. Configure git
git config --global gpg.format ssh
git config --global user.signingkey ~/.ssh/id_ed25519.pub
git config --global commit.gpgsign true
git config --global tag.gpgsign true
git config --global push.gpgSign if-asked

# 3. Add the PUBLIC key to GitHub twice:
#    Settings → SSH and GPG keys → New SSH key
#      - Type: "Signing Key"     (for commit/tag signing verification)
#      - Type: "Authentication Key" (already added if you push over SSH)
# Paste the contents of ~/.ssh/id_ed25519.pub into both entries.

# 4. Test
echo "test" | git commit --allow-empty -S -m "test signed commit"
git log --show-signature -1
```

## Step 3: Contributor Setup — GPG

Document (alternative):

```bash
# 1. Generate a new GPG key (or use existing)
gpg --full-generate-key          # choose: RSA 4096, 2y expiry, your email

# 2. List + export
gpg --list-secret-keys --keyid-format=long
#    sec   rsa4096/ABC123DEF456 2024-01-01 [SC] [expires: 2026-01-01]
gpg --armor --export ABC123DEF456 > my-gpg-pub.asc

# 3. Configure git
git config --global gpg.format openpgp
git config --global user.signingkey ABC123DEF456
git config --global commit.gpgsign true
git config --global tag.gpgsign true

# 4. Add PUBLIC key to GitHub: Settings → SSH and GPG keys → New GPG key
#    Paste the contents of my-gpg-pub.asc.

# 5. Test
git commit --allow-empty -S -m "test"
git log --show-signature -1
```

If committing from a GUI, configure the GUI to use GPG (`gpg-agent` for passphrase caching).

## Step 4: Contributor Setup — gitsign (Sigstore)

```bash
# 1. Install gitsign
brew install sigstore/tap/gitsign
# or: go install github.com/sigstore/gitsign@latest

# 2. Configure git to use gitsign
git config --global gpg.x509.program gitsign
git config --global gpg.format x509
git config --global commit.gpgsign true

# 3. First commit opens a browser for OIDC — authenticate with GitHub/Google
git commit --allow-empty -S -m "test gitsign"

# 4. Verify via Rekor
gitsign verify --certificate-identity you@example.com --certificate-oidc-issuer https://github.com/login/oauth HEAD
```

GitHub does not display gitsign commits as "Verified" by default — add `ALLOWED_SIGNERS` in CI (Step 7) to enforce.

## Step 5: Branch Protection — GitHub Native

```bash
# Enable "Require signed commits" on main
gh api -X PUT "repos/$(gh repo view --json nameWithOwner -q .nameWithOwner)/branches/main/protection/required_signatures"
```

Or via UI: `Settings → Branches → Branch protection rules → main → Require signed commits`.

Also enable:
- `Require a pull request before merging`
- `Require approvals` ≥ 1
- `Require status checks to pass` (include the verification job from Step 7)
- `Do not allow bypassing the above settings`

## Step 6: Pre-commit Hook — Local Enforcement

Create `scripts/enforce-signing.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

# Check git is configured to sign
if [ "$(git config --get commit.gpgsign)" != "true" ]; then
  echo "ERROR: commit.gpgsign is not true." >&2
  echo "Run: git config --global commit.gpgsign true" >&2
  echo "Full setup guide: see CONTRIBUTING.md#signed-commits" >&2
  exit 1
fi

if [ -z "$(git config --get user.signingkey)" ]; then
  echo "ERROR: user.signingkey is not set." >&2
  exit 1
fi
```

```bash
chmod +x scripts/enforce-signing.sh
```

### pre-commit framework

Append to `.pre-commit-config.yaml`:

```yaml
repos:
  - repo: local
    hooks:
      - id: enforce-signing-config
        name: Verify git is configured for signed commits
        entry: bash scripts/enforce-signing.sh
        language: system
        pass_filenames: false
        stages: [pre-commit]
```

```bash
pre-commit install
```

### husky

```bash
npx husky add .husky/pre-commit "bash scripts/enforce-signing.sh"
```

### lefthook

```yaml
pre-commit:
  commands:
    enforce-signing:
      run: bash scripts/enforce-signing.sh
```

## Step 7: CI Verification Workflow

Create `.github/workflows/verify-signed-commits.yml`:

```yaml
name: Verify Signed Commits
on:
  pull_request:
    branches: [main, staging]

permissions:
  contents: read

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0
          ref: ${{ github.event.pull_request.head.sha }}

      - name: Check every PR commit is signed and verified
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          commits=$(gh api "repos/${GITHUB_REPOSITORY}/pulls/${{ github.event.pull_request.number }}/commits" --paginate --jq '.[].sha')
          failed=0
          for sha in $commits; do
            verified=$(gh api "repos/${GITHUB_REPOSITORY}/commits/$sha" --jq '.commit.verification.verified')
            reason=$(gh api "repos/${GITHUB_REPOSITORY}/commits/$sha" --jq '.commit.verification.reason')
            if [ "$verified" != "true" ]; then
              echo "::error::Commit $sha is not verified (reason: $reason)"
              failed=1
            else
              echo "OK $sha ($reason)"
            fi
          done
          exit $failed
```

For SSH-key-based signing outside GitHub native verification, maintain an `ALLOWED_SIGNERS` file:

```
# .github/allowed-signers
# format: <email> namespaces="git" <pubkey>
alice@example.com namespaces="git" ssh-ed25519 AAAAC3Nz...
bob@example.com namespaces="git" ssh-ed25519 AAAAC3Nz...
```

And a verification step:

```yaml
      - name: Verify SSH signatures against allowed-signers
        run: |
          git config gpg.ssh.allowedSignersFile .github/allowed-signers
          for sha in $(git log --format=%H origin/${{ github.base_ref }}..HEAD); do
            git verify-commit "$sha" || exit 1
          done
```

## Step 8: Migration — Existing Unsigned History

Do **not** rewrite history to add signatures retroactively. Instead:

1. Document the cutover date in `CONTRIBUTING.md`: "All commits dated after YYYY-MM-DD on protected branches MUST be signed."
2. Enable branch protection on that date
3. Existing unsigned commits on `main` predating the cutover remain

## Step 9: Troubleshooting Doc

Add to `CONTRIBUTING.md`:

```markdown
### Signed commits troubleshooting

| Symptom | Fix |
|---------|-----|
| `gpg: signing failed: Inappropriate ioctl for device` | `export GPG_TTY=$(tty)` in shell rc |
| `error: gpg failed to sign the data` | Check `gpg-agent` is running, key not expired |
| GitHub shows "Unverified" with SSH signing | Add pubkey to Settings → SSH and GPG keys as "Signing Key" type |
| PR verify fails on merge commits | Signed merge commits are supported; ensure GitHub's own bot key is whitelisted (GitHub auto-signs squash/merge commits) |
```

## Step 10: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name signed-commits --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 11: Verify

1. Local commit without signing configured is rejected by pre-commit hook
2. `git commit --allow-empty -m "test"` succeeds with signing on, produces "Verified" badge in GitHub UI
3. PR containing an unsigned commit (e.g. from an unconfigured contributor) fails the verify workflow
4. Branch protection on `main` rejects direct push of unsigned commits
5. All active contributors have added their signing key to GitHub

## Reference

- GitHub commit signing: https://docs.github.com/authentication/managing-commit-signature-verification
- SSH signing: https://docs.github.com/authentication/managing-commit-signature-verification/about-commit-signature-verification#ssh-commit-signature-verification
- gitsign: https://github.com/sigstore/gitsign
- git `allowed-signers`: https://git-scm.com/docs/git-config#Documentation/git-config.txt-gpgsshallowedSignersFile
