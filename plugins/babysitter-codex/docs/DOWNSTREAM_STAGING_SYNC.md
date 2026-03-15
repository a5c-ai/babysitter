# Downstream Staging Sync Process

This process keeps `a5c-ai/babysitter:staging` updated whenever this repository
(`babysitter-codex`) changes.

## Goal

On each push to `main` in `babysitter-codex`:

1. Sync this repository into the plugin path inside Babysitter.
2. Push/update a branch in your Babysitter fork.
3. Create or update one rolling PR into `a5c-ai/babysitter:staging`.

Workflow file:
- `.github/workflows/sync-to-babysitter-staging.yml`

## Required Setup

1. Fork `a5c-ai/babysitter` into your GitHub account/org.
2. Add repository secret in `babysitter-codex`:
   - `BABYSITTER_SYNC_GH_TOKEN`
   - Value: PAT that can push to your fork and open PRs against `a5c-ai/babysitter`.
3. Configure repository variables in `babysitter-codex` (optional, defaults shown):
   - `BABYSITTER_UPSTREAM_REPO` = `a5c-ai/babysitter`
   - `BABYSITTER_UPSTREAM_BASE_BRANCH` = `staging`
   - `BABYSITTER_UPSTREAM_FORK_REPO` = `<your-user-or-org>/babysitter`
   - `BABYSITTER_UPSTREAM_PLUGIN_PATH` = `plugins/babysitter-codex`

## Behavior

- Trigger: `push` to `main` and manual `workflow_dispatch`.
- Sync branch in fork: `sync/babysitter-codex-auto` (force-updated each run).
- PR target: `${BABYSITTER_UPSTREAM_REPO}:${BABYSITTER_UPSTREAM_BASE_BRANCH}`.
- If no file changes are detected, no commit/PR update is made.
- Sync trace file is written to:
  - `<plugin-path>/SOURCE_VERSION`

## Synced Content

The workflow syncs the full repository into the configured plugin path,
excluding:

- `.git/`
- `node_modules/`
- `.a5c/`
- `.DS_Store`

This includes documentation (`README.md`, `docs/`, `CHANGELOG.md`) with each sync.

## Operational Notes

- Keep upstream changes landing in `staging` first.
- After merge to upstream staging, close the loop by verifying the PR points to
  the latest source SHA from `SOURCE_VERSION`.
