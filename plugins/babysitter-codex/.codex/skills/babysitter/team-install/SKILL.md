---
name: babysitter:team-install
description: Install or refresh a team-pinned babysitter runtime/content setup from lockfile.
argument-hint: "[--dry-run]"
---

# babysitter:team-install

Install or refresh the packaged Babysitter Codex workspace setup from the
installed skill payload into the current workspace.

## Steps

1. Resolve the installed skill root from this package, not from a repo checkout.
2. Read `<skillRoot>/babysitter.lock.json`.
3. Clone or update the upstream Babysitter repo under
   `<workspace>/.a5c/process-library/babysitter-repo`.
4. Bind `<workspace>/.a5c/process-library/babysitter-repo/library` through the
   Babysitter SDK CLI.
5. Write or refresh:
   - `<workspace>/.codex/hooks.json`
   - `<workspace>/.codex/config.toml`
   - `<workspace>/.a5c/team/install.json`
6. Create `<workspace>/.a5c/team/profile.json` if it does not already exist.

The installer must also produce:
- `<workspace>/.a5c/active/process-library.json`

The installer must not:
- bundle the process library into the package
- create a fake Codex plugin manifest
- depend on an external orchestrator or app-server loop

Use this before onboarding new repos or contributors so the Codex-facing assets
and the active process-library binding are deterministic.
