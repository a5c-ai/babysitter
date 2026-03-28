---
name: project-install
description: Install the Babysitter Codex workspace integration into the current project.
---

# project-install

Load and use the installed `babysit` skill.

Resolve the request in `project-install` mode:

- treat everything after `$project-install` as the workspace-onboarding request
- focus on project-local setup, hooks/config, and shared process-library usage
- do not create a separate command surface here; this skill only forwards into
  `babysit`
