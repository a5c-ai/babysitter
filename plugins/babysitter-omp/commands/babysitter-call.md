---
name: babysitter:call
description: Start a babysitter orchestration run
arguments:
  - name: prompt
    description: The task to orchestrate
    required: true
---

Start a babysitter orchestration run. Creates a new run using the SDK, binds it to the current session, and begins iteration.

This command initialises a fresh babysitter run with the given prompt, associates it with the active oh-my-pi session, and kicks off the first orchestration iteration. The loop driver will continue iterating automatically on subsequent `agent_end` events until the run completes, fails, or a guard trips.
