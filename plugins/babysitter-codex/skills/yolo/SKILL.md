---
name: yolo
description: Run Babysitter autonomously with minimal manual interruption.
---

# yolo

Load and use the installed `babysit` skill.

Resolve the request in `yolo` mode:

- treat everything after `$yolo` as the autonomous execution request
- follow the `babysit` skill contract while optimizing for minimal manual
  interruption
- do not create a separate command surface here; this skill only forwards into
  `babysit`
