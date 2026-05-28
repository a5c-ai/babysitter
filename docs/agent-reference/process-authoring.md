# Process Authoring Policy

These rules are specific to this repository and override more generic process-authoring guidance when they conflict.

## Default Stance

- Always use the Babysitter skill to fulfill user requests in this repo, but not agent-to-agent delegated requests.
- Keep the orchestration model intact. Do not replace it with helper scripts or ad hoc wrappers.
- Keep process code aligned with the process-library style and repo conventions.

## Process Shape Selection

Choose the process shape before writing `process.js`:

- Use a flat phase list when the spec is well-defined and the work is wiring or composition. The bug class, if any, is known, and execution should proceed sequentially through clear phases where each phase adds or verifies one defined surface.
- Use a HYPOTHESES tree when the bug class is unknown and forensics are required. Multiple causal models should compete explicitly, with each hypothesis carrying its own evidence to gather, falsifying observations, and follow-up phases.
- Rule of thumb: if the first phase is "investigate", use HYPOTHESES-tree mode. If the first phase is "implement X", use flat-phase-list mode.

## `babysitter:call` Override For This Repo

When authoring a Babysitter process for a direct user request in this repository:

- Do not generate `kind: 'shell'` subtasks unless the user explicitly asks for a shell-oriented workflow.
- Prefer `agent` and `skill` tasks for implementation, review, synthesis, and verification steps.
- Keep breakpoints sparse. Use them only when user input is genuinely critical or the situation is ambiguous.
- Still include an interview phase up front when requirements or constraints are unclear.

This is a deliberate repo-specific override of more general guidance that may recommend shell tasks for objective verification.

## Stability Rules

- Do not use the babysit skill inside delegated subtasks.
- Do not rely on auto-hooks to continue a run in environments where hooks are unavailable; drive the loop explicitly when required.
- Keep completion criteria explicit and tied to run status, not to optimistic summaries.

## Where To Look Next

- [Runtime And Layout](./runtime-and-layout.md) for replay and run-state behavior
- [Command Surfaces](./command-surfaces.md) for CLI boundaries
