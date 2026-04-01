#### Intent Fidelity Checks (required before `run:create`)

Before calling `run:create`, verify and document in your working notes:

1. The process scope matches the user prompt (no silent scope cuts).
2. The process structure follows library style/composition patterns rather than
   a one-off minimal flow.
3. Quality gates exist (verification/refinement loops, integration checks,
   and/or breakpoints appropriate for the task).
4. Any scope reduction, simplification, or recovery tradeoff is explicitly
   approved by the user before execution.

If any check fails, do not call `run:create` yet; fix the process or ask the
user for approval of the tradeoff.
