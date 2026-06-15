# Hook Event Gaps — Specs for Remaining Runtime Work

These events are defined in the atlas graph and the hooks-adapter canonical contract. As of issue #636, hooks-adapter core, Claude adapter normalization/rendering, CLI invoke coverage, adapters Claude runtime hook registration, and SDK task lifecycle hooks cover the concrete surfaces that exist today.

This file now tracks remaining runtime-emission gaps, plus `TeammateIdle`, which is blocked until the stack has a concrete teammate idle lifecycle source.

## Priority 1 — Tool & Turn Lifecycle (4 events)

### PostToolUseFailure
**Canonical phase:** `tool.after_failure`
**Fires:** After a tool call fails (error, timeout, permission denied at execution)
**Input:** `{ tool_name, tool_input, error, exit_code }`
**Decisions:** Cannot block (side-effect only). Can inject `additionalContext`.
**Where to implement:**
- hooks-adapter: ✅ canonical phase and Claude adapter support exist
- adapters: ✅ native Claude runtime hook registration exists
- agent-platform: Fire after tool execution error in effect resolution
- SDK: Add to runtime hook dispatch in `callRuntimeHook()`

### PostToolBatch
**Canonical phase:** `tool.after_batch`
**Fires:** After a parallel batch of tool calls resolves (all tools in one model turn)
**Input:** `{ batch_results: [{ tool_name, tool_input, success, output }] }`
**Decisions:** Can block (prevents next model invocation). Can inject `additionalContext`.
**Where to implement:**
- hooks-adapter: ✅ canonical phase and Claude adapter support exist
- adapters: ✅ native Claude runtime hook registration exists
- agent-platform: Fire after all effects in one iteration resolve
- SDK: Add batch-level hook dispatch after parallel task resolution

### StopFailure
**Canonical phase:** `turn.stop_failure`
**Fires:** When a turn ends due to API error (rate limit, auth failure, server error)
**Input:** `{ error_type, error_message, retry_after }`
**Matcher:** Error type (`rate_limit`, `authentication_failed`, `billing_error`, `server_error`)
**Decisions:** Cannot block. Can inject context for recovery.
**Where to implement:**
- hooks-adapter: ✅ canonical phase and Claude adapter support exist
- adapters: ✅ native Claude runtime hook registration exists
- agent-platform: Fire on API errors in orchestration loop
- agent-core: Emit error event from session.prompt() catch block

### UserPromptExpansion
**Canonical phase:** `turn.prompt_expansion`
**Fires:** Before a slash command/skill expands into its content
**Input:** `{ expansion_type, command_name, command_args, command_source, prompt }`
**Matcher:** Command name
**Decisions:** Can block (prevent expansion). Can modify prompt via `additionalContext`.
**Where to implement:**
- hooks-adapter: ✅ canonical phase and Claude adapter support exist
- adapters: ✅ native Claude runtime hook registration exists
- SDK: Fire before skill invocation in CLI dispatch

## Priority 2 — Task & Team (3 events)

### TaskCreated
**Canonical phase:** `task.created`
**Fires:** When a task/effect is being created (ctx.task() in process)
**Input:** `{ task_id, task_kind, task_title, task_labels }`
**Decisions:** Can block (prevent task creation). Can modify task metadata.
**Where to implement:**
- hooks-adapter: ✅ canonical phase and Claude adapter support exist
- adapters: ✅ native Claude runtime hook registration exists
- SDK: ✅ fires in `runTaskIntrinsic()` before effect dispatch
- agent-platform: Uses SDK task lifecycle paths where applicable

### TaskCompleted
**Canonical phase:** `task.completed`
**Fires:** When a task/effect is marked complete
**Input:** `{ task_id, task_kind, task_status, task_result }`
**Decisions:** Can block (prevent completion, request re-do).
**Where to implement:**
- hooks-adapter: ✅ canonical phase and Claude adapter support exist
- adapters: ✅ native Claude runtime hook registration exists
- SDK: ✅ fires in effect result commit
- agent-platform: Uses SDK task lifecycle paths where applicable

### TeammateIdle
**Canonical phase:** `team.idle`
**Fires:** When a teammate agent is about to go idle (no more work)
**Input:** `{ agent_id, agent_type, idle_reason }`
**Decisions:** Can block (assign more work before idle).
**Where to implement:**
- hooks-adapter: ✅ canonical phase and Claude adapter support exist
- adapters: intentionally not registered until a native/runtime source exists
- agent-platform: Fire in subagent lifecycle management once a real idle boundary exists
- Requires multi-agent coordination infrastructure

## Priority 3 — Session & Config (3 events)

### Setup
**Canonical phase:** `session.setup`
**Fires:** One-time initialization (`--init-only`, `--init`, `--maintenance`)
**Input:** `{ trigger: "init" | "maintenance" }`
**Decisions:** Cannot block. Can inject initial context.
**Where to implement:**
- hooks-adapter: ✅ canonical phase and Claude adapter support exist
- adapters: ✅ native Claude runtime hook registration exists
- SDK: Fire on first-time project initialization
- agent-platform: Fire during harness install/setup

### InstructionsLoaded
**Canonical phase:** `session.instructions_loaded`
**Fires:** When CLAUDE.md or rules files are loaded
**Input:** `{ file_path, memory_type, load_reason, globs, trigger_file_path, parent_file_path }`
**Matcher:** Load reason (`session_start`, `nested_traversal`, `path_glob_match`, `include`)
**Decisions:** Cannot block. Can inject `additionalContext`.
**Where to implement:**
- hooks-adapter: ✅ canonical phase and Claude adapter support exist
- adapters: ✅ native Claude runtime hook registration exists
- SDK: Fire when babysitterMdDiscovery loads instructions
- agent-platform: Fire when process library instructions load

### ConfigChange
**Note:** Already handled as canonical phase `session.config_changed`; do not use `session.config_change`.
**Status:** hooks-adapter and adapters support blocking decisions for native Claude `ConfigChange`.
**Where to fix:**
- S../platform: Add explicit config mutation emission only where a concrete config-write path owns the event.

## Priority 4 — Advanced (3 events)

### MessageDisplay
**Note:** Formalized as `message.received` in hooks-adapter and registered in adapters Claude runtime hooks.
**Gap:** S../platform streaming output emission remains separate from native Claude runtime hook dispatch.
**Where to fix:**
- agent-platform: Emit during streaming output

### model.before_request / model.after_response (Gemini-specific)
**Note:** These are in the atlas graph for Gemini adapter but not in the Claude Code 30-event spec.
**Status:** Low priority — only relevant for Gemini CLI integration.

### planner.before_tool_selection (Gemini-specific)
**Note:** Atlas graph only. Not in Claude Code spec.
**Status:** Low priority.
