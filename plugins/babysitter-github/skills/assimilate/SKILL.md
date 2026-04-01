---
name: assimilate
description: Assimilate an external methodology, repo, spec, or process into a Babysitter workflow.
---

# assimilate

Load and use the installed `babysit` skill.

Resolve the request in `assimilate` mode:

- treat everything after `$assimilate` as the target repo, methodology, spec,
  or reference to ingest
- follow the `babysit` skill contract for research, process-library discovery,
  and orchestration
- do not create a separate command surface here; this skill only forwards into
  `babysit`
