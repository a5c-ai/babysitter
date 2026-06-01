# autorelease — Uninstall Instructions

## Step 1: Interview the User

Ask what to remove:

1. **Workflows only** — Remove release-drafter + release workflows, keep labels and config
2. **Everything** — Remove workflows, config, labels (only if repo-exclusive)
3. **Selective** — Let the user choose

**Warning**: Any existing draft release will remain. Publish or discard it before uninstalling to avoid orphaned drafts.

## Step 2: Resolve or Discard the Current Draft

```bash
gh release list --limit 5
gh release view <draft-tag>
```

To publish:

```bash
gh release edit <draft-tag> --draft=false
```

To discard:

```bash
gh release delete <draft-tag>
```

## Step 3: Remove GitHub Actions Workflows

```bash
rm -f .github/workflows/release-drafter.yml
rm -f .github/workflows/release.yml
```

## Step 4: Remove release-drafter Config

```bash
rm -f .github/release-drafter.yml
```

## Step 5: Remove Labels (Optional)

Only if the labels are unused elsewhere. Check first:

```bash
gh issue list --label breaking --state all --limit 1
gh issue list --label feature --state all --limit 1
```

If safe:

```bash
gh label delete breaking --yes
gh label delete feature --yes
gh label delete fix --yes
gh label delete perf --yes
gh label delete chore --yes
gh label delete deps --yes
gh label delete docs --yes
gh label delete skip-release --yes
```

## Step 6: Revoke Publishing Tokens

If npm / registry tokens were added:
1. Provider → revoke the token
2. Repo → Settings → Secrets and variables → Actions → delete `NPM_TOKEN`

## Step 7: Remove PR Template References

Edit `.github/pull_request_template.md` and remove the "Release Category" block, or delete the file if it existed only for autorelease.

## Step 8: Remove Processes

```bash
rm -rf .a5c/processes/autorelease
```

## Step 9: Remove from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name autorelease --project --json
```

## Notes

- Existing tags and published Releases are preserved
- If migrating to release-please or changesets, adopt Conventional Commits or add `.changeset/` files before the next release to avoid a notes gap
- Branch protection rules that require the `release-drafter` status check will need to be edited or removed
