---
name: doctor
description: Diagnose Babysitter run health, integration issues, or orchestration failures.
---

# doctor

Load and use the installed `babysit` skill.

Resolve the request in `doctor` mode:

- treat everything after `$doctor` as the run selector, subsystem, or problem
  statement to diagnose
- focus on run health, orchestration correctness, and recovery guidance
- do not create a separate command surface here; this skill only forwards into
  `babysit`
