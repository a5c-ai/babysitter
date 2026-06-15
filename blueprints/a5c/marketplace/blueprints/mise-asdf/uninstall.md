# mise-asdf — Uninstall Instructions

## Step 1: Interview the User

Ask what to remove:

1. **Version pins only** — Remove `.tool-versions` / `.mise.toml` but keep CI caching and hooks
2. **Everything** — Remove version pins, CI integration, pre-commit hook, and helper scripts
3. **Selective** — Let the user pick

**Warning**: Removing `.tool-versions` / `.mise.toml` drops the project's guarantee that all contributors use the same runtime. Confirm with the user.

## Step 2: Remove Version Pin Files

```bash
rm -f .tool-versions .mise.toml mise.toml
```

If per-directory pins exist (e.g. `services/api/.tool-versions`), find and remove:

```bash
find . -name '.tool-versions' -not -path './node_modules/*' -delete
find . -name '.mise.toml' -not -path './node_modules/*' -delete
```

## Step 3: Remove Pre-commit Hook Entry

### husky

Edit `.husky/pre-commit` and remove the line running `scripts/check-tool-versions.sh`.

### pre-commit framework

Edit `.pre-commit-config.yaml` and remove the `tool-versions` local hook.

```bash
pre-commit uninstall  # only if this was the sole user of the framework
```

### lefthook

Edit `lefthook.yml` and remove the `tool-versions` command block.

## Step 4: Remove Helper Script

```bash
rm -f scripts/check-tool-versions.sh
```

## Step 5: Remove CI Integration

### GitHub Actions (mise)

Edit `.github/workflows/*.yml` and remove the `jdx/mise-action` step plus any `mise run ...` calls. Replace with plain `setup-node`, `setup-python`, etc. if versions are still needed:

```yaml
- uses: actions/setup-node@v4
  with: { node-version: 22 }
```

### GitHub Actions (asdf)

Remove the `asdf-vm/actions/install@v3` step.

### Other providers (GitLab, CircleCI)

Remove mise/asdf setup steps. Restore vendor-specific version setup (e.g. GitLab's `image: node:22`, CircleCI orbs).

## Step 6: Uninstall mise / asdf Locally (Optional)

Only do this if no other projects on the developer machine use mise/asdf.

```bash
# mise
mise implode   # wipes ~/.local/share/mise and config

# asdf
rm -rf ~/.asdf
# remove shell activation from ~/.bashrc / ~/.zshrc
```

## Step 7: Restore Alternate Version Files (Optional)

If the project previously used `.nvmrc` or `.python-version` before switching to mise/asdf, restore the appropriate file so editors and CI continue working:

```bash
echo "22" > .nvmrc
echo "3.12" > .python-version
```

## Step 8: Remove from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name mise-asdf --project --json
```

## Notes

- Installed tool versions on developer machines remain on disk; `mise implode` / `rm -rf ~/.asdf` fully wipes them
- CI caches for mise/asdf tool installs will eventually expire and be garbage-collected by the CI provider
- If `.mise.toml` contained `[env]` or `[tasks]` blocks used by scripts, port those to a `.env` or `justfile` before removing
