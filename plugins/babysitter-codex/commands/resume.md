---
description: Resume an existing babysitter run/session.
argument-hint: [selector|run-id]
---

# babysitter:resume

## Purpose

Resume an existing babysitter run/session.

## Usage

```text
babysitter resume [selector|run-id]
```

## Example

```text
babysitter resume recent
```

## Notes

- Use command phrases in Codex chat (`babysitter ...`), not custom slash commands.
- Resume should continue from `.a5c/current-run.json` or the indexed run selector, then rely on the Codex `Stop` hook to continue the loop after each yield.
- This command doc is an internal home for resume mechanics that user-facing docs should not spell out, including persisted run selection, hook-owned continuation, and honest completion-proof handling.
