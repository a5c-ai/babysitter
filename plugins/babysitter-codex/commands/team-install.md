---
description: Install team-pinned runtime/content from lockfile.
argument-hint: [--dry-run]
---

# babysitter:team-install

## Purpose

Install team-pinned runtime/content from lockfile.

## Usage

```text
babysitter team-install [--dry-run]
```

## Example

```text
babysitter team-install
```

## Notes

- Use command phrases in Codex chat (`babysitter ...`), not custom slash commands.
- Team install writes workspace `.codex/*`, `.a5c/team/*`, and the active process-library binding.
- This command doc is where install implementation details belong: lockfile handling, workspace metadata writes, and SDK process-library bootstrap behavior.
