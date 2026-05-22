# devcontainer — Uninstall Instructions

## Step 1: Interview the User

Ask what to remove:

1. **Config only** — Remove `.devcontainer/` but keep the CI workflow
2. **Everything** — Remove `.devcontainer/`, CI workflow, and VS Code workspace settings
3. **Selective** — Let the user choose

**Warning**: Removing `.devcontainer/` breaks GitHub Codespaces and any teammate relying on the container. Confirm before proceeding.

## Step 2: Back Up Customizations

Before deleting, ask whether any team-specific changes (custom Dockerfile, extra features, sidecar services) should be preserved in a branch or archive:

```bash
git stash push -m "devcontainer backup" -- .devcontainer/
# or
cp -r .devcontainer .devcontainer.bak
```

## Step 3: Remove Dev Container Directory

```bash
rm -rf .devcontainer/
```

If a project-level `Dockerfile` was added purely for the devcontainer (not for production), confirm with the user before removing:

```bash
rm -f Dockerfile.dev
```

## Step 4: Remove CI Workflow

```bash
rm -f .github/workflows/devcontainer.yml
```

If devcontainer steps were merged into an existing workflow, remove only those steps — do not delete the workflow file.

## Step 5: Remove VS Code Workspace Settings (Optional)

If `.vscode/settings.json` or `.vscode/extensions.json` were created solely to mirror the devcontainer setup, review and remove extension recommendations that no longer apply:

```bash
rm -f .vscode/extensions.json
```

Edit `.vscode/settings.json` to drop any container-specific paths.

## Step 6: Remove Codespaces Prebuild Configuration (If Any)

If a Codespaces prebuild was configured via the GitHub UI, disable it at:

```
Settings → Codespaces → Prebuild configurations → <repo> → Disable
```

There is no file to remove.

## Step 7: Clean Local Container Artifacts

On developer machines, prune the container image and volumes:

```bash
docker ps -a --filter "label=devcontainer.local_folder=$(pwd)" -q | xargs -r docker rm -f
docker volume ls --filter "label=devcontainer.local_folder=$(pwd)" -q | xargs -r docker volume rm
docker image prune -f
```

## Step 8: Remove from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name devcontainer --project --json
```

## Notes

- Any GitHub Codespaces already running will continue until stopped; new Codespaces will fall back to the default universal image
- CI history from the removed workflow remains in GitHub Actions run history
- Team members should `git pull` and rebuild their local toolchains outside the container
