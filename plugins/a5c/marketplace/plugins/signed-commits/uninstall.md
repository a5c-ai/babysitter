# signed-commits — Uninstall Instructions

## Step 1: Interview the User

Ask what to remove:

1. **Enforcement only** — Keep the hook script and documentation, disable enforcement (pre-commit, CI, branch protection)
2. **Everything** — Remove hooks, CI, documentation, allowed-signers file
3. **Selective** — Let the user pick

**Warning**: Disabling signed-commit requirements lowers the supply-chain integrity of the project. Future commits will not be provably authored by the named committer. Confirm before proceeding.

## Step 2: Remove Branch Protection Requirement

```bash
# Remove the "require signed commits" constraint (leaves other rules intact)
gh api -X DELETE "repos/$(gh repo view --json nameWithOwner -q .nameWithOwner)/branches/main/protection/required_signatures"
```

Or via UI: `Settings → Branches → Edit rule for main → uncheck "Require signed commits"`.

## Step 3: Remove CI Verification Workflow

```bash
rm -f .github/workflows/verify-signed-commits.yml
```

If verification was merged into an existing workflow, remove only those steps.

## Step 4: Remove Pre-commit / Pre-push Hook Entries

### pre-commit framework

Edit `.pre-commit-config.yaml` and remove the `enforce-signing-config` local hook.

### husky

Edit `.husky/pre-commit` and remove the `bash scripts/enforce-signing.sh` line.

### lefthook

Edit `lefthook.yml` and remove the `enforce-signing` command.

## Step 5: Remove Enforcement Script

```bash
rm -f scripts/enforce-signing.sh
```

## Step 6: Remove Allowed-Signers File

```bash
rm -f .github/allowed-signers
```

Notify contributors that the file has been removed so they don't continue submitting PRs expecting verification via that file.

## Step 7: Remove CONTRIBUTING.md Section

Edit `CONTRIBUTING.md` and remove the `## Signed commits` and `### Signed commits troubleshooting` sections.

## Step 8: Leave Contributor Local Configs Alone

Do **not** instruct contributors to unset their `commit.gpgsign` config. Signed commits remain a best practice regardless of project enforcement. Contributors can keep signing.

## Step 9: Keep Historical Signed Commits

Signed commits already in the repo history remain signed; verification status continues to display in the GitHub UI. Nothing needs to change.

## Step 10: Remove gitsign-Specific Config (If Used)

If the repo had gitsign-specific CI verification:

```yaml
# remove any step referencing:
# gitsign verify --certificate-identity ...
```

## Step 11: Remove from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name signed-commits --project --json
```

## Notes

- Existing verified-commit history in the repo is preserved indefinitely
- Branch protection's other rules (required reviews, status checks) are unaffected
- If re-enabling later, contributors who kept their signing config continue to work without re-onboarding
- CI history from the removed workflow remains in GitHub Actions run history
