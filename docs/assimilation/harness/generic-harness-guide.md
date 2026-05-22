# Generic Harness Integration Guide for Babysitter SDK

A step-by-step implementation guide for integrating the babysitter SDK orchestration
loop into any AI coding harness. This document is harness-agnostic and uses pseudocode
throughout. For the canonical reference implementation, see
[Claude Code Integration](./claude-code-integration.md).

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Core Integration Points](#2-core-integration-points)
   - [2a. SDK Installation](#2a-sdk-installation)
   - [2b. Session Initialization](#2b-session-initialization)
   - [2c. Run Creation and Session Binding](#2c-run-creation-and-session-binding)
   - [2d. The Orchestration Loop Driver](#2d-the-orchestration-loop-driver)
   - [2e. Effect Execution](#2e-effect-execution)
   - [2f. Result Posting](#2f-result-posting)
   - [2g. Iteration Guards](#2g-iteration-guards)
3. [Harness Capability Matrix](#3-harness-capability-matrix)
4. [Session State Contract](#4-session-state-contract)
5. [Hook Equivalence Table](#5-hook-equivalence-table)
6. [CLI Output Schemas](#6-cli-output-schemas)
7. [CLI Error Handling](#7-cli-error-handling)
8. [Edge Cases](#8-edge-cases)
9. [Testing the Integration](#9-testing-the-integration)
10. [Reference Implementation](#10-reference-implementation)

---

## 1. Prerequisites

Your harness must provide (or be able to emulate) the following capabilities before
you begin integration. Each item is marked as REQUIRED or RECOMMENDED.

### Checklist

- [ ] **REQUIRED: Shell or script execution** -- The harness must be able to execute
  shell commands (`bash`, `sh`, `cmd`) or invoke Node.js scripts. The babysitter CLI
  is a Node.js binary invoked via shell. Every integration point depends on running
  `babysitter <command>` and reading its JSON output from stdout.

- [ ] **REQUIRED: Exit/stop interception** -- The harness must provide a mechanism to
  intercept the AI agent's attempt to end its turn or exit the conversation. This is
  the single most critical requirement. Without it, the orchestration loop cannot
  function. Examples:
  - A "stop hook" that fires before the agent's response is finalized
  - A middleware layer that can reject an exit signal and re-inject context
  - A wrapper around the agent loop that checks a condition before allowing termination

- [ ] **REQUIRED: Context re-injection** -- After blocking an exit, the harness must
  be able to inject new text (a system message, user message, or tool result) into the
  agent's context so it continues working. The injected content comes from the
  babysitter CLI output.

- [ ] **REQUIRED: Session/conversation identity** -- The harness must provide a stable
  identifier for the current session or conversation. This ID is used to:
  - Name the session state file
  - Associate the session with a babysitter run
  - Track iteration count across stop-hook cycles

- [ ] **RECOMMENDED: Lifecycle hooks** -- Pre-session, post-session, pre-turn,
  post-turn hooks simplify integration. If unavailable, equivalent behavior can be
  built by wrapping the agent's main loop.

- [ ] **RECOMMENDED: Transcript access** -- Access to the agent's recent output text
  enables completion proof verification (scanning for `<promise>` tags). If
  unavailable, an alternative proof mechanism must be implemented (see Section 2d).

- [ ] **RECOMMENDED: Persistent environment** -- Environment variables or a key-value
  store that persists across hook invocations within the same session. Used to carry
  the session ID and plugin root path.

### Minimum Environment

```
Node.js >= 18
npm >= 8
File system access (read/write to working directory)
```

---

## 2. Core Integration Points

Implement these in order. Each section includes a checklist, pseudocode, and the
specific CLI commands involved.

```
+-----------------------------------------------------------------------+
|                         YOUR HARNESS                                  |
|                                                                       |
|  +------------------+  +-----------------------+  +----------------+  |
|  | Session Lifecycle |  | Exit/Stop Interceptor |  | Agent Loop     |  |
|  | (start/end)      |  | (block or approve)    |  | (LLM turns)   |  |
|  +--------+---------+  +-----------+-----------+  +-------+--------+  |
|           |                        |                      |           |
+-----------------------------------------------------------------------+
            |                        |                      |
            v                        v                      v
   +-------------------+   +-------------------+   +------------------+
   | babysitter CLI    |   | Session State     |   | Run Directory    |
   | (npm package)     |   | {stateDir}/       |   | .a5c/runs/{id}/  |
   |                   |   |   {sessionId}.md  |   |   journal/       |
   | session:init      |   +-------------------+   |   tasks/         |
   | run:create        |                           |   state/         |
   | run:assign-process|                           +------------------+
   | session:associate |
   | run:iterate       |
   | task:list         |
   | task:post         |
   | session:check-    |
   |   iteration       |
   | session:iteration-|
   |   message         |
   | run:status        |
   +-------------------+
```

---

### 2a. SDK Installation

**Goal:** Ensure the `babysitter` CLI binary is available on PATH.

#### Checklist

- [ ] Determine the SDK version to install (from plugin manifest or pinned version)
- [ ] Attempt global install; fall back to local prefix install; fall back to npx
- [ ] Gate installation behind a marker file to avoid repeated install attempts
- [ ] Verify the CLI is callable: `babysitter version --json`

#### Pseudocode

```
function ensureBabysitterCLI(sdkVersion):
    markerFile = "{pluginRoot}/.babysitter-install-attempted"

    if commandExists("babysitter"):
        return "babysitter"

    if fileExists(markerFile):
        // Already tried installing; fall through to npx
    else:
        // Attempt global install
        result = shell("npm install -g @a5c-ai/babysitter-sdk@{sdkVersion}")
        if result.exitCode != 0:
            // Fallback: install with local prefix
            result = shell("npm install -g @a5c-ai/babysitter-sdk@{sdkVersion} --prefix $HOME/.local")
        writeFile(markerFile, "attempted")

    if commandExists("babysitter"):
        return "babysitter"

    // Final fallback: use npx on every invocation
    return "npx -y @a5c-ai/babysitter-sdk@{sdkVersion} babysitter"
```

#### CLI Command

```bash
# Verify installation
babysitter version --json
# Expected: { "version": "x.y.z", "sdkVersion": "..." }
```

---

### 2b. Session Initialization

**Goal:** Create a baseline session state file so the orchestration loop can track
iterations from the very start of the session, even before any run is created.

#### When to Call

At session/conversation start -- before the user has issued any commands. This is
typically wired into a "session start" lifecycle hook or called at the top of the
agent's main loop.

#### Checklist

- [ ] Obtain or generate a unique session ID
- [ ] Determine the state directory (typically `{pluginRoot}/skills/babysit/state/`)
- [ ] Call `babysitter session:init`
- [ ] Persist the session ID in the harness environment for later hook invocations

#### Pseudocode

```
function onSessionStart(sessionId, pluginRoot):
    stateDir = "{pluginRoot}/skills/babysit/state"
    ensureDirectoryExists(stateDir)

    result = shell(
        "babysitter session:init" +
        " --session-id {sessionId}" +
        " --state-dir {stateDir}" +
        " --json"
    )

    if result.exitCode != 0:
        log("WARNING: session init failed, orchestration may not work")
        return

    // Persist session ID for use by the stop interceptor
    setEnv("AGENT_SESSION_ID", sessionId)
    setEnv("BABYSITTER_PLUGIN_ROOT", pluginRoot)
```

#### What This Creates

A session state file at `{stateDir}/{sessionId}.md` in BASELINE state (empty
`run_id`, `iteration: 1`). See [Section 4: Session State Contract](#4-session-state-contract)
for the full file format, field definitions, and state transition diagram.

---

### 2c. Run Creation and Session Binding

**Goal:** Create a babysitter run and bind it to the current session so the stop
interceptor knows which run to check.

#### When to Call

After the user requests a task that should be orchestrated. Typically triggered by a
skill or command within the harness (e.g., the user says "babysit this task").

#### Checklist

- [ ] Prepare the process definition (entry point, process ID, inputs)
- [ ] Call `babysitter run:create` with harness and session parameters
- [ ] Call `babysitter session:associate` to bind the run to the session
- [ ] Verify the session state file now has a non-empty `run_id`

#### Pseudocode

```
function createAndBindRun(processId, entryPoint, inputs, prompt, sessionId, pluginRoot):
    // Step 1: Create the run
    createResult = shell(
        "babysitter run:create" +
        " --process-id {processId}" +
        " --entry {entryPoint}" +
        " --inputs {inputsFilePath}" +
        " --prompt \"{prompt}\"" +
        " --json"
    )
    runId = parseJson(createResult.stdout).runId
    runDir = ".a5c/runs/{runId}"

    // Step 2: Bind session to run
    shell(
        "babysitter session:associate" +
        " --session-id {sessionId}" +
        " --run-id {runId}" +
        " --state-dir {pluginRoot}/skills/babysit/state" +
        " --json"
    )

    return { runId, runDir }
```

#### Re-entrant Run Prevention

If the session is already bound to a different run, `session:associate` will fail.
The harness must either:
1. Complete or clean up the existing run first
2. Remove the old session state file manually
3. Present an error to the user

---

### 2d. The Orchestration Loop Driver

**Goal:** Convert the agent's single-turn execution into a multi-iteration
orchestration loop by intercepting exit signals, checking run status, and re-injecting
context.

This is the most critical and complex integration point.

#### Architecture

```
Agent executes turn
     |
     v
Agent signals "done" (stop/exit)
     |
     v
+--[EXIT INTERCEPTOR]----------------------------------------------+
|  1. Read session state file                                      |
|  2. Check guards (max iterations, runaway detect, no run bound)  |
|  3. Load run status via run:status                               |
|  4. Check completion proof                                       |
|  5. Decision: APPROVE or BLOCK                                   |
+--------+-------------------+-------------------------------------+
         |                   |
    [APPROVE]           [BLOCK]
         |                   |
         v                   v
    Session ends     Re-inject context ------> Agent continues
                     (iteration message)       (back to top)
```

#### The Decision Algorithm

```
function onAgentStop(sessionId, pluginRoot, runsDir, lastAgentOutput):
    stateDir = "{pluginRoot}/skills/babysit/state"
    stateFile = "{stateDir}/{sessionId}.md"

    // --- Guard 1: No state file means no active loop ---
    if not fileExists(stateFile):
        return APPROVE

    state = parseSessionState(stateFile)

    // --- Guard 2: Max iterations ---
    if state.iteration >= state.maxIterations:
        cleanupSessionFile(stateFile)
        return APPROVE

    // --- Guard 3: Runaway loop detection ---
    if state.iteration >= 5:
        avgTime = average(state.iterationTimes)  // last 3 durations
        if avgTime <= 15:  // seconds
            cleanupSessionFile(stateFile)
            return APPROVE

    // --- Guard 4: No run bound ---
    if state.runId == "":
        cleanupSessionFile(stateFile)
        return APPROVE

    // --- Check run status ---
    statusResult = shell(
        "babysitter run:status .a5c/runs/{state.runId} --json"
    )
    runStatus = parseJson(statusResult.stdout)

    // --- Guard 5: Unknown or unreadable run ---
    if statusResult.exitCode != 0:
        cleanupSessionFile(stateFile)
        return APPROVE

    // --- Guard 6: Completion proof ---
    if runStatus.state == "completed":
        proof = runStatus.completionProof
        promiseTag = extractPromiseTag(lastAgentOutput)
        if promiseTag == proof:
            cleanupSessionFile(stateFile)
            return APPROVE

    // --- BLOCK: Continue the loop ---
    // Advance session state from BOUND/ACTIVE to next iteration.
    // See Section 4 (Session State Contract) for field update rules
    // and the atomic write protocol.
    newIteration = state.iteration + 1
    updateSessionState(stateFile, {
        iteration: newIteration,
        lastIterationAt: now()
    })

    // Build the context message to re-inject
    // NOTE: session:iteration-message uses --iteration, --run-id,
    //       --runs-dir, and --plugin-root (NOT --session-id or --state-dir)
    iterationMessage = shell(
        "babysitter session:iteration-message" +
        " --iteration {newIteration}" +
        " --run-id {state.runId}" +
        " --runs-dir {runsDir}" +
        " --plugin-root {pluginRoot}" +
        " --json"
    )

    return BLOCK {
        reason: parseJson(iterationMessage.stdout).systemMessage,
        systemMessage: "Babysitter iteration {newIteration}/{state.maxIterations}"
    }
```

#### Intercepting Exit Signals

The mechanism depends entirely on your harness. Common patterns:

| Harness Type | Interception Mechanism |
|-------------|------------------------|
| Hook-based (Claude Code, etc.) | Register a `Stop` hook that receives agent output and returns block/approve |
| Middleware-based | Wrap the agent loop's exit check in a middleware that calls the decision algorithm |
| Event-based | Listen for "agent_turn_complete" events, cancel and re-queue if BLOCK |
| Loop-based | Replace the `while (running)` loop condition with the decision algorithm |
| API-based | Between API calls, run the check and decide whether to make another call |

#### Re-injecting Context

After blocking, the harness must feed the orchestration context back to the agent.
The mechanism depends on your harness:

| Harness Type | Re-injection Mechanism |
|-------------|------------------------|
| System message injection | Append the `reason` as a system message before the next turn |
| User message simulation | Insert a synthetic user message containing the iteration context |
| Tool result injection | Return the context as a tool call result |
| Context window prepend | Prepend the context to the agent's next input |

The content to inject comes from the `systemMessage` field of the
`session:iteration-message` output. It typically contains:
1. Iteration number and status
2. What to do next (run:iterate, execute effects, extract proof, etc.)
3. Pending effect kinds if the run is in "waiting" state

#### Detecting the Completion Proof

The completion proof is a SHA-256 hash that the agent must output inside
`<promise>...</promise>` tags. The harness must:

1. Scan the agent's last output for `<promise>VALUE</promise>`
2. Compare VALUE against the `completionProof` from `run:status --json`
3. If they match, allow exit

```
function extractPromiseTag(text):
    match = regex_search(text, "<promise>([\\s\\S]*?)</promise>")
    if match is null:
        return null
    return trim(match.group(1)).replace(/\\s+/, " ")
```

If the harness cannot access the agent's output text (no transcript), alternative
approaches:
- Have the agent call a special "complete" tool that the harness intercepts
- Use a dedicated CLI command that the agent calls to signal completion
- Implement a "completion callback" webhook

---

### 2e. Effect Execution

**Goal:** Execute the pending tasks that the babysitter run has requested, then post
their results.

#### The Effect Execution Cycle

```
babysitter run:iterate .a5c/runs/{runId} --json
        |
        v
  Returns: { status, pendingActions[], ... }
        |
        v
babysitter task:list .a5c/runs/{runId} --pending --json
        |
        v
  Returns: { tasks: [{ effectId, taskId, kind, status, label, ... }] }
        |
        v
  For each pending task:
        |
        +--[kind = "node"]----------> Execute Node.js script
        |
        +--[kind = "breakpoint"]----> Present to user for approval
        |
        +--[kind = "sleep"]---------> Wait until specified time
        |
        +--[kind = "orchestrator_  -> Delegate to a sub-agent or
        |    task"]                   orchestrator within your harness
        |
        +--[kind = "agent"]---------> Delegate to an agent subprocess
        |
        +--[custom kind]------------> Handle per your harness capabilities
        |
        v
  Post result via task:post (Section 2f)
```

#### Effect Result Type

All effect handlers must return a result conforming to this structure (or the
sentinel `DEFERRED` for effects that will be resolved later):

```
EffectResult = {
    status: "ok" | "error",
    value: object          // Payload specific to the effect kind
}

// For node tasks:
//   { status: "ok", value: <return value of the Node.js function> }
//   { status: "error", value: { message: string, stack?: string } }

// For breakpoints:
//   { status: "ok", value: { approved: boolean, approvedBy?: string, reason?: string } }

// For sleep:
//   { status: "ok", value: { wokeAt: string (ISO 8601), reason: string } }

// For orchestrator_task:
//   { status: "ok", value: { output: any, completedAt: string } }
//   { status: "error", value: { message: string, phase?: string } }

// For agent:
//   { status: "ok", value: { response: string, tokensUsed?: number } }
//   { status: "error", value: { message: string, exitCode?: number } }
```

#### Pseudocode

```
function executeEffects(runId):
    runDir = ".a5c/runs/{runId}"

    // Step 1: Iterate to discover pending effects
    iterResult = shell("babysitter run:iterate {runDir} --json")
    if iterResult.exitCode != 0:
        handleCLIError("run:iterate", iterResult)
        return

    iterData = parseJson(iterResult.stdout)

    if iterData.status == "completed":
        // Run is done -- extract proof and output it
        proof = iterData.completionProof
        agentOutput("<promise>{proof}</promise>")
        return

    if iterData.status == "failed":
        // Inspect error, attempt recovery
        return

    // Step 2: List pending tasks
    listResult = shell("babysitter task:list {runDir} --pending --json")
    if listResult.exitCode != 0:
        handleCLIError("task:list", listResult)
        return

    tasks = parseJson(listResult.stdout).tasks

    // Step 3: Execute each task
    for task in tasks:
        taskDir = "{runDir}/tasks/{task.effectId}"
        taskDef = readJson("{taskDir}/task.json")

        switch task.kind:
            case "node":
                result = executeNodeTask(taskDef)
            case "breakpoint":
                result = handleBreakpoint(taskDef)
            case "sleep":
                result = handleSleep(taskDef)
            case "orchestrator_task":
                result = handleOrchestratorTask(taskDef)
            case "agent":
                result = handleAgentTask(taskDef)
            default:
                result = handleCustomKind(task.kind, taskDef)

        // Step 4: Post result (skip deferred effects like long sleeps)
        if result != DEFERRED:
            postResult(runId, task.effectId, result)
```

#### Breakpoint Effect Handler

Breakpoints are human approval gates. The process pauses until a human explicitly
approves or rejects the breakpoint. **Never auto-approve breakpoints** -- they exist
specifically to require human judgment.

```
function handleBreakpoint(taskDef):
    // taskDef.args schema:
    //   {
    //     message?: string,         // Human-readable description of what needs approval
    //     description?: string,     // Alternative to message (checked as fallback)
    //     context?: {
    //       changedFiles?: string[],  // Files modified since last breakpoint
    //       summary?: string,         // Summary of work done so far
    //       risks?: string[],         // Identified risks requiring human review
    //       [key: string]: unknown    // Additional context from the process
    //     },
    //     requireExplicitApproval?: boolean,  // If true, never auto-approve (default: true)
    //     blocking?: boolean          // If true, the run cannot proceed without resolution (default: true)
    //   }

    message = taskDef.args.message or taskDef.args.description or "Approval required"
    context = taskDef.args.context or {}
    requireExplicit = taskDef.args.requireExplicitApproval != false  // default true

    // Present to user via your harness's interactive prompt mechanism
    if harnessSupportsInteractivePrompt():
        // Build a rich prompt with context if available
        promptBody = message
        if context.summary:
            promptBody += "\n\nSummary: " + context.summary
        if context.risks and length(context.risks) > 0:
            promptBody += "\n\nRisks:\n" + join(context.risks, "\n- ")
        if context.changedFiles and length(context.changedFiles) > 0:
            promptBody += "\n\nChanged files:\n" + join(context.changedFiles, "\n- ")

        userDecision = promptUser(
            title: "Babysitter Breakpoint",
            message: promptBody,
            options: ["approve", "reject"]
        )

        if userDecision == "approve":
            return { status: "ok", value: { approved: true, approvedBy: "user" } }
        else:
            return { status: "ok", value: { approved: false, reason: "User rejected" } }

    // Non-interactive fallback: reject with explanation
    // The agent will see this and can inform the user
    return {
        status: "ok",
        value: {
            approved: false,
            reason: "Non-interactive environment; breakpoint requires manual approval"
        }
    }
```

#### Sleep Effect Handler

Sleep effects pause execution until a specified time. The harness must decide whether
to block (wait inline) or defer (post result later).

```
function handleSleep(taskDef):
    // taskDef.args schema:
    //   {
    //     until?: string,          // ISO 8601 timestamp to sleep until
    //     sleepUntil?: string,     // Alias for 'until'
    //     durationMs?: number,     // Duration in milliseconds (alternative to until)
    //     reason?: string          // Human-readable reason for the sleep
    //   }
    //
    // Exactly one of (until | sleepUntil) or durationMs should be provided.
    // If both are present, the absolute timestamp (until/sleepUntil) takes precedence.

    sleepUntil = taskDef.args.until or taskDef.args.sleepUntil
    durationMs = taskDef.args.durationMs

    if sleepUntil:
        targetTime = parseISO8601(sleepUntil)
    else if durationMs:
        targetTime = now() + durationMs
    else:
        // No target time specified; resolve immediately
        return { status: "ok", value: { wokeAt: now(), reason: "no_target_time" } }

    remainingMs = targetTime - now()

    if remainingMs <= 0:
        // Sleep time already passed
        return { status: "ok", value: { wokeAt: now(), reason: "already_elapsed" } }

    if remainingMs <= 60000:  // 1 minute or less
        // Short sleep: block inline
        sleep(remainingMs)
        return { status: "ok", value: { wokeAt: now(), reason: "waited" } }

    // Long sleep: post a deferred result
    // Option A: Schedule a timer/cron to post the result later
    scheduleDelayedPost(runId, effectId, targetTime)
    // Do NOT post result now -- let the orchestration loop handle it
    // on the next iteration after the timer fires
    return DEFERRED  // signal to caller: do not post result yet
```

#### Orchestrator Task Effect Handler

Orchestrator tasks delegate a sub-process to an orchestrator or sub-agent within
your harness. The task definition contains a prompt, optional inputs, and
configuration for the sub-process.

```
function handleOrchestratorTask(taskDef):
    // taskDef.args schema:
    //   {
    //     prompt: string,           // The instruction for the sub-agent
    //     processId?: string,       // Optional sub-process ID to invoke
    //     inputs?: object,          // Inputs to pass to the sub-process
    //     constraints?: {
    //       maxIterations?: number, // Iteration limit for the sub-process
    //       timeout?: number        // Timeout in ms for the sub-process
    //     }
    //   }

    prompt = taskDef.args.prompt
    inputs = taskDef.args.inputs or {}
    constraints = taskDef.args.constraints or {}
    timeout = constraints.timeout or 900000  // default 15 min

    if harnessSupportsSubAgentDelegation():
        // Delegate to a sub-agent or internal orchestrator
        subResult = delegateToSubAgent({
            prompt: prompt,
            inputs: inputs,
            maxIterations: constraints.maxIterations or 50,
            timeout: timeout
        })

        if subResult.success:
            return {
                status: "ok",
                value: {
                    output: subResult.output,
                    completedAt: now()
                }
            }
        else:
            return {
                status: "error",
                value: {
                    message: subResult.error,
                    phase: subResult.failedPhase or "execution"
                }
            }

    // Fallback: execute as a simple prompt-response if no sub-agent support
    // This is a degraded mode -- the harness loses multi-step orchestration
    response = executePromptSingleTurn(prompt, inputs)
    return {
        status: "ok",
        value: {
            output: response,
            completedAt: now()
        }
    }
```

#### Agent Effect Handler

Agent effects delegate work to a standalone agent subprocess. Unlike
orchestrator_task, the agent effect expects a self-contained agent invocation
(typically a CLI tool or API call) that runs to completion.

```
function handleAgentTask(taskDef):
    // taskDef.args schema:
    //   {
    //     command: string,          // Agent command or prompt
    //     workingDir?: string,      // Working directory for the agent
    //     env?: Record<string, string>,  // Environment variables
    //     timeout?: number,         // Timeout in ms (default: 900000)
    //     captureOutput?: boolean   // Whether to capture stdout/stderr (default: true)
    //   }

    command = taskDef.args.command
    workingDir = taskDef.args.workingDir or getCwd()
    env = taskDef.args.env or {}
    timeout = taskDef.args.timeout or 900000  // default 15 min

    if harnessSupportsAgentSubprocess():
        // Spawn agent subprocess
        agentResult = spawnAgent({
            command: command,
            workingDir: workingDir,
            env: env,
            timeout: timeout
        })

        if agentResult.exitCode == 0:
            return {
                status: "ok",
                value: {
                    response: agentResult.stdout,
                    tokensUsed: agentResult.tokensUsed or null
                }
            }
        else:
            return {
                status: "error",
                value: {
                    message: agentResult.stderr or "Agent exited with code {agentResult.exitCode}",
                    exitCode: agentResult.exitCode
                }
            }

    // Fallback: treat as a shell command
    shellResult = shell(command, { cwd: workingDir, env: env, timeout: timeout })
    if shellResult.exitCode == 0:
        return { status: "ok", value: { response: shellResult.stdout } }
    else:
        return {
            status: "error",
            value: { message: shellResult.stderr, exitCode: shellResult.exitCode }
        }
```

#### Reading Task Definitions

Each pending task has a `task.json` in its effect directory:

```
.a5c/runs/{runId}/tasks/{effectId}/task.json
```

The task definition contains the task kind, arguments, labels, and other metadata
needed to execute it. Read it with:

```bash
babysitter task:show .a5c/runs/{runId} {effectId} --json
```

---

### 2f. Result Posting

**Goal:** Record effect execution results back into the run journal.

#### IMPORTANT

Always post results through the CLI. Never write `result.json` directly. The CLI
command handles:
1. Writing `result.json` with the correct schema version
2. Appending an `EFFECT_RESOLVED` event to the journal
3. Updating the state cache

#### Pseudocode

```
function postResult(runId, effectId, result):
    runDir = ".a5c/runs/{runId}"
    taskDir = "{runDir}/tasks/{effectId}"

    // Write the result value to a temporary file
    valueFile = "{taskDir}/output.json"
    writeJson(valueFile, result.value)

    // Post through the CLI
    shell(
        "babysitter task:post {runDir} {effectId}" +
        " --status {result.status}" +   // "ok" or "error"
        " --value {valueFile}" +
        " --json"
    )
```

#### CLI Command

```bash
# Success case
babysitter task:post .a5c/runs/{runId} {effectId} \
  --status ok \
  --value tasks/{effectId}/output.json \
  --json

# Error case
babysitter task:post .a5c/runs/{runId} {effectId} \
  --status error \
  --value tasks/{effectId}/error.json \
  --json
```

#### Result Status Values

| Status | Meaning |
|--------|---------|
| `ok` | Task completed successfully; value contains the result |
| `error` | Task failed; value contains error details |

---

### 2g. Iteration Guards

**Goal:** Prevent infinite loops and detect runaway behavior.

#### CLI Command

```bash
babysitter session:check-iteration \
  --session-id {sessionId} \
  --state-dir {stateDir} \
  --json
```

#### Output

See [Section 6: CLI Output Schemas](#session-check-iteration-output) for the full
schema. Summary:

- `shouldContinue: true` -- safe to proceed; `nextIteration` indicates the next number
- `shouldContinue: false` -- stop the loop; `reason` explains why (e.g.,
  `max_iterations_reached`, `session_not_found`)

#### Guard Logic

```
function checkIterationGuards(sessionId, stateDir):
    result = shell(
        "babysitter session:check-iteration" +
        " --session-id {sessionId}" +
        " --state-dir {stateDir}" +
        " --json"
    )
    data = parseJson(result.stdout)

    if not data.found:
        return { shouldContinue: false, reason: "no_session" }

    if not data.shouldContinue:
        return { shouldContinue: false, reason: data.reason }

    return { shouldContinue: true, nextIteration: data.nextIteration }
```

#### Two Detection Mechanisms

**1. Max Iterations Guard**

```
IF iteration >= maxIterations (default 65000):
    STOP -- allow exit, clean up state file
```

**2. Runaway Speed Guard**

```
IF iteration >= 5:
    avgDuration = average(last 3 iteration durations)
    IF avgDuration <= 15 seconds:
        STOP -- iterations are too fast, likely a runaway loop
```

The iteration duration is measured as the wall-clock time between consecutive
stop-hook invocations. Durations below 15 seconds on average (after at least 5
iterations) indicate the agent is not doing meaningful work.

**Threshold justifications:**

- **Why iteration >= 5:** The first few iterations are often fast because the
  agent is reading instructions, creating the run, and performing lightweight
  setup. A minimum of 5 iterations avoids false positives during this bootstrap
  phase while still catching runaways before significant resource waste. Empirical
  testing across Claude Code sessions showed that legitimate fast iterations
  (setup, binding, first iterate) are consistently complete within 3-4 cycles.

- **Why average <= 15 seconds:** A meaningful agent iteration -- one that reads
  files, calls an LLM, writes code, or executes tests -- typically takes 30-120
  seconds. The 15-second threshold provides a 2x safety margin below the minimum
  expected productive iteration time. Iterations under 15 seconds typically
  indicate the agent is stuck in a loop where it reads the iteration message,
  does no substantive work, and immediately signals completion. The 3-iteration
  rolling average (rather than a single iteration) smooths out one-off fast
  iterations caused by cached replay or quick task:post calls.

- **Tuning:** Both thresholds can be adjusted for specific harness environments.
  If your agent performs very lightweight iterations (e.g., posting pre-computed
  results), lower the speed threshold. If your setup phase is longer, raise the
  minimum iteration count. The `session:check-iteration` CLI command applies
  these same thresholds internally.

---

## 3. Harness Capability Matrix

### Required vs Optional Capabilities

| Capability | Required | Purpose |
|---|---|---|
| Shell command execution | YES | All CLI interactions |
| Exit/stop interception | YES | Core loop driver |
| Context re-injection | YES | Continue agent after BLOCK |
| Session identity | YES | State file naming, run binding |
| File system read/write | YES | State files, task artifacts |
| Transcript access | NO * | Completion proof via `<promise>` tag |
| Lifecycle hooks | NO | Simplifies wiring; can be emulated |
| Persistent environment | NO | Convenience; can pass via files |
| Interactive user prompts | NO | Breakpoint handling (non-interactive mode is fallback) |
| Sub-agent delegation | NO | orchestrator_task / agent effects |

\* If transcript access is unavailable, an alternative completion signaling mechanism
must be implemented.

### Integration Tiers

#### Tier 1: Minimum Viable Integration

Supports basic orchestration with node tasks and completion detection.

- [ ] SDK installation
- [ ] Session initialization
- [ ] Run creation and binding
- [ ] Exit interception with BLOCK/APPROVE
- [ ] `run:iterate` calls
- [ ] `task:list --pending` to discover effects
- [ ] Node task execution
- [ ] `task:post` to record results
- [ ] Completion proof detection (via transcript or alternative)
- [ ] Max iteration guard

#### Tier 2: Robust Integration

Adds safety guards and breakpoint support.

- [ ] Everything in Tier 1
- [ ] Runaway loop detection (iteration speed guard)
- [ ] `session:check-iteration` calls
- [ ] Interactive breakpoint handling
- [ ] Sleep effect handling
- [ ] Journal event recording for debugging

#### Tier 3: Full Integration

Complete feature parity with the Claude Code reference implementation.

- [ ] Everything in Tier 2
- [ ] Native lifecycle hooks (on-run-start, on-task-complete, etc.)
- [ ] Hook discovery (per-repo, per-user, plugin directories)
- [ ] Orchestrator task delegation
- [ ] Agent task delegation
- [ ] Quality scoring via on-score hooks
- [ ] Skill discovery and injection
- [ ] Non-interactive breakpoint auto-resolution

---

## 4. Session State Contract

### File Format

Session state files use Markdown with YAML frontmatter. The frontmatter stores
machine-readable state. The Markdown body stores the user's original prompt.

**Path convention:** `{stateDir}/{sessionId}.md`

#### Example

```markdown
---
active: true
iteration: 3
max_iterations: 65000
run_id: "my-run-abc123"
started_at: "2026-03-02T10:00:00Z"
last_iteration_at: "2026-03-02T10:05:30Z"
iteration_times: 45,62,58
---

Build a REST API with authentication and rate limiting for the user service.
```

### Required Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `active` | boolean | `true` | Whether the orchestration loop is active |
| `iteration` | number | `1` | Current iteration (1-based) |
| `max_iterations` | number | `65000` | Maximum iterations (0 = unlimited) |
| `run_id` | string | `""` | Bound run ID (empty before run:create) |
| `started_at` | string (ISO 8601) | now | Session start timestamp |
| `last_iteration_at` | string (ISO 8601) | now | Last iteration timestamp |
| `iteration_times` | string (CSV) | (empty) | Last 3 iteration durations in seconds |

### State Transitions

```
    CREATE                BIND               ITERATE (x N)        COMPLETE
  (session:init)    (session:associate)    (stop hook BLOCK)    (stop hook APPROVE)
       |                   |                     |                    |
       v                   v                     v                    v
  +-----------+     +-----------+          +-----------+       +------------+
  |  BASELINE |     |   BOUND   |          |  ACTIVE   |       |  CLEANED   |
  |           |---->|           |--------->|           |------>|   UP       |
  | runId=""  |     | runId=X   |          | iter=N+1  |       | file       |
  | iter=1    |     | iter=1    |          | times=[.] |       | inactive   |
  +-----------+     +-----------+          +-----------+       +------------+
```

### Atomic Write Protocol

Session state files must be written atomically to prevent corruption from
concurrent reads during stop-hook evaluation:

```
1. Write content to temp file: {filePath}.tmp.{pid}
2. Atomic rename: rename(tempFile, targetFile)
3. On error: delete temp file
```

### Timing Calculation

```
function updateIterationTimes(existingTimes, lastIterationAt, currentTime):
    durationSeconds = (currentTime - lastIterationAt) / 1000
    if durationSeconds <= 0:
        return existingTimes
    newTimes = append(existingTimes, durationSeconds)
    return lastN(newTimes, 3)   // keep only last 3
```

---

## 5. Hook Equivalence Table

The babysitter SDK and harness integration involve two categories of hooks:

### SDK Hooks (13 `KnownHookType` values)

These are dispatched by the SDK runtime during orchestration. They are defined in
`packages/sdk/src/hooks/types.ts` and fired via `callHook(hookType, payload)`.

| SDK Hook | Tier | Description |
|---|---|---|
| `on-run-start` | 3 | Fires after `run:create` completes |
| `on-run-complete` | 3 | Fires when `run:iterate` returns status=completed |
| `on-run-fail` | 3 | Fires when `run:iterate` returns status=failed |
| `on-task-start` | 3 | Fires before executing each pending effect |
| `on-task-complete` | 3 | Fires after `task:post` completes |
| `on-step-dispatch` | 3 | Fires when `run:iterate` discovers a new effect |
| `on-iteration-start` | 2 | Fires before calling `run:iterate` |
| `on-iteration-end` | 2 | Fires after all effects for an iteration are posted |
| `on-breakpoint` | 2 | Fires when a breakpoint effect is pending; present to user for approval |
| `on-score` | 3 | Fires when a quality score is posted to the run |
| `pre-commit` | 3 | Fires before the agent creates a git commit |
| `pre-branch` | 3 | Fires before the agent creates a new git branch |
| `post-planning` | 3 | Fires after the planning phase produces output |

### Harness-Level Concepts (not SDK KnownHookType values)

These are integration points that your harness must implement. They are NOT SDK hook
types -- they are harness-specific lifecycle events that drive the orchestration loop.

| Harness Concept | Tier | Generic Equivalent |
|---|---|---|
| **session-start** | 1 | Session/conversation start callback. Call `session:init` to create the baseline state file. This maps to your harness's "on conversation begin" event. |
| **stop** (exit interceptor) | 1 | Exit/turn-end interceptor. Run the decision algorithm (Section 2d) to BLOCK or APPROVE the agent's exit attempt. This is the core loop driver. |
| **session-end** | 1 | Session cleanup. Delete the session state file when the conversation ends normally. |

### Hook Discovery Directories

If implementing Tier 3, hook scripts are searched in this priority order:

```
1. Per-repo:   {REPO_ROOT}/.a5c/hooks/{hookType}/*.sh     (highest)
2. Per-user:   ~/.config/babysitter/hooks/{hookType}/*.sh  (medium)
3. Plugin:     {PLUGIN_ROOT}/hooks/{hookType}/*.sh         (lowest)
```

Scripts within each directory are sorted alphabetically and executed sequentially.

---

## 6. CLI Output Schemas

This section documents the JSON output schemas for the most frequently used CLI
commands. All examples assume `--json` is passed.

### `run:status` Output

```json
{
  "state": "waiting",
  "lastEvent": {
    "type": "EFFECT_REQUESTED",
    "recordedAt": "2026-03-02T10:05:00Z",
    "data": { "..." : "..." }
  },
  "pendingByKind": {
    "node": 2,
    "breakpoint": 1
  },
  "pendingEffectsSummary": {
    "totalPending": 3,
    "countsByKind": { "node": 2, "breakpoint": 1 },
    "autoRunnableCount": 2
  },
  "needsMoreIterations": true,
  "metadata": null,
  "completionProof": null
}
```

| Field | Type | Description |
|---|---|---|
| `state` | `"created" \| "waiting" \| "completed" \| "failed"` | Derived run lifecycle state |
| `lastEvent` | object or null | The most recent journal event (serialized) |
| `pendingByKind` | `Record<string, number>` | Count of pending effects grouped by kind |
| `pendingEffectsSummary.totalPending` | number | Total pending effects |
| `pendingEffectsSummary.autoRunnableCount` | number | Effects that can be auto-executed (kind=node) |
| `needsMoreIterations` | boolean | True if state=waiting and autoRunnableCount > 0 |
| `completionProof` | string or null | SHA-256 proof hash (only when state=completed) |

### `session:check-iteration` Output

The output always includes `found`, `shouldContinue`, `iteration`, `maxIterations`,
`runId`, and `prompt`. When `shouldContinue` is false, `reason` and `stopMessage`
explain why.

```json
// shouldContinue: true
{ "found": true, "shouldContinue": true, "nextIteration": 4,
  "updatedIterationTimes": [45, 62, 58], "iteration": 3,
  "maxIterations": 65000, "runId": "my-run-abc123", "prompt": "Build the API..." }

// shouldContinue: false -- possible reason values:
//   "max_iterations_reached" (+ stopMessage)
//   "session_not_found"      (found=false, all counters zero)
```

| `reason` value | Trigger condition | Extra fields |
|---|---|---|
| `max_iterations_reached` | iteration >= maxIterations | -- |
| `session_not_found` | State file does not exist | `found: false` |

### `task:list` Output

```json
{
  "tasks": [
    {
      "effectId": "E001-abc",
      "taskId": "greet",
      "stepId": "S000001",
      "status": "pending",
      "kind": "node",
      "label": "Greet user",
      "labels": ["greeting"],
      "taskDefRef": "tasks/E001-abc/task.json",
      "inputsRef": null,
      "resultRef": null,
      "stdoutRef": null,
      "stderrRef": null,
      "requestedAt": "2026-03-02T10:01:00Z",
      "resolvedAt": null
    }
  ]
}
```

| Field | Type | Description |
|---|---|---|
| `effectId` | string | Unique effect identifier |
| `taskId` | string | Task type identifier (from `defineTask`) |
| `stepId` | string | Sequential step ID (e.g., `S000001`) |
| `status` | `"pending" \| "resolved" \| "unknown"` | Current effect status |
| `kind` | string | Task kind: `node`, `breakpoint`, `sleep`, `orchestrator_task`, or custom |
| `label` | string or null | Human-readable label |
| `taskDefRef` | string or null | Relative path to task.json |
| `resultRef` | string or null | Relative path to result.json (null if pending) |

### `session:iteration-message` Output

**Command signature:**

```bash
babysitter session:iteration-message \
  --iteration <n> \
  [--run-id <id>] \
  [--runs-dir <dir>] \
  [--plugin-root <dir>] \
  --json
```

Note: This command does NOT accept `--session-id` or `--state-dir`. It operates on
run data directly via `--run-id` and `--runs-dir`.

```json
{
  "systemMessage": "Babysitter iteration 3 | Waiting on: node. Check if pending effects are resolved, then call run:iterate.",
  "runState": "waiting",
  "completionProof": null,
  "pendingKinds": "node",
  "skillContext": null,
  "iteration": 3
}
```

| Field | Type | Description |
|---|---|---|
| `systemMessage` | string | The formatted message to re-inject into the agent's context |
| `runState` | `"created" \| "waiting" \| "completed" \| "failed"` or null | Derived run state |
| `completionProof` | string or null | Proof hash if run is completed |
| `pendingKinds` | string or null | Comma-separated list of pending effect kinds |
| `skillContext` | string or null | Discovered skill context (when `--plugin-root` is provided) |
| `iteration` | number | The iteration number passed in |

---

## 7. CLI Error Handling

All CLI commands can fail. The harness must handle these failures gracefully
rather than crashing or silently ignoring them. This section provides a unified
error handling strategy.

### Error Categories

| Category | Symptom | Recovery Strategy |
|----------|---------|-------------------|
| **Timeout** | CLI command exceeds expected duration | Kill the process, log the timeout, retry once with a longer timeout. If the retry also times out, APPROVE exit and log a diagnostic warning. |
| **JSON parse error** | stdout is empty or contains non-JSON text (e.g., stack traces, warnings) | Check stderr for error details. Strip any non-JSON prefix from stdout (some environments prepend warnings). If still unparseable, treat as a command failure. |
| **Lock conflict** | `run:iterate` or `task:post` fails because another process holds `run.lock` | Retry after 250ms, up to 40 retries (matching the SDK's internal retry behavior). If all retries fail, log the conflict and APPROVE exit. |
| **Missing run directory** | `run:status` or `run:iterate` returns non-zero with ENOENT-style error | The run was deleted or never created. Mark the session inactive and approve/fail loudly according to harness policy. |
| **Permission error** | EACCES or EPERM on file operations | Check file ownership and permissions. This usually indicates a misconfigured `BABYSITTER_RUNS_DIR`. |
| **Non-zero exit, valid JSON** | CLI returns exit code != 0 but stdout contains valid JSON with an `error` field | Parse the JSON error object for structured diagnostics. The `error.code` field often contains a machine-readable error type. |

### Unified Error Handler

```
function handleCLIError(commandName, shellResult):
    // Step 1: Try to parse structured error from stdout
    if shellResult.stdout != "":
        try:
            parsed = parseJson(shellResult.stdout)
            if parsed.error:
                log("CLI error in {commandName}: {parsed.error.message} (code: {parsed.error.code})")
                return { category: "structured", error: parsed.error }
        catch parseError:
            // stdout is not valid JSON -- fall through
            pass

    // Step 2: Check for known error patterns in stderr
    stderr = shellResult.stderr or ""

    if contains(stderr, "ENOENT") or contains(stderr, "no such file"):
        return { category: "missing_path", message: stderr }

    if contains(stderr, "run.lock") or contains(stderr, "EBUSY"):
        return { category: "lock_conflict", message: stderr, retryable: true }

    if contains(stderr, "EACCES") or contains(stderr, "EPERM"):
        return { category: "permission", message: stderr }

    if shellResult.timedOut:
        return { category: "timeout", message: "Command {commandName} timed out after {shellResult.timeoutMs}ms" }

    // Step 3: Generic failure
    return {
        category: "unknown",
        exitCode: shellResult.exitCode,
        message: stderr or "Command {commandName} failed with exit code {shellResult.exitCode}"
    }
```

### Recommended Timeouts by Command

| Command | Recommended Timeout | Notes |
|---------|-------------------|-------|
| `version --json` | 5s | Should be near-instant |
| `session:init` | 5s | File creation only |
| `session:associate` | 5s | File update only |
| `run:create` | 10s | Creates directory structure and journal |
| `run:assign-process` | 10s | Updates run.json and appends journal event under lock |
| `run:iterate` | 120s | May execute process function; uses `BABYSITTER_TIMEOUT` env var |
| `run:status` | 10s | Reads journal and derives state |
| `task:list` | 10s | Reads task directories |
| `task:post` | 15s | Writes result + appends journal event |
| `session:check-iteration` | 5s | Reads and parses state file |
| `session:iteration-message` | 10s | Reads run state, discovers skills |
| `run:repair-journal` | 30s | Scans and repairs journal files |

---

## 8. Edge Cases

> Note: For CLI command failures (timeouts, parse errors, lock conflicts), see
> [Section 7: CLI Error Handling](#7-cli-error-handling).

### Stale Session State File

If the harness crashes or the agent is forcefully terminated, a session state file
may be left behind. On the next session start, `session:init` will fail with
`SESSION_EXISTS`. Handling:

```
function handleStaleSession(sessionId, stateDir):
    stateFile = "{stateDir}/{sessionId}.md"
    existing = parseSessionState(stateFile)

    // If the run is completed or failed, clean up and re-init
    if existing.runId != "":
        statusResult = shell("babysitter run:status .a5c/runs/{existing.runId} --json")
        if statusResult.exitCode == 0:
            runStatus = parseJson(statusResult.stdout)
            if runStatus.state in ["completed", "failed"]:
                deleteFile(stateFile)
                return shell("babysitter session:init --session-id {sessionId} --state-dir {stateDir} --json")

    // Otherwise, offer to resume
    return { action: "resume_or_cleanup", existingRunId: existing.runId }
```

### Run Directory Missing or Corrupted

If the run directory is deleted or journal files are corrupted, `run:status` and
`run:iterate` will return non-zero exit codes. The stop interceptor should APPROVE
exit in this case (Guard 5 in the decision algorithm).

### Concurrent Sessions on Same Run

The SDK uses file-based run locking (`run.lock` with PID). If two sessions try to
iterate the same run concurrently, one will fail to acquire the lock. The harness
should retry after a short delay (250ms, up to 40 retries) or report the conflict.

### Effect Posted but Journal Not Updated

If the harness crashes between writing `result.json` and the CLI appending the
`EFFECT_RESOLVED` journal event, the run may appear stuck. Use `run:repair-journal`
to detect and fix such inconsistencies:

```bash
babysitter run:repair-journal .a5c/runs/{runId} --json
```

### Zero Pending Tasks After Iterate

If `run:iterate` returns status=waiting but `task:list --pending` returns zero tasks,
this indicates all effects were resolved during the iterate call itself (e.g., via
replay). Simply call `run:iterate` again on the next iteration.

---

## 9. Testing the Integration

### Smoke Test Checklist

Run these tests in order. Each builds on the previous.

#### Test 1: CLI Availability

```bash
babysitter version --json
```

- [ ] Exit code is 0
- [ ] Output contains `"version"` field

#### Test 2: Session Initialization

```bash
babysitter session:init \
  --session-id test-session-001 \
  --state-dir /tmp/babysitter-test/state \
  --json
```

- [ ] Exit code is 0
- [ ] State file created at `/tmp/babysitter-test/state/test-session-001.md`
- [ ] File contains YAML frontmatter with `active: true`, `iteration: 1`, `run_id: ""`

#### Test 3: Run Creation

```bash
# Create a minimal process file
cat > /tmp/babysitter-test/process.js << 'EOF'
exports.process = async function(inputs, ctx) {
  const result = await ctx.task('greet', { name: inputs.name });
  return { greeting: result };
};
EOF

# Create inputs file
echo '{"name": "World"}' > /tmp/babysitter-test/inputs.json

# Create the run
babysitter run:create \
  --process-id test-process \
  --entry /tmp/babysitter-test/process.js#process \
  --inputs /tmp/babysitter-test/inputs.json \
  --prompt "Test run" \
  --json
```

- [ ] Exit code is 0
- [ ] Output contains `"runId"` field
- [ ] Directory `.a5c/runs/{runId}/` exists with `run.json` and `journal/`

#### Test 4: Session Binding

```bash
babysitter session:associate \
  --session-id test-session-001 \
  --run-id {runId} \
  --state-dir /tmp/babysitter-test/state \
  --json
```

- [ ] Exit code is 0
- [ ] State file now has `run_id: "{runId}"`

#### Test 5: Run Iterate

```bash
babysitter run:iterate .a5c/runs/{runId} --json
```

- [ ] Exit code is 0
- [ ] Output contains `"status"` field

#### Test 6: Task List

```bash
babysitter task:list .a5c/runs/{runId} --pending --json
```

- [ ] Exit code is 0
- [ ] Output contains `"tasks"` array

#### Test 7: Iteration Guard

```bash
babysitter session:check-iteration \
  --session-id test-session-001 \
  --state-dir /tmp/babysitter-test/state \
  --json
```

- [ ] Exit code is 0
- [ ] Output contains `"shouldContinue": true`

#### Test 8: Iteration Message

```bash
babysitter session:iteration-message \
  --iteration 2 \
  --run-id {runId} \
  --runs-dir .a5c/runs \
  --json
```

- [ ] Exit code is 0
- [ ] Output contains `"systemMessage"` field
- [ ] Output contains `"iteration": 2`

### Common Failure Modes

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `babysitter: command not found` | SDK not installed or not on PATH | Re-run installation (Section 2a) |
| Stop hook always APPROVEs | No session state file, or `run_id` is empty | Check session:init and session:associate ran |
| Infinite loop (never exits) | Completion proof not detected | Check transcript scanning for `<promise>` tags |
| Exits after 1 iteration | Stop interceptor not wired correctly | Verify BLOCK decision re-injects context |
| `Session already associated` | Re-entrant run on same session | Clean up old state file or complete old run |
| Iterations very fast, exits early | Runaway detection triggers (avg <= 15s) | Agent is not doing meaningful work per iteration; check effect execution |
| State file corrupt | Non-atomic write or concurrent access | Use atomic write protocol (temp + rename) |
| `task:post` fails | Writing result.json directly instead of via CLI | Always use `babysitter task:post` command |
| Run stuck in "waiting" | Effects executed but results not posted | Check task:post calls after each effect |

### End-to-End Integration Test

The following pseudocode validates the complete loop:

```
function testEndToEnd():
    sessionId = "e2e-test-" + randomId()
    pluginRoot = "/tmp/babysitter-e2e"
    stateDir = "{pluginRoot}/skills/babysit/state"
    runsDir = ".a5c/runs"

    // 1. Init
    ensureBabysitterCLI()
    shell("babysitter session:init --session-id {sessionId} --state-dir {stateDir} --json")

    // 2. Create and bind
    result = shell("babysitter run:create --process-id test --entry ./process.js#process --inputs inputs.json --json")
    runId = parseJson(result.stdout).runId
    shell("babysitter session:associate --session-id {sessionId} --run-id {runId} --state-dir {stateDir} --json")

    // 3. Iterate
    iterResult = shell("babysitter run:iterate .a5c/runs/{runId} --json")
    assert parseJson(iterResult.stdout).status in ["executed", "waiting", "completed"]

    // 4. Execute effects
    listResult = shell("babysitter task:list .a5c/runs/{runId} --pending --json")
    tasks = parseJson(listResult.stdout).tasks
    for task in tasks:
        // Execute task, write output
        shell("babysitter task:post .a5c/runs/{runId} {task.effectId} --status ok --value output.json --json")

    // 5. Check iteration guard
    guardResult = shell("babysitter session:check-iteration --session-id {sessionId} --state-dir {stateDir} --json")
    assert parseJson(guardResult.stdout).shouldContinue == true

    // 6. Get iteration message (correct params: --iteration, --run-id, --runs-dir)
    msgResult = shell("babysitter session:iteration-message --iteration 2 --run-id {runId} --runs-dir {runsDir} --json")
    assert parseJson(msgResult.stdout).systemMessage is not null

    // 7. Re-iterate until completed
    iterResult = shell("babysitter run:iterate .a5c/runs/{runId} --json")
    if parseJson(iterResult.stdout).status == "completed":
        proof = parseJson(iterResult.stdout).completionProof
        assert proof is not null and proof is not ""

    print("END-TO-END TEST PASSED")
```

---

## 10. Reference Implementation

The canonical reference implementation is the Claude Code harness adapter, documented at:

**[docs/assimilation/harness/claude-code-integration.md](./claude-code-integration.md)**

Key files in the reference implementation:

| File | Role |
|------|------|
| `packages/sdk/src/harness/types.ts` | `HarnessAdapter` interface definition |
| `packages/sdk/src/harness/claudeCode.ts` | Claude Code adapter (stop hook, session-start, binding) |
| `packages/sdk/src/harness/nullAdapter.ts` | No-op fallback adapter (useful as a starting template) |
| `packages/sdk/src/harness/registry.ts` | Adapter auto-detection and lookup |
| `packages/sdk/src/session/` | Session state parsing, writing, and types |
| `artifacts/generated-plugins/claude-code/hooks/babysitter-proxied-stop.sh` | Generated Claude Code stop hook entry |
| `artifacts/generated-plugins/claude-code/hooks/babysitter-proxied-session-start.sh` | Generated Claude Code session-start hook entry |

### Writing a New Harness Adapter

To add first-class SDK support for your harness, implement the `HarnessAdapter`
interface:

```typescript
interface HarnessAdapter {
  readonly name: string;
  isActive(): boolean;
  resolveSessionId(parsed: { sessionId?: string }): string | undefined;
  resolveStateDir(args: { stateDir?: string; pluginRoot?: string }): string | undefined;
  resolvePluginRoot(args: { pluginRoot?: string }): string | undefined;
  bindSession(opts: SessionBindOptions): Promise<SessionBindResult>;
  handleStopHook(args: HookHandlerArgs): Promise<number>;
  handleSessionStartHook(args: HookHandlerArgs): Promise<number>;
  findHookDispatcherPath(startCwd: string): string | null;
}
```

Register your adapter in `packages/sdk/src/harness/registry.ts` and it will be
auto-detected when its `isActive()` method returns `true`.

For harnesses that cannot modify the SDK source, the entire integration can be
built externally by calling the babysitter CLI commands documented in this guide.

### Full-Code Example: Minimal Node.js Harness

The following is a complete, runnable Node.js implementation (not pseudocode) of a
minimal harness that drives a single babysitter run to completion. It covers session
initialization, run creation, the orchestration loop, effect execution for node tasks,
and completion proof extraction.

```javascript
#!/usr/bin/env node
// minimal-harness.js -- A complete minimal babysitter harness implementation.
// Usage: node minimal-harness.js <process-file>#<export> <inputs.json> [prompt]

const { execSync } = require('child_process');
const { readFileSync, writeFileSync, mkdirSync, existsSync } = require('fs');
const { join } = require('path');
const crypto = require('crypto');

// --- Configuration ---
const RUNS_DIR = '.a5c/runs';
const STATE_DIR = join(process.cwd(), '.harness-state');
const MAX_ITERATIONS = 65000;
const RUNAWAY_THRESHOLD_ITERATIONS = 5;
const RUNAWAY_THRESHOLD_SECONDS = 15;
const CLI_TIMEOUT_MS = 120_000;

// --- Helpers ---
function cli(command, timeoutMs = CLI_TIMEOUT_MS) {
  try {
    const stdout = execSync(`babysitter ${command}`, {
      encoding: 'utf8',
      timeout: timeoutMs,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { exitCode: 0, stdout, stderr: '' };
  } catch (err) {
    return {
      exitCode: err.status ?? 1,
      stdout: err.stdout ?? '',
      stderr: err.stderr ?? '',
      timedOut: err.killed === true,
    };
  }
}

function cliJson(command, timeoutMs) {
  const result = cli(`${command} --json`, timeoutMs);
  if (result.exitCode !== 0) {
    console.error(`CLI error (${command}): ${result.stderr}`);
    return null;
  }
  try {
    return JSON.parse(result.stdout);
  } catch {
    console.error(`JSON parse error for ${command}: ${result.stdout.slice(0, 200)}`);
    return null;
  }
}

// --- Main ---
async function main() {
  const [,, entryPoint, inputsFile, prompt = 'Run process'] = process.argv;
  if (!entryPoint || !inputsFile) {
    console.error('Usage: node minimal-harness.js <entry>#<export> <inputs.json> [prompt]');
    process.exit(1);
  }

  const sessionId = `harness-${crypto.randomUUID().slice(0, 8)}`;
  mkdirSync(STATE_DIR, { recursive: true });

  // Step 1: Verify CLI
  const version = cliJson('version');
  if (!version) { console.error('babysitter CLI not available'); process.exit(1); }
  console.log(`Using babysitter SDK v${version.sdkVersion || version.version}`);

  // Step 2: Session init
  const initResult = cliJson(
    `session:init --session-id ${sessionId} --state-dir ${STATE_DIR}`
  );
  if (!initResult) { console.error('Session init failed'); process.exit(1); }

  // Step 3: Create run
  const processId = entryPoint.split('#')[0].replace(/[^a-zA-Z0-9-_]/g, '-');
  const createResult = cliJson(
    `run:create --process-id ${processId} --entry ${entryPoint}` +
    ` --inputs ${inputsFile} --prompt "${prompt.replace(/"/g, '\\"')}"`
  );
  if (!createResult) { console.error('Run creation failed'); process.exit(1); }
  const { runId } = createResult;
  const runDir = join(RUNS_DIR, runId);
  console.log(`Created run: ${runId}`);

  // Step 4: Bind session
  cliJson(
    `session:associate --session-id ${sessionId} --run-id ${runId} --state-dir ${STATE_DIR}`
  );

  // Step 5: Orchestration loop
  const iterationTimes = [];
  let iteration = 0;

  while (iteration < MAX_ITERATIONS) {
    iteration++;
    const iterStart = Date.now();
    console.log(`\n--- Iteration ${iteration} ---`);

    // 5a: Iterate
    const iterData = cliJson(`run:iterate ${runDir}`, CLI_TIMEOUT_MS);
    if (!iterData) { console.error('run:iterate failed'); break; }

    if (iterData.status === 'completed') {
      console.log(`Run completed. Proof: ${iterData.completionProof}`);
      break;
    }
    if (iterData.status === 'failed') {
      console.error('Run failed:', JSON.stringify(iterData, null, 2));
      break;
    }

    // 5b: List and execute pending tasks
    const listData = cliJson(`task:list ${runDir} --pending`);
    if (!listData || !listData.tasks || listData.tasks.length === 0) {
      console.log('No pending tasks; re-iterating...');
      continue;
    }

    for (const task of listData.tasks) {
      const taskDir = join(runDir, 'tasks', task.effectId);
      const taskDefPath = join(taskDir, 'task.json');
      if (!existsSync(taskDefPath)) {
        console.error(`task.json missing for ${task.effectId}`);
        continue;
      }
      const taskDef = JSON.parse(readFileSync(taskDefPath, 'utf8'));
      let result;

      switch (task.kind) {
        case 'node': {
          // Execute the node task's script
          try {
            const mod = require(taskDef.args.scriptPath);
            const fn = taskDef.args.exportName ? mod[taskDef.args.exportName] : mod.default || mod;
            const output = await fn(taskDef.args.input);
            result = { status: 'ok', value: output };
          } catch (err) {
            result = { status: 'error', value: { message: err.message, stack: err.stack } };
          }
          break;
        }
        case 'breakpoint':
          // Minimal harness: auto-reject breakpoints (non-interactive)
          result = { status: 'ok', value: { approved: false, reason: 'Non-interactive harness' } };
          break;
        case 'sleep': {
          const until = taskDef.args.until || taskDef.args.sleepUntil;
          const durationMs = taskDef.args.durationMs;
          const target = until ? new Date(until).getTime() : (Date.now() + (durationMs || 0));
          const remaining = target - Date.now();
          if (remaining > 0 && remaining <= 60000) {
            await new Promise(r => setTimeout(r, remaining));
          }
          result = { status: 'ok', value: { wokeAt: new Date().toISOString(), reason: 'waited' } };
          break;
        }
        default:
          result = { status: 'error', value: { message: `Unsupported task kind: ${task.kind}` } };
      }

      // Post result
      const outputPath = join(taskDir, 'output.json');
      writeFileSync(outputPath, JSON.stringify(result.value));
      cli(`task:post ${runDir} ${task.effectId} --status ${result.status} --value ${outputPath} --json`);
    }

    // 5c: Runaway detection
    const iterDuration = (Date.now() - iterStart) / 1000;
    iterationTimes.push(iterDuration);
    if (iteration >= RUNAWAY_THRESHOLD_ITERATIONS) {
      const recent = iterationTimes.slice(-3);
      const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
      if (avg <= RUNAWAY_THRESHOLD_SECONDS) {
        console.error(`Runaway detected: avg ${avg.toFixed(1)}s <= ${RUNAWAY_THRESHOLD_SECONDS}s threshold`);
        break;
      }
    }
  }

  console.log(`\nHarness finished after ${iteration} iterations.`);
}

main().catch(err => { console.error(err); process.exit(1); });
```

---

## Appendix: Complete CLI Command Reference

| Command | Purpose | Section |
|---------|---------|---------|
| `babysitter version --json` | Verify CLI installation | 2a |
| `babysitter session:init --session-id ID --state-dir DIR --json` | Create baseline session state | 2b |
| `babysitter run:create --process-id PID --entry FILE --inputs FILE --json` | Create a new run | 2c |
| `babysitter run:assign-process RUNDIR --entry FILE [--process-id PID] --json` | Assign process to bare run | 2c |
| `babysitter session:associate --session-id ID --run-id RID --state-dir DIR --json` | Bind session to run | 2c |
| `babysitter run:iterate RUNDIR --json` | Advance orchestration, discover effects | 2d, 2e |
| `babysitter run:status RUNDIR --json` | Read run status and completion proof | 2d |
| `babysitter session:iteration-message --iteration N [--run-id ID] [--runs-dir DIR] [--plugin-root DIR] --json` | Get context to re-inject after BLOCK | 2d |
| `babysitter task:list RUNDIR --pending --json` | List pending effects | 2e |
| `babysitter task:show RUNDIR EFFECTID --json` | Read task definition | 2e |
| `babysitter task:post RUNDIR EFFECTID --status STATUS --value FILE --json` | Post effect result | 2f |
| `babysitter session:check-iteration --session-id ID --state-dir DIR --json` | Check iteration guards | 2g |
| `babysitter run:repair-journal RUNDIR --json` | Repair inconsistent journal | 7 |
| `babysitter hook:run --hook-type TYPE --harness NAME --json` | Dispatch a lifecycle hook | 5 |






