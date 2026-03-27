# @a5c-ai/babysitter-codex

Babysitter integration package for OpenAI Codex CLI.

This package is a Codex skill bundle plus installer assets. It is not a native
Codex plugin manifest and it does not run an external orchestrator. The Codex
plugin path is:

- installed skill bundle under `~/.codex/skills/babysit`
- global `~/.codex/hooks.json`
- global `~/.codex/hooks/`
- global `~/.codex/config.toml`
- optional user-local prompt aliases under `~/.codex/prompts/call.md`,
  `plan.md`, `resume.md`, `yolo.md`, and the rest of the Babysitter modes
- optional workspace `.codex/hooks.json`
- optional workspace `.codex/hooks/`
- optional workspace `.codex/config.toml`
- workspace `.a5c/` state
- shared global Babysitter state under `~/.a5c`
- Babysitter SDK CLI for run creation, iteration, result posting, and
  process-library binding

## What This Package Installs

Global install copies the Codex-facing runtime bundle into `CODEX_HOME`:

- `SKILL.md`
- `.codex/`
- `prompts/` as the source for user-local prompt aliases
- `scripts/`
- `babysitter.lock.json`
- `hooks/`
- `hooks.json`
- `config.toml`

It does not bundle the process library.

## Integration Model

Babysitter for Codex uses only the hooks model:

- `SessionStart` seeds Babysitter session state
- `UserPromptSubmit` handles prompt-time transformations
- `Stop` yields continuation back into the Babysitter orchestration loop

The process library is fetched at global install time through the SDK CLI and
bound for active use in `~/.a5c/active/process-library.json`.

## Installation

Install the SDK CLI first:

```bash
npm install -g @a5c-ai/babysitter-sdk
```

Run the Codex package installer:

```bash
npx @a5c-ai/babysitter-codex install
```

Global install is the default when no scope flag is provided.

This explicit install now also clones or updates the process library into
`~/.a5c/process-library/babysitter-repo` and binds it as the default active
process library in `~/.a5c/active/process-library.json` through the SDK CLI.
It also installs the global Codex hooks/config surface under `~/.codex`.

Then install the Codex plugin payload into the target workspace:

```bash
npx @a5c-ai/babysitter-codex install --workspace /path/to/repo
```

Fetching the npm package does not mutate the current repo or workspace. Workspace
onboarding is a separate explicit step.

## What `team-install.js` Does

`scripts/team-install.js` is the explicit workspace installer used by
`babysitter harness:install-plugin codex --workspace ...`.

It:

1. Resolves the installed package root.
2. Reads `babysitter.lock.json`.
3. Installs the workspace-local Codex skill into `.codex/skills/babysit`.
4. Installs the prompt aliases into `.codex/prompts`.
5. Copies hook scripts into `.codex/hooks`.
6. Resolves the active shared process library with
   `babysitter process-library:active --json`.
7. Writes or refreshes `<workspace>/.codex/hooks.json`.
8. Creates or merges `<workspace>/.codex/config.toml` so the workspace has the
   required Codex settings.
9. Writes `<workspace>/.a5c/team/install.json`.
10. Creates `<workspace>/.a5c/team/profile.json` if it does not already exist.

It does not create an external orchestrator, bundle the process library, or
turn the workspace into a fake Codex plugin manifest.

## Resulting Workspace Files

After a successful workspace install, the important files are:

- `.codex/skills/babysit/SKILL.md`
- `.codex/prompts/call.md`
- `.codex/prompts/plan.md`
- `.codex/prompts/resume.md`
- `.codex/hooks/`
- `.codex/hooks.json`
- `.codex/config.toml`
- `.a5c/team/install.json`
- `.a5c/team/profile.json`

## Using It In Codex

Use the skill directly:

```text
$babysit implement authentication with tests
```

The optional prompt aliases are the mode shortcuts:

```text
/call implement authentication with tests
/plan migration from monolith to services
/resume latest
```

Each prompt alias should only forward into the `babysit` skill for the
matching mode. Low-level SDK commands remain runtime mechanics, not the
user-facing interface.

## Verification

Verify the installed skill bundle:

```bash
npm ls -g @a5c-ai/babysitter-codex --depth=0
ls -1 ~/.codex/skills/babysit
test -f ~/.codex/hooks.json
test -f ~/.codex/hooks/babysitter-stop-hook.sh
test -f ~/.codex/skills/babysit/scripts/team-install.js
test -f ~/.codex/skills/babysit/.codex/hooks/babysitter-stop-hook.sh
test -f ~/.codex/prompts/call.md
test -f ~/.codex/prompts/plan.md
test -f ~/.codex/prompts/resume.md
```

Verify the active shared process-library binding:

```bash
babysitter process-library:active --json
```

## License

MIT
