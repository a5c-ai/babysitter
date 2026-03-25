---
description: Start an interactive babysitter orchestration run.
argument-hint: Specific instructions for the run
---

# babysitter:call

## Purpose

Start an interactive babysitter orchestration run.

## Usage

```text
babysitter call Specific instructions for the run
```

## Example

```text
babysitter call implement auth with tests
```

## Notes

- Use command phrases in Codex chat (`babysitter ...`), not custom slash commands.
- The primary Codex plugin path is hook-first through `.codex/hooks.json` (`SessionStart`, `UserPromptSubmit`, `Stop`).
- Low-level runtime mechanics live here and in `.codex/skills/babysitter/call/SKILL.md`, not in the top-level README or install guide.
- The implementation should create or bind honestly, let the `Stop` hook own continuation, write value payloads to `output.json`, and post outcomes through SDK commands rather than direct `result.json` writes.
