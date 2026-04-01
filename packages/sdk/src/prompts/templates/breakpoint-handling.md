#### 5.1 Breakpoint Handling

{{#hasIntentFidelityChecks}}
##### 5.1.0 Mode Detection and Breakpoint Policy

- If the user is present in chat, default to interactive breakpoint handling.
- Use non-interactive handling only when execution context is explicitly
  non-interactive (for example no question tool / explicit non-interactive run).
- Never auto-approve breakpoints when mode is ambiguous. Treat ambiguity as
  interactive and ask explicitly.
- Any mode switch that changes approval behavior must be stated explicitly in
  the run notes.
{{/hasIntentFidelityChecks}}

##### 5.1.1 Interactive mode

Ask the user explicitly for approval. Include explicit approve/reject options
so the user's intent is unambiguous.

**CRITICAL: Response validation rules:**
- If the response is empty, no selection, or dismissed: treat as **NOT
  approved**. Re-ask the question or keep the breakpoint pending. Do NOT
  proceed.
- NEVER fabricate, synthesize, or infer approval text. Only pass through the
  user's actual selected response verbatim.
- NEVER assume approval from ambiguous, empty, or missing responses. When in
  doubt, the answer is "not approved".

**CRITICAL: Breakpoint rejection posting rules:**
- Breakpoint rejection MUST be posted with `--status ok` and a value of
  `{"approved": false, "response": "..."}`. NEVER use `--status error` for a
  user rejection -- that signals a task execution failure and will trigger
  `RUN_FAILED`, requiring manual journal surgery to recover.
- Only use `--status error` if the {{interactiveToolName}} itself throws an error.

**Breakpoint posting examples:**

```bash
# User approved the breakpoint
echo '{"approved": true, "response": "Looks good, proceed"}' > tasks/<effectId>/output.json
$CLI task:post <runId> <effectId> --status ok --value tasks/<effectId>/output.json

# User rejected the breakpoint (ALWAYS use --status ok, not --status error)
echo '{"approved": false, "response": "Stop here"}' > tasks/<effectId>/output.json
$CLI task:post <runId> <effectId> --status ok --value tasks/<effectId>/output.json
```

**Breakpoint value payload schema:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `approved` | `boolean` | Yes | Whether the user approved the breakpoint |
| `response` | `string` | No | The user's response text or selected option |
| `feedback` | `string` | No | Additional feedback from the user |

{{#cap.breakpoint-routing}}
**Breakpoint routing fields:**

When calling `ctx.breakpoint()`, you can include routing fields to control who receives the breakpoint and how responses are collected:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `expert` | `string \| string[]` | No | Domain expert identifier, or `'owner'` to route back to the run requester |
| `tags` | `string[]` | No | Categorization tags for filtering breakpoints |
| `strategy` | `'single' \| 'first-response-wins' \| 'collect-all' \| 'quorum'` | No | Response collection strategy. Only meaningful when `expert !== 'owner'`. Default: `'single'` |
| `previousFeedback` | `string` | No | Feedback from a previous rejection (used in retry loops) |
| `attempt` | `number` | No | Current retry attempt number |

**Breakpoint rejection handling -- retry/refine pattern:**

Processes must ALWAYS loop back on rejection, never fail. Use the following clean retry/refine pattern:

```javascript
let lastFeedback = null;
for (let attempt = 0; attempt < 3; attempt++) {
  if (lastFeedback) {
    currentResult = await ctx.task(refineTask, { ...args, feedback: lastFeedback, attempt: attempt + 1 });
  }
  const approval = await ctx.breakpoint({
    question: 'Review and approve this step?',
    options: ['Approve', 'Request changes'],
    expert: 'owner',
    tags: ['approval-gate'],
    previousFeedback: lastFeedback || undefined,
    attempt: attempt > 0 ? attempt + 1 : undefined,
  });
  if (approval.approved) break;
  lastFeedback = approval.response || approval.feedback || 'Changes requested';
}
```
{{/cap.breakpoint-routing}}

##### 5.1.2 Non-interactive mode

When the run was created with `--non-interactive`, breakpoints are auto-approved
at the runtime level and never appear as pending effects. No orchestrator action
is needed for breakpoints in this mode.

If running non-interactively without the `--non-interactive` flag (e.g. no
question tool available), choose the best option from context and post the
result. Rejections still use `--status ok` with `{"approved": false}`.
