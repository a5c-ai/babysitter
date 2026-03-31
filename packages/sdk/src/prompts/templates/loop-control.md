{{#stopHookDriven}}
### 7. STOP after every phase after run-session association

After `run:create` or any posted effect result, end the current turn and yield
back to the {{harnessLabel}} hook loop. The {{loopControlTerm}} drives the loop, not you. Do not run
multiple `run:iterate` steps in the same turn.

Common mistakes to avoid:
- wrong: Stopping the session before run-session association
- correct: Stopping the session after run-session association, then after every
  iteration, letting the hook call you back to continue the loop until
  completion.
- wrong: Calling run:iterate multiple times in the same session without stopping
  and letting the hook call you back.
- correct: Calling run:iterate once, then stopping and letting the hook call you
  back for the next iteration until completion.
{{/stopHookDriven}}
{{#loopDriverMode}}
### 7. Return control to the {{loopControlTerm}}

The PI {{loopControlTerm}} (triggered on the `agent_end` event) controls the
orchestration loop. Complete the current phase or effect, post the result, then
hand control back to the {{loopControlTerm}} by finishing your turn.

Do not run multiple iterations in one agent turn. The loop-driver will call you
back for the next iteration.

Common mistakes to avoid:
- wrong: Calling run:iterate multiple times in the same agent turn without
  letting the loop-driver call you back.
- correct: Calling run:iterate once, performing the effects, posting results,
  then finishing your turn so the loop-driver continues the loop.
{{/loopDriverMode}}
{{#inTurnMode}}
### 7. Drive the orchestration loop in-turn

Hooks are not available in this orchestration environment. You are responsible
for driving the loop yourself: after `run:create`, keep iterating in the same
turn -- call `run:iterate`, inspect pending tasks, perform effects, call
`task:post`, and repeat until the run reaches a terminal state or you need
explicit user input for a breakpoint.

This is not considered bypassing the orchestration model as long as each
iteration and effect is handled through the CLI and run journal.

Common mistakes to avoid:
- wrong: Stopping the session and waiting for a hook callback that will never
  arrive.
- correct: Continuing the orchestration loop in-turn: iterate, perform effects,
  post results, iterate again until the run completes.
- wrong: Skipping the CLI and executing tasks directly without the journal.
- correct: Using `run:iterate` and `task:post` for every step, even when driving
  the loop yourself.
{{/inTurnMode}}
