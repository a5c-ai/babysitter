---
name: babysitter:team-install
description: Install or refresh a team-pinned babysitter runtime/content setup from lockfile.
argument-hint: "[--dry-run]"
---

# babysitter:team-install

Install the team-standard babysitter-codex setup from the installed skill payload into the current workspace.

## Steps

1. Resolve the installed skill root from this `SKILL.md` location, not from the repo `cwd`.
2. Verify the bundled content manifest from the installed skill root.
3. Run the packaged installer against the current workspace.
4. Confirm generated files:
- `.a5c/team/install.json`
- `.a5c/team/profile.json`

The installer must read:
- `<skillRoot>/babysitter.lock.json`
- `<skillRoot>/config/content-manifest.json`
- `<skillRoot>/upstream/babysitter/...`

The installer must write workspace state only under:
- `<workspace>/.a5c/team/`

Use this before onboarding new repos or contributors so command/process/rules mappings are deterministic and do not depend on the plugin repo being checked out beside the target project.
