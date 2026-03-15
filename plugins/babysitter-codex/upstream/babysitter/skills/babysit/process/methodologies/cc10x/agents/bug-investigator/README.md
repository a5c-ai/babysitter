# Bug Investigator Agent

Log-first root cause analyst used in the DEBUG workflow. Reads evidence before forming hypotheses and documents bug patterns for future prevention.

## Investigation Method

1. Read all available logs, stack traces, and error output
2. Identify exact error location and call stack
3. Correlate with recent git changes
4. Form hypothesis with confidence rating (>=80% required)
5. Write regression test, then implement minimal fix

## Invocation

Used by process: `methodologies/cc10x/cc10x-debug`
