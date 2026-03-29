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
- using this means the user wants to run autonomously with minimal manual
  interruption, so optimize for that by skipping or minimizing any steps that
  would require user input or decision-making during the run
- do not create a separate command surface here; this skill only forwards into
  `babysit`
