# Root Cause & Guardrail

- When diagnosing a failure, keep asking *why* until you reach a cause
  a change can actually fix. A fix that only makes the symptom go away
  leaves the cause live elsewhere.
- Prefer a small change at the root over a large change at the surface.
  If the surface-level fix is faster, note what the real cause is so it
  can be revisited.
- When the same bug category has already appeared more than once, add a
  guardrail: a test that reproduces it, a lint/type rule that blocks
  it, or a pre-commit/CI check. A guardrail that would not catch the
  next occurrence is not worth adding.
- Do not disable tests, checks, or safety rails to make a run pass.
  Either fix the underlying issue, or stop and surface it.
