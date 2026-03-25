---
description: Onboard babysitter into the current project.
argument-hint: Project setup instructions
---

# babysitter:project-install

## Purpose

Onboard babysitter into the current project.

## Usage

```text
babysitter project-install Project setup instructions
```

## Example

```text
babysitter project-install for this repository
```

## Notes

- Use command phrases in Codex chat (`babysitter ...`), not custom slash commands.
- Project onboarding should layer Codex config, profile, and pinned-content setup around the active process roots.
- Do not describe project onboarding as creating a project-only process-library scope.
- Use the real workspace install path: `babysitter harness:install-plugin codex --workspace <repo>`.
- Keep low-level onboarding mechanics here or in the Codex skill docs, not in user-facing README copy.
