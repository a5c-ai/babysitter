# env-management — Uninstall Instructions

## Step 1: Interview the User

Ask what to remove:

1. **Linting only** — Remove dotenv-linter hook, keep `.env.example` and CI gate
2. **CI gate only** — Remove missing-variable CI gate, keep linting
3. **Everything** — Remove all env-management tooling
4. **Selective** — Let the user pick

**Warning**: Removing the missing-variable CI gate means new env vars can be merged without being declared in `.env.example`. Removing the secret-scan hook means real secrets could be committed. Confirm before proceeding.

## Step 2: Remove Pre-commit Hook Entries

### pre-commit framework

Edit `.pre-commit-config.yaml` and remove:
- `dotenv-linter` repo block
- `gitleaks` repo block
- the local `no-commit-env` hook

```bash
pre-commit uninstall   # only if this was the sole user of the framework
```

### husky + lint-staged

Edit `package.json` → `lint-staged` and drop the `.env*` and gitleaks entries. Remove the `lint-staged` dependency if it was added only for this plugin:

```bash
npm uninstall lint-staged
```

## Step 3: Remove Missing-Variable Check Script

```bash
rm -f scripts/check-env-vars.mjs
```

Edit `package.json` → `scripts` and remove:

```json
"env:check": "node scripts/check-env-vars.mjs"
```

## Step 4: Remove CI Workflow

```bash
rm -f .github/workflows/env.yml
```

If env checks were merged into an existing workflow, remove only those jobs.

## Step 5: Uninstall dotenv-linter (Optional)

If installed only for this project and no other project uses it:

```bash
cargo uninstall dotenv-linter
# or
brew uninstall dotenv-linter
```

## Step 6: Remove `.dotenv-linter.yaml`

```bash
rm -f .dotenv-linter.yaml
```

## Step 7: Keep or Remove `.env.example`

Ask the user explicitly — `.env.example` is almost always valuable to retain even without the tooling. Default: **keep it**.

If removing:

```bash
rm -f .env.example
```

## Step 8: Restore `.gitignore` (Optional)

If `.gitignore` was extended specifically for this plugin's rules, review and revert. In most cases `.env` should remain ignored regardless.

## Step 9: Remove `CONTRIBUTING.md` Section

Edit `CONTRIBUTING.md` and remove the `## Environment variables` section (or update it to match the new rollout process).

## Step 10: Remove from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name env-management --project --json
```

## Notes

- Any real secrets previously committed to the repo history remain in history — use `git filter-repo` or BFG to scrub them if needed, and rotate the secrets regardless
- Gitleaks scan history in GitHub Actions logs is retained per GitHub's log policy
- If the project was using sops / doppler / vault for secret distribution, those systems are untouched
