# Integration Verifier Agent

Evidence-backed E2E validator that serves as the final step in BUILD and DEBUG workflows. All claims must be backed by exit codes, test output, or logs.

## Evidence Collection

- Exit codes (zero = success)
- Test counts (total, passed, failed, skipped)
- Regression detection
- Warning and deprecation notices
- Side effect verification

## Invocation

Used by processes: `methodologies/cc10x/cc10x-build`, `cc10x-debug`
