---
name: babysitter:doctor
description: Diagnose the health of a babysitter run
arguments:
  - name: runId
    description: Optional run ID to diagnose (defaults to the active run)
    required: false
---

Run diagnostic checks against a babysitter run to identify potential issues. Inspects run metadata, journal integrity, state cache, lock files, and effect health.
