# branch-protection — Uninstall Instructions

## Step 1: Interview the User

Ask what to remove:

1. **Automation only** — Keep existing branch protection on GitHub, remove apply scripts/workflow
2. **Everything** — Remove scripts, workflow, and optionally disable GitHub-side protection
3. **Selective** — Let the user choose which layers to remove

**Warning**: Disabling branch protection removes the guardrails against force-pushes and unreviewed merges. Coordinate with the team and consider keeping protection active even after uninstalling the automation.

## Step 2: Remove Apply Scripts

```bash
rm -f scripts/apply-branch-protection.mjs
rm -f scripts/diff-branch-protection.mjs
npm uninstall @octokit/rest yaml   # if not used elsewhere
```

Remove corresponding npm script entries from `package.json`.

## Step 3: Remove Config File

```bash
rm -f .github/branch-protection.yaml
rm -f .github/BRANCH_PROTECTION.md
```

## Step 4: Remove GitHub Actions Workflow

```bash
rm -f .github/workflows/branch-protection.yml
```

## Step 5: Remove GitHub-side Protection (Cautious)

Only if explicitly requested. For each branch:

```bash
gh api --method DELETE repos/:owner/:repo/branches/main/protection
```

**Strong recommendation**: keep protection enabled even after removing the automation. Document the rules manually in a `CONTRIBUTING.md` section before disabling.

## Step 6: Rotate Admin Token

If a `BRANCH_PROTECTION_TOKEN` PAT was created, revoke it in GitHub → Settings → Developer settings → Personal access tokens.

## Step 7: Remove Processes

```bash
rm -rf .a5c/processes/branch-protection
```

## Step 8: Remove from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name branch-protection --project --json
```

## Notes

- Drift will resume without automation — schedule manual audits if protection is kept
- If migrating to GitHub Rulesets, export current protection via `gh api repos/:owner/:repo/rulesets` first
- Required status checks that referenced now-removed workflows will prevent merges — reconcile with the `.github/workflows/` directory
