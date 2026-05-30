## Recovery from failure

If at any point the run fails due to SDK issues or corrupted state or journal,
analyze the error and the journal events. Recover the state and journal to the
last known good state, adapt, and try to continue the run.

If `run:events` or `run:status --json` shows `PROCESS_RUNTIME_ERROR`, prefer the
targeted recovery command before manual journal edits:

```bash
$CLI run:recover-process-error <runId> --dry-run --json
$CLI run:recover-process-error <runId> --patch-effect '<effectId>:checks=[]' --json
```

Patch the offending task result only when the fix is clear. Running recovery
without a patch is allowed, but the next `run:iterate` should honestly rethrow if
the bad result remains.

When recovery requires it, repair the actual process/run artifacts instead of
only describing the problem. If the process authored a bad loop, impossible
shell command, or permanently failing effect pattern, edit the process file
itself. If the run metadata is what is blocking replay, repair the journal
entries and/or task files/results so the next `run:iterate` can proceed from a
coherent state.

{{#hasNonNegotiables}}
### Failure Protocol (required)

When blocked or failed, follow this order:

1. Report the concrete blocker and root cause (command/output based, not vague).
2. Attempt repair of current run/session/journal first.
3. If the blocker is caused by bad process logic or bad recorded effect state,
   modify the process file and/or the relevant journal/task artifacts before
   retrying.
4. Present recovery options when strategy changes intent/scope:
   - Option A: continue intent-faithful repair path (recommended)
   - Option B: reduced-scope fallback (requires explicit user approval)
5. Do not create a new simplified process without explicit approval if it
   reduces scope or quality expectations.
6. Resume orchestration only after the chosen recovery path is explicit.
{{/hasNonNegotiables}}
