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

## Strike-3 Post-Instrumentation Contract

When a Strike-3 or post-instrumentation handoff asks for a data-driven fix,
the next source-code fix phase is blocked until the interpretation contract is
satisfied:

- Enumerate at least 3 candidate root-cause hypotheses before writing a fix.
- For each hypothesis, name the falsifying log line or observation that would
  disprove it.
- Select the fix only after citing concrete log evidence: use the seq number
  when present, otherwise cite timestamp, log-id, or artifact path plus the
  exact log line.
- If no proposed fix cites at least one specific log line or log record, mark
  the handoff `needs-more-data` instead of accepting or opening a fix PR.

This contract is scoped to Strike-3/post-instrumentation fix handoffs. Do not
apply it as a blanket requirement for ordinary first-attempt bug fixes.

## Agent Task Responders

Use internal agent tasks for most contributor-facing process work. They are the
default `kind: "agent"` shape and are best for synthesis, review, planning,
classification, and other text-first work that does not require a separate agent
workspace.

```javascript
export const summarizeTask = defineTask("summarize-docs", () => ({
  kind: "agent",
  title: "Summarize documentation gaps",
  agent: {
    name: "docs-gap-summarizer",
    prompt: {
      role: "technical documentation reviewer",
      task: "Read the target docs and summarize missing contributor guidance.",
    },
  },
}));
```

Use an external agent responder only when the work benefits from another
adapters adapter: for example, tool-heavy code editing, browser or shell access,
a specialist harness, or an isolated conversation context. The current
tasks-adapter routing model uses `responderType: "agent"` plus an `adapter` routing
hint on the agent task.

```javascript
export const implementationReviewTask = defineTask("implementation-review", () => ({
  kind: "agent",
  title: "Review implementation with an external responder",
  agent: {
    name: "external-reviewer",
    responderType: "agent",
    adapter: "codex",
    prompt: "Review the working tree diff and report blocking issues.",
    model: "gpt-5.5",
    provider: "openai",
    timeout: 300_000,
    approvalMode: "yolo",
    maxTurns: 10,
    fallbackType: "internal",
  },
}));
```

External agent responders require `adapter`; `model`, `provider`, `timeout`,
`approvalMode`, and `maxTurns` are optional routing hints passed through to the
agent responder when the backend supports them. `fallbackType: "internal"`
means the task may degrade to the normal internal agent path when adapters or
the preferred adapter is unavailable. Without an explicit fallback, a missing
adapters install, missing adapter, authentication failure, timeout, or adapter
crash should surface as a failed task result rather than silently changing
responders.

Some design notes and older planning artifacts refer to
`agent.external: true` and `fallbackToInternal`. Treat those as legacy
terminology for the same authoring intent; new contributor examples should use
`responderType: "agent"` and `fallbackType: "internal"` so tasks-adapter can route
the effect consistently.

## `babysitter:call` Override For This Repo

When authoring a Babysitter process for a direct user request in this repository:

- Do not generate `kind: 'shell'` subtasks unless the user explicitly asks for a shell-oriented workflow.
- Prefer `agent` and `skill` tasks for implementation, review, synthesis, and verification steps.
- Keep breakpoints sparse. Use them only when user input is genuinely critical or the situation is ambiguous.
- Still include an interview phase up front when requirements or constraints are unclear.

This is a deliberate repo-specific override of more general guidance that may recommend shell tasks for objective verification.

When a shell task returns JSON that later process code reads as structured data, declare a top-level `outputSchema` on the shell `TaskDef`. The shared SDK commit path validates successful posted values before `result.json`, `EFFECT_RESOLVED`, hooks, registry updates, or state-cache mutation. Use `outputSchema: false` or omit the field to preserve unvalidated legacy behavior.

```javascript
export const liveVerifyTask = defineTask('live-verify', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Live verification',
  shell: {
    command: `cd ${args.projectDir || '.'} && node scripts/live-verify.js`,
    expectedExitCode: 0,
    timeout: 60000
  },
  outputSchema: {
    type: 'object',
    required: ['verified', 'checks'],
    properties: {
      verified: { type: 'boolean' },
      checks: { type: 'array' }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));
```

## `babysitter:plan` Reuse Audit

For plan-only requests, run Phase 0 -- REUSE-AUDIT before drafting process or
infrastructure work:

- Extract keyword nouns and verbs from the user's prompt.
- Scan for matching migrations, API routes, environment variables, SDK
  dependencies, and imports.
- Honor `.a5c/reuse-audit.json` when present for scan globs and keyword
  extraction rules.
- Render `Reuse-audit findings (REVIEW BEFORE PROCEEDING)` before Phase 1,
  including a brief "No matching existing infrastructure found" note when the
  audit has no matches.

The plan should use these findings as context before proposing new tables,
routes, credentials, SDK installs, or equivalent infrastructure.

## Stability Rules

- Do not use the babysit skill inside delegated subtasks.
- Do not rely on auto-hooks to continue a run in environments where hooks are unavailable; drive the loop explicitly when required.
- Keep completion criteria explicit and tied to run status, not to optimistic summaries.

## Where To Look Next

- [Runtime And Layout](./runtime-and-layout.md) for replay and run-state behavior
- [Command Surfaces](./command-surfaces.md) for CLI boundaries
