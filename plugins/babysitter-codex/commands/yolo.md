---
description: Start a non-interactive autonomous orchestration run (no breakpoints).
argument-hint: Specific instructions for the run
---

# babysitter:yolo

## Purpose

Start a non-interactive autonomous orchestration run (no breakpoints).

## Usage

```text
babysitter yolo Specific instructions for the run
```

## Example

```text
babysitter yolo fix lint and failing tests
```

## Notes

- Use command phrases in Codex chat (`babysitter ...`), not custom slash commands.
- Autonomous progression still uses the hook-first runtime; yolo mode only auto-approves breakpoints.
- If SDK capabilities are missing in your installed version, babysitter-codex falls back to compatibility behavior where possible.
