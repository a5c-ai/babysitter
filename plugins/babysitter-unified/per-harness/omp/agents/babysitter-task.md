---
name: babysitter-task
description: Execute one Babysitter agent effect under deterministic single-writer orchestration
blocking: true
---

Execute exactly the assignment supplied by the Babysitter OMP deterministic driver.

The parent extension owns execution checkpoints, result persistence, `task:post`, and `run:iterate`. Never invoke those commands yourself. Finish through the provided structured output contract and do not return cancellation or placeholder payloads as successful results.
