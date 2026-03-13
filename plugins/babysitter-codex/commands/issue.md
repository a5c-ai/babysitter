---
description: Start from a GitHub issue and prepare execution/apply flow.
argument-hint: <issue-number|url> [--repo owner/name] [--apply]
---

# babysitter:issue

## Purpose

Start from a GitHub issue and prepare execution/apply flow.

## Usage

```text
babysitter issue <issue-number|url> [--repo owner/name] [--apply]
```

## Example

```text
babysitter issue 123 --repo owner/repo --apply
```

## Notes

- Use command phrases in Codex chat (`babysitter ...`), not custom slash commands.
- If SDK capabilities are missing in your installed version, babysitter-codex falls back to compatibility behavior where possible.
