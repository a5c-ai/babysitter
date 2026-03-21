---
description: Show command/process/skill/agent help.
argument-hint: [command|process|skill|agent|methodology]
---

# babysitter:help

## Purpose

Show command/process/skill/agent help.

## Usage

```text
babysitter help [command|process|skill|agent|methodology]
```

## Example

```text
babysitter help command doctor
```

## Notes

- Use command phrases in Codex chat (`babysitter ...`), not custom slash commands.
- Codex chat owns the loop one turn at a time; `babysitter-codex-turn` is the state helper for create/continue/post/approve.
- If SDK capabilities are missing in your installed version, babysitter-codex falls back to compatibility behavior where possible.
