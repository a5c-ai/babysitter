# release-please — Uninstall Instructions

## Step 1: Interview the User

Ask what to remove:

1. **Workflow only** — Remove the GitHub Actions workflow, keep config and manifest for reference
2. **Everything** — Remove workflow, config, manifest, and commitlint setup
3. **Selective** — Let the user choose

**Warning**: Removing release-please without installing a replacement (changesets, autorelease, semantic-release) will drop automated versioning and changelog generation. Confirm with the user.

## Step 2: Remove GitHub Actions Workflow

```bash
rm -f .github/workflows/release-please.yml
```

If release-please steps were added to an existing workflow, remove only those steps.

## Step 3: Remove Config and Manifest

```bash
rm -f release-please-config.json
rm -f .release-please-manifest.json
```

If `bootstrap-sha` was customized or the manifest was hand-seeded, consider committing a snapshot somewhere before deletion so history is preserved.

## Step 4: Remove commitlint (Optional)

Only remove if it was installed solely for release-please — many projects use it independently.

```bash
npm uninstall @commitlint/cli @commitlint/config-conventional
rm -f commitlint.config.js
rm -f .husky/commit-msg
```

Do not remove husky if other hooks rely on it.

## Step 5: Revoke Release PAT

If a `RELEASE_PLEASE_TOKEN` secret was set:
1. Repo Settings → Secrets and variables → Actions → delete `RELEASE_PLEASE_TOKEN`
2. GitHub → Settings → Developer settings → Personal access tokens → revoke the PAT

## Step 6: Close Open Release PRs

```bash
gh pr list --search "in:title chore(main): release" --state open
gh pr close <number> --comment "Closing: release-please uninstalled"
```

## Step 7: Remove Processes

```bash
rm -rf .a5c/processes/release-please
```

## Step 8: Remove from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name release-please --project --json
```

## Notes

- Existing tags and GitHub Releases are not touched — they remain as historical artifacts
- `CHANGELOG.md` stays in place; future edits must be manual or delegated to a replacement tool
- Branch protection bypass entries for the release-please bot should be reviewed and removed if present
- If migrating to changesets, run the changesets install flow and backfill `.changeset/config.json` before the next release
