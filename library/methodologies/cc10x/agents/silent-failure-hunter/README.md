# Silent Failure Hunter Agent

Error handling gap detector that runs in parallel with code-reviewer during BUILD workflows. Zero tolerance for empty catch blocks.

## Detection Targets

- Empty catch blocks (always critical)
- Swallowed exceptions
- Missing async error handling
- Unhandled promise rejections
- Null/undefined access without guards
- Missing IO timeout handling

## Invocation

Used by process: `methodologies/cc10x/cc10x-build` (parallel with code-reviewer)
