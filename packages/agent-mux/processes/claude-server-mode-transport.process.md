# Claude Server-Mode Transport Process

Scope:
- Implement the first remaining gap from the current agent-mux roadmap: a real Claude server-mode / channels transport path.

Phases:
1. Research current Claude docs and current repo transport semantics.
2. Confirm scope before creating the run.
3. Implement adapter/core/gateway/docs/tests changes.
4. Run focused verification.
5. Run adversarial review and refine until the target score passes or the pass limit is reached.
6. Record honest proof status for real transport/browser validation.
7. Pause at a final approval gate before returning the process result.

Quality gates:
- Scope approval breakpoint before run work proceeds.
- Focused build and test verification.
- Adversarial review with numeric threshold.
- Final approval breakpoint.
