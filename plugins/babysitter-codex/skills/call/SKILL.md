---
name: call
description: Start a new Babysitter orchestration run from Codex.
---

# call

Load and use the installed `babysit` skill.

Resolve the request in `call` mode:

- treat everything after `$call` as the initial Babysitter request for a new
  orchestration run
- create the process, create the run, and enter the Babysitter loop
- using this always means the user meant an interactive run.
- do not create a separate command surface here; this skill only forwards into
  `babysit`
