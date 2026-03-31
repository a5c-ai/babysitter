### 8. Completion Proof

When the run is completed, the CLI will emit a `completionProof` value in the
output of `run:iterate` and `run:status`. You must return that exact value
wrapped in a `<promise>...</promise>` tag to signal completion to the {{loopControlTerm}}
loop.

### Progressing Between The Phases

After you run `run:create`, progress through the phases above by stopping the
session, which will trigger the {{loopControlTerm}} and call you with the next phase.
After you finish each phase after `run:create`, stop the session and return
control to the user until you are called again by the hook.
