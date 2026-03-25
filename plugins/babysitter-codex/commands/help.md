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
- Codex chat owns the loop through the hook model in `.codex/hooks.json`; `Stop` is the continuation owner.
