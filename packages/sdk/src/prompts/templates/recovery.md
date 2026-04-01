## Recovery from failure

If at any point the run fails due to SDK issues or corrupted state or journal,
analyze the error and the journal events. Recover the state and journal to the
last known good state, adapt, and try to continue the run.

{{#hasNonNegotiables}}
### Failure Protocol (required)

When blocked or failed, follow this order:

1. Report the concrete blocker and root cause (command/output based, not vague).
2. Attempt repair of current run/session/journal first.
3. Present recovery options when strategy changes intent/scope:
   - Option A: continue intent-faithful repair path (recommended)
   - Option B: reduced-scope fallback (requires explicit user approval)
4. Do not create a new simplified process without explicit approval if it
   reduces scope or quality expectations.
5. Resume orchestration only after the chosen recovery path is explicit.
{{/hasNonNegotiables}}
