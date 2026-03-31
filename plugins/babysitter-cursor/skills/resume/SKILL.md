---
name: resume
description: Resume an existing Babysitter run from Cursor IDE/CLI.
---

# resume

Load and use the installed `babysit` skill.

Resolve the request in `resume` mode:

- treat everything after `$resume` as the run selector or run id
- focus on restoring the orchestration context and continuing the run honestly
- do not create a separate command surface here; this skill only forwards into
  `babysit`
