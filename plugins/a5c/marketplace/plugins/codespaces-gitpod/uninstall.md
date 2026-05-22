# codespaces-gitpod — Uninstall Instructions

## Step 1: Interview the User

Ask what to remove:

1. **Gitpod only** — Remove `.gitpod.yml` and `.gitpod.Dockerfile` but keep Codespaces config
2. **Codespaces only** — Remove `.devcontainer/` cloud-specific scripts but keep Gitpod
3. **Everything** — Remove all cloud-dev config
4. **Selective** — Let the user pick

**Warning**: Removing cloud-dev config will break any teammate currently using Codespaces or Gitpod workspaces. Confirm before proceeding.

## Step 2: Remove Gitpod Files

```bash
rm -f .gitpod.yml .gitpod.Dockerfile
```

If the Gitpod badge was added to the README, edit `README.md` and remove the `Open in Gitpod` line.

## Step 3: Remove Codespaces-Specific Scripts

If `.devcontainer/` was created solely for cloud dev (not also for local development), remove it:

```bash
rm -rf .devcontainer/
```

If the user wants to keep `.devcontainer/` for local dev container usage, remove only the cloud-specific hooks:

```bash
rm -f .devcontainer/on-create.sh .devcontainer/post-start.sh
```

Edit `.devcontainer/devcontainer.json` to drop `hostRequirements`, `portsAttributes`, and `onCreateCommand` / `postStartCommand` entries.

## Step 4: Disable Codespaces Prebuilds

Prebuilds are configured via the GitHub UI, not a file. Navigate to:

```
Settings → Codespaces → Prebuild configurations → <config> → Disable
```

Or delete the prebuild configuration entirely. This also deletes cached prebuild templates (storage savings).

## Step 5: Remove Cloud-Dev CI Workflow

```bash
rm -f .github/workflows/cloud-dev.yml
```

If devcontainer/gitpod checks were merged into an existing workflow, remove only those jobs.

## Step 6: Remove VS Code Extensions Recommendations (Optional)

If `.vscode/extensions.json` was added purely for cloud-dev parity, remove entries no longer relevant:

```bash
# review then edit or delete
rm -f .vscode/extensions.json
```

## Step 7: Stop Active Workspaces

Notify team members to commit and close any open Codespaces or Gitpod workspaces — they will be stranded after the config is removed from `main`.

Codespaces: `gh codespace list` → `gh codespace delete <name>`
Gitpod: delete via https://gitpod.io/workspaces

## Step 8: Remove from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name codespaces-gitpod --project --json
```

## Notes

- User dotfiles repositories (configured in Codespaces/Gitpod user settings) are unaffected
- Repository secrets stored in `Settings → Codespaces → Secrets` persist — manually remove any that become orphaned
- CI history from the removed workflow remains in GitHub Actions run history
- Gitpod prebuild history is retained by Gitpod per their retention policy
