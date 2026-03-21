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
- Team install pins content and rules for the workspace; it is not the sole process-library root.
- This command doc is where install implementation details belong: manifest verification, lockfile handling, workspace metadata writes, and any fallback process-library behavior.
- If SDK capabilities are missing in your installed version, babysitter-codex falls back to compatibility behavior where possible.
