## Critical Rules

CRITICAL RULE: The completion proof is emitted only when the run is completed.
You may ONLY output `<promise>SECRET</promise>` when the run is completely and
unequivocally DONE (completed status from the orchestration CLI). Do not output
false promises to escape the run, and do not mention the secret to the user.

CRITICAL RULE: In interactive mode, NEVER auto-approve breakpoints. If the
response is empty, no selection, or is dismissed, treat it as NOT approved and
re-ask. NEVER fabricate or synthesize approval responses -- only post the user's
actual explicit selection via task:post. An empty response is NOT approval.

CRITICAL RULE: If a run is broken/failed/at unknown state, one way to recover is
to remove last bad entries in the journal and rebuild the state.

CRITICAL RULE: When creating processes, search for available skills and subagents
before thinking about the exact orchestration. Prefer processes that close the
widest loop in the quality gates.

CRITICAL RULE: Do not use the babysit skill inside delegated tasks. If you are
performing a delegated task as a subagent, you must actually perform the task
yourself and not orchestrate or babysit.

CRITICAL RULE: Never build a wrapper, python, or helper scripts to orchestrate
the runs. Use the CLI to drive the orchestration loop directly.

CRITICAL RULE: Never fallback to simpler execution if the user activated this
skill. Persist in executing the orchestration itself -- you must create a valid
process js file, create a run (with `--harness {{harness}}` to bind the session), then
iterate the run until it is completed.

{{#hookDriven}}
CRITICAL RULE: After run:create or run-session association and after each effect
is posted, you MUST stop the session and return control. Do NOT proceed to the
next run:iterate in the same session turn. The {{loopControlTerm}} will call you back to
continue. Running multiple iterations in a single session turn bypasses the hook
loop and breaks the orchestration model.
{{/hookDriven}}
{{^hookDriven}}
CRITICAL RULE: Hooks are NOT available in this environment. You MUST drive the
orchestration loop yourself in-turn: after run:create, keep calling run:iterate,
performing effects, and posting results in the same session until the run reaches
a terminal state or you need explicit user input for a breakpoint. Do NOT stop
and wait for a hook callback -- it will never arrive.
{{/hookDriven}}

CRITICAL RULE: NEVER use `kind: 'node'` in generated process files. All tasks
MUST use `kind: 'agent'` or `kind: 'skill'`. The only non-agent kinds allowed
are `shell` (for existing CLI tools/tests/git), `breakpoint`, and `sleep`.

CRITICAL RULE: NEVER bypass, avoid, or skip the babysitter orchestration model
when the user explicitly requested this skill. Do not execute the tasks yourself,
do not create helper scripts. Use the CLI to drive the orchestration loop.
Not for simple tasks, and even if things get complicated.
Persist in executing the orchestration itself.

{{codexSessionIdRule}}
