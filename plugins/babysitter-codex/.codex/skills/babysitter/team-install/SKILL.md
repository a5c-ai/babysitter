---
name: babysitter:team-install
description: Install or refresh a team-pinned babysitter runtime/content setup from lockfile.
argument-hint: "[--dry-run]"
---

# babysitter:team-install

Install the team-standard babysitter-codex setup from the installed skill payload into the current workspace.

## Steps

1. Resolve the installed skill root from this `SKILL.md` location, not from the repo `cwd`.
2. Run the packaged installer against the current workspace.
3. Confirm generated files:
- `.a5c/team/install.json`
- `.a5c/team/profile.json`
- `.a5c/active/process-library.json`

The installer must read:
- `<skillRoot>/babysitter.lock.json`

The installer must bootstrap the active process library through the Babysitter SDK CLI:
- clone or update the original Babysitter repo under `<workspace>/.a5c/process-library/...`
- bind the active process root with `babysitter process-library:use ...`
- resolve the active path later with `babysitter process-library:active --state-dir <workspace>/.a5c --json`

The installer must write workspace state only under:
- `<workspace>/.a5c/`

Use this before onboarding new repos or contributors so command/process/rules mappings are deterministic and do not depend on the plugin repo being checked out beside the target project.
