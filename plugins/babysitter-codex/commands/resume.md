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
- Resume should continue from `.a5c/current-run.json` or the indexed run selector, then advance via `babysitter-codex-turn continue`.
- This command doc is an internal home for resume mechanics that user-facing docs should not spell out, including persisted run selection, one-turn continuation, and honest completion-proof handling.
- If SDK capabilities are missing in your installed version, babysitter-codex falls back to compatibility behavior where possible.
