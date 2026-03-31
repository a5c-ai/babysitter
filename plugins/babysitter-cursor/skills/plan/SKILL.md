---
name: plan
description: Plan a Babysitter workflow without executing the run.
---

# plan

Load and use the installed `babysit` skill.

Resolve the request in `plan` mode:

- treat everything after `$plan` as the planning request
- focus on building the best process possible without creating and running the
  actual run unless the user explicitly changes mode
- do not create a separate command surface here; this skill only forwards into
  `babysit`
