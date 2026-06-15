# changelog-enforcer — Uninstall Instructions

## Step 1: Interview the User

Ask what to remove:

1. **Processes and configs only** — Remove babysitter processes but keep CHANGELOG, workflow, labels
2. **Enforcer only** — Remove the CI check but keep CHANGELOG.md itself
3. **Everything** — Remove enforcer, labels, PR template changes (keeps CHANGELOG.md — always)
4. **Selective** — Let the user choose

**Warning**: Never delete CHANGELOG.md — it is the public user-facing record of changes. Confirm with the user; this uninstaller will not remove it even when "everything" is selected.

## Step 2: Remove the Enforcer Workflow

### dangoslen/changelog-enforcer

```bash
rm -f .github/workflows/changelog-enforcer.yml
```

### Changesets

```bash
rm -f .github/workflows/changesets.yml
```

Leave `.github/workflows/release.yml` (the changesets release workflow) in place if release automation is still desired.

### Custom shell check

```bash
rm -f .github/workflows/changelog-shell.yml
```

## Step 3: Uninstall Changesets Tooling (if used)

Only if no longer needed:

```bash
npm uninstall @changesets/cli
rm -rf .changeset/
```

**Warning**: `.changeset/` contains unreleased change descriptors. Merge any pending ones first via `npx changeset version`.

## Step 4: Remove Skip Labels (Optional)

If the labels were created solely for this plugin and are not used elsewhere:

```bash
gh label delete skip-changelog --yes
gh label delete docs-only --yes
```

**Do not remove** `dependencies` or `release` — those are commonly shared.

## Step 5: Remove PR Template Section

Edit `.github/pull_request_template.md` and delete the `## Changelog` checkbox block. Preserve the rest of the template.

## Step 6: Remove Lint Tooling

```bash
npm uninstall keep-a-changelog
```

Remove the `changelog:lint` script from `package.json`.

## Step 7: Keep CHANGELOG.md

**Do not delete `CHANGELOG.md`.** It is the historical user-visible release record and should outlive any tooling that enforced it. Even projects with zero automation keep the file as a Markdown artifact.

If the user truly insists (rare, almost always wrong), at least archive it:

```bash
mv CHANGELOG.md docs/archive/CHANGELOG.md
```

## Step 8: Remove Processes

```bash
rm -rf .a5c/processes/changelog-enforcer
```

## Step 9: Remove from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name changelog-enforcer --project --json
```

## Notes

- Historical CHANGELOG entries are a public API: downstream consumers have links into them
- If migrating to auto-generated changelogs (release-please, semantic-release), run one final manual entry for the in-flight changes, then let the new tool take over
- GitHub release notes pages are separate from CHANGELOG.md — removing the file does not affect release pages
