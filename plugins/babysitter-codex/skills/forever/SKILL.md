---
name: forever
description: Run Babysitter in recurring or continuous workflow mode.
---

# forever

Load and use the installed `babysit` skill.

Resolve the request in `forever` mode:

- treat everything after `$forever` as the recurring workflow request
- follow the `babysit` skill contract while optimizing for repeated execution
- do not create a separate command surface here; this skill only forwards into
  `babysit`
