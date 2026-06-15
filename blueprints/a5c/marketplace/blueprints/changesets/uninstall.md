# changesets — Uninstall Instructions

## Step 1: Interview the User

Ask what to remove:

1. **Workflow only** — Remove the release workflow, keep `.changeset/` for reference
2. **Everything** — Remove CLI, config, workflow, and pending changesets
3. **Selective** — Let the user choose

**Warning**: Pending `.changeset/*.md` files are unreleased intent. Either apply them (`changeset version && changeset publish`) or accept that their descriptions will be lost from the changelog.

## Step 2: Apply or Discard Pending Changesets

Check for pending work:

```bash
npx changeset status
```

If releases are pending and desired:

```bash
npm run version
npm run release
git add -A && git commit -m "chore: final changeset release before uninstall"
```

Otherwise, list and confirm deletion:

```bash
ls .changeset/*.md
```

## Step 3: Remove GitHub Actions Workflows

```bash
rm -f .github/workflows/release.yml
rm -f .github/workflows/changeset-check.yml
```

If changeset steps were added to an existing workflow, remove only those steps.

## Step 4: Remove the CLI and Changelog Renderer

```bash
npm uninstall @changesets/cli @changesets/changelog-github
```

## Step 5: Remove Package Scripts

Edit root `package.json` and delete:

```json
{
  "scripts": {
    "changeset": "changeset",
    "version": "changeset version",
    "release": "changeset publish"
  }
}
```

## Step 6: Remove `.changeset/` Directory

```bash
rm -rf .changeset/
```

This also removes `.changeset/config.json`, `.changeset/README.md`, and any remaining unreleased changeset files.

## Step 7: Revoke npm Automation Token

1. npmjs.com → Access Tokens → find the token used by CI → Revoke
2. Repo → Settings → Secrets and variables → Actions → delete `NPM_TOKEN`

## Step 8: Close Open Version Packages PRs

```bash
gh pr list --search "chore: version packages in:title" --state open
gh pr close <number> --comment "Closing: changesets uninstalled"
```

## Step 9: Remove Processes

```bash
rm -rf .a5c/processes/changesets
```

## Step 10: Remove from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name changesets --project --json
```

## Notes

- Existing tags, GitHub Releases, and published npm versions are untouched
- `CHANGELOG.md` files in each package are preserved as historical records
- If migrating to release-please or autorelease, adopt Conventional Commits (release-please) or release-drafter labels (autorelease) before the next planned release
- `NPM_CONFIG_PROVENANCE` env var in unrelated workflows can remain; it is a no-op without a publish step
