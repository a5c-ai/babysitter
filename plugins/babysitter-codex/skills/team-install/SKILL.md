---
name: team-install
description: Install the team-pinned Babysitter Codex workspace setup.
---

# team-install

Load and use the installed `babysit` skill.

Resolve the request in `team-install` mode:

- treat everything after `$team-install` as team-install arguments or intent
- focus on shared workspace setup and team-pinned configuration
- do not create a separate command surface here; this skill only forwards into
  `babysit`
