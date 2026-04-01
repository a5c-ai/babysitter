### 3. Run Iteration

```bash
$CLI run:iterate .a5c/runs/<runId> --json --iteration <n>{{iterateFlagsSuffix}}
```

**Output:**
```json
{
  "iteration": 1,
  "status": "executed|waiting|completed|failed|none",
  "action": "executed-tasks|waiting|none",
  "reason": "auto-runnable-tasks|breakpoint-waiting|terminal-state",
  "count": 3,
  "completionProof": "only-present-when-completed",
  "metadata": { "runId": "...", "processId": "..." }
}
```

**Status values:**
- `"executed"` - Tasks executed, continue looping
- `"waiting"` - Breakpoint/sleep, pause until released
- `"completed"` - Run finished successfully
- `"failed"` - Run failed with error
- `"none"` - No pending effects

{{#hookDriven}}
**Common mistake to avoid:**
- wrong: Calling run:iterate, performing the effect, posting the result,
  then calling run:iterate again in the same session
- correct: Calling run:iterate, performing the effect, posting the result,
  then STOPPING the session so the hook triggers the next iteration
{{/hookDriven}}
{{^hookDriven}}
**Common mistake to avoid:**
- wrong: Stopping the session and waiting for a hook callback that will never
  arrive
- correct: After posting the result, continuing to the next run:iterate in the
  same turn until the run completes, since the {{loopControlTerm}} drives the loop
  in-turn
{{/hookDriven}}
