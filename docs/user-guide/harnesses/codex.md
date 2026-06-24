[Docs](../index.md) › [Harnesses](./install-matrix.md) › Codex

# Codex

**Tier:** Fully supported · **Repo:** `a5c-ai/babysitter-codex` · **Harness key:** `codex`

---

## In Plain English

**On Codex you get the full Babysitter experience through the `$` mention picker: type `$babysitter:call` (and friends) to drive an orchestration run.**

Install the [plugin](../reference/glossary.md) once, and Babysitter surfaces as a set of skills you invoke from Codex's mention picker. The orchestration loop is driven by Codex's `SessionStart + UserPromptSubmit + Stop` hooks, auto-detected from the plugin's `hooks.json`.

**Estimated time to first run:** about 5 minutes. **End state:** you can mention `$babysitter:call` in Codex and watch a run iterate to a quality target.

---

## On this page

- [Install](#install)
- [Verify](#verify)
- [Command Surface](#command-surface)
- [Hook / Continuation Model](#hook--continuation-model)
- [First Run](#first-run)
- [Related Documentation](#related-documentation)

---

## Install

```bash
# 1. Core CLI (host-side)
npm install -g @a5c-ai/babysitter

# 2a. Marketplace path
codex plugin marketplace add a5c-ai/babysitter --ref <released-tag> --sparse .agents/plugins
codex plugin list --marketplace babysitter
codex plugin add babysitter --marketplace babysitter
```

> Use the harness's released default branch / tag for `--ref` - **never** `--ref staging`. The Codex plugin publishes its own released tag; do not use a `5.1.1-staging.*` build-metadata version.

**Alternative (npx installer):**

```bash
npx --yes @a5c-ai/babysitter-codex install --global
# or, scoped to a workspace:
npx --yes @a5c-ai/babysitter-codex install --workspace <path>
```

**Alternative (SDK helper):**

```bash
babysitter harness:install-plugin codex [--workspace <path>]
```

---

## Verify

After install, open Codex and bring up the mention picker (`$`). You should see the `babysitter:*` skills (`$babysitter:babysit`, `$babysitter:call`, ...). If they are missing, re-run `codex plugin list --marketplace babysitter` to confirm the plugin is registered.

---

## Command Surface

Codex surfaces Babysitter as skills through the `$` **mention picker** (16 skills):

```
$babysitter:assimilate    $babysitter:babysit      $babysitter:call
$babysitter:doctor        $babysitter:forever      $babysitter:help
$babysitter:issue         $babysitter:model        $babysitter:observe
$babysitter:plan          $babysitter:project-install  $babysitter:resume
$babysitter:retrospect    $babysitter:team-install $babysitter:user-install
$babysitter:yolo
```

The core entry point is the `babysit` skill; `$babysitter:call`, `$babysitter:plan`, and `$babysitter:resume` are the wrappers you will use most. See [Slash Commands and Modes](../reference/slash-commands.md).

---

## Hook / Continuation Model

**Model: SessionStart + UserPromptSubmit + Stop.**

- Plugin-level lifecycle hooks are auto-detected via `./hooks/hooks.json`.
- The **proxied-stop** hook advances the orchestration loop after each turn.
- **UserPromptSubmit** participates in prompt handling.

This differs from Claude Code (which has no `UserPromptSubmit` in its loop) and from the non-Stop harnesses entirely. See [Hooks](../features/hooks.md) for the full per-harness table.

---

## First Run

```
$babysitter:call build a calculator with add, subtract, multiply, divide using TDD
```

Babysitter creates a run and iterates toward your quality target, pausing for approval at breakpoints. Resume with `$babysitter:resume`.

---

## Related Documentation

- [Installation](../getting-started/installation.md) · [Quickstart](../getting-started/quickstart.md)
- [Slash Commands and Modes](../reference/slash-commands.md)
- [Hooks](../features/hooks.md) · [Adapters](../features/adapters.md)
- [Install Matrix](install-matrix.md) - all other supported harnesses
- [Claude Code](claude-code.md) - the other fully-supported harness

---

## Next steps

- **Next:** [Install Matrix](./install-matrix.md)
- **Related:** [Claude Code](./claude-code.md), [Slash Commands](../reference/slash-commands.md), [Adapters](../features/adapters.md)
