# Git hooks

Local git hooks for agent-mux. No `husky` dependency — just a shell script
in this directory plus a one-line `git config` to point git at it.

## Install

```bash
npm run hooks:install
```

This runs `git config core.hooksPath .githooks`, which tells git to use this
directory instead of the default `.git/hooks`.

On Unix shells the hook file needs the executable bit:

```bash
chmod +x .githooks/pre-commit
```

On Windows (Git Bash / WSL / PowerShell with git) the script runs via the
`#!/usr/bin/env sh` shebang and `sh.exe` shipped with Git for Windows; no
chmod needed.

## What it does

The `pre-commit` hook runs:

1. `npm run lint` — ESLint (flat config, includes the local
   `max-file-lines` rule capped at 400 effective lines).
2. `npx tsc --noEmit` — typecheck across the whole workspace.
3. `npx vitest run --reporter=dot` — unit tests.

If any step fails, the commit is aborted.

## Skipping (emergency only)

```bash
git commit --no-verify ...
```
