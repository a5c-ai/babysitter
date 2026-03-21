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
- The primary Codex path is explicit turn-state control via `babysitter-codex-turn`, not `.codex/orchestrate.js`.
- Low-level runtime mechanics live here and in `.codex/skills/babysitter/call/SKILL.md`, not in the top-level README or install guide.
- The implementation should create or bind honestly, advance one turn at a time, write value payloads to `output.json`, and post outcomes through the runtime helper rather than direct `result.json` writes.
- If SDK capabilities are missing in your installed version, babysitter-codex falls back to compatibility behavior where possible.
