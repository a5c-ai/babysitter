---
description: Set or show model routing policy by phase.
argument-hint: show | clear | set <phase>=<model>
---

# babysitter:model

## Purpose

Set or show model routing policy by phase.

## Usage

```text
babysitter model show | clear | set <phase>=<model>
```

## Example

```text
babysitter model set plan=gpt-5 execute=gpt-5-codex
```

## Notes

- Use command phrases in Codex chat (`babysitter ...`), not custom slash commands.
- If SDK capabilities are missing in your installed version, babysitter-codex falls back to compatibility behavior where possible.
