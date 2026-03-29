---
name: babysit
description: >-
  Orchestrate via @babysitter. Use this skill when asked to babysit a run,
  orchestrate a process or whenever it is called explicitly. (babysit,
  babysitter, orchestrate, orchestrate a run, workflow, etc.)
---

# babysit

Orchestrate `.a5c/runs/<runId>/` through iterative execution. Use the SDK CLI to drive the orchestration loop.

Native Windows caveat: Codex does not execute hooks on Windows yet. When
running on native Windows, do not yield the turn and wait for the Stop hook.
Keep driving the Babysitter loop in the current turn until the run completes or
you hit a real user breakpoint that requires chat input.

## Non-Negotiables

- Preserve user intent over speed. Never optimize for "get any completion proof"
  at the expense of the requested scope, quality, or process style.
- Do not create temporary/minimal throwaway processes to force completion unless
  the user explicitly approves a reduced-scope recovery path.
- If blocked, repair the current run/session first. Only switch strategy after
  stating the blocker and getting user approval when the new strategy changes
  intent or scope.
- Use the Babysitter orchestration model end-to-end. Do not bypass with ad-hoc
  execution, fake outputs, or side workflows that are not represented as tasks.

## Dependencies

### Babysitter SDK and CLI

Use the installed CLI alias:

```bash
CLI="babysitter"
```

If it is not available on the path, use:

```bash
CLI="npx -y @a5c-ai/babysitter-sdk"
```

### jq

Make sure `jq` is available in the path. Install it if missing.

---

## Core Iteration Workflow

The Babysitter workflow has 8 steps:

1. **Create or find the process** - interview the user or parse the prompt,
   research the repo and process library, and build a process definition
2. **Create run and bind session** - create the run via the Babysitter CLI and
   bind it to the current Codex session
3. **Run iteration** - execute one orchestration step
4. **Get effects** - inspect pending effects
5. **Perform effects** - execute the requested tasks through skills, agents, or
   shell work
6. **Post results** - commit results back through `task:post`
7. **Stop and yield** - the Codex stop hook decides whether to continue (on
   Windows, stay in-turn and continue the loop yourself instead)
8. **Completion proof** - finish only when the emitted proof is returned

### 1. Create or find the process for the run

#### Interview phase

##### Interactive mode (default)

Interview the user for the intent, requirements, goal, scope, etc.

A multi-step phase to understand the intent and perspective to approach the
process building after researching the repo, short research online if needed,
short research in the target repo, additional instructions, intent and library
(processes, specializations, skills, subagents, methodologies, references, etc.)
/ guide for methodology building. You MUST resolve the active library root with
`babysitter process-library:active --json` before process authoring, and you MUST
conduct an actual search against that active process library instead of skipping
directly to writing a process. The `process-library:active` command bootstraps
the shared global SDK process library automatically if no binding exists yet.
Read `binding.dir` from the returned JSON to get the active process-library root
that must be searched. If you need the cloned repo root itself, read
`defaultSpec.cloneDir` from the same JSON. After that, treat
`specializations/**/**/**`, `methodologies/`, `contrib/`, and `reference/` as
paths relative to `binding.dir`.

The first step should be to look at the state of the repo, then find the most
relevant processes, specializations, skills, subagents, methodologies,
references, etc. to use as a reference. Use the babysitter CLI discover command
to find the relevant processes, skills, subagents, etc. at various stages.

Then this phase can have: research online, research the repo, user questions, and
other steps one after the other until the intent, requirements, goal, scope, etc.
are clear and the user is satisfied with the understanding. After each step,
decide the type of next step to take. Do not plan more than 1 step ahead in this
phase. The same step type can be used more than once in this phase.

##### Non-interactive mode (running with -p flag or no AskUserQuestion tool)

When running non-interactively, skip the interview phase entirely. Instead:

1. Parse the initial prompt to extract intent, scope, and requirements.
2. Research the repo structure to understand the codebase.
3. Resolve the active process-library root with
   `babysitter process-library:active --json`, then search that active library
   for the most relevant specialization/methodology. Do not skip this search
   step.
4. Proceed directly to the process creation phase using the extracted
   requirements.

#### User Profile Integration

Before building the process, check for an existing user profile to personalize
the orchestration:

1. **Read user profile**: Run `babysitter profile:read --user --json` to load
   the user profile. **Always use the CLI for profile operations -- never import
   or call SDK profile functions directly.**

2. **Pre-fill context**: Use the profile to understand the user's specialties,
   expertise levels, preferences, and communication style. This informs how you
   conduct the interview (skip questions the profile already answers) and how you
   build the process.

3. **Breakpoint density**: Use the `breakpointTolerance` field to calibrate
   breakpoint placement in the generated process:
   - `minimal`/`low` (expert users): Fewer breakpoints -- only at critical
     decision points (architecture choices, deployment, destructive operations)
   - `moderate` (intermediate users): Standard breakpoints at phase boundaries
   - `high`/`maximum` (novice users): More breakpoints -- add review gates after
     each implementation step, before each integration, and at every quality gate
   - Always respect `alwaysBreakOn` for operations that must always pause (e.g.,
     destructive-git, deploy)
   - If `skipBreakpointsForKnownPatterns` is true, reduce breakpoints for
     operations the user has previously approved

4. **Tool preferences**: Use `toolPreferences` and `installedSkills`/
   `installedAgents` to prioritize which agents and skills to use in the process.
   Prefer tools the user is familiar with.

5. **Communication style**: Adapt process descriptions and breakpoint questions
   to match the user's `communicationStyle` preferences (tone, explanationDepth,
   preferredResponseFormat).

6. **If no profile exists**: Proceed normally with the interview phase.

7. **CLI profile commands (mandatory)**: **All profile operations MUST use the
   babysitter CLI -- never import SDK profile functions directly.**
   - `babysitter profile:read --user --json`
   - `babysitter profile:read --project --json`
   - `babysitter profile:write --user --input <file> --json`
   - `babysitter profile:write --project --input <file> --json`
   - `babysitter profile:merge --user --input <file> --json`
   - `babysitter profile:merge --project --input <file> --json`
   - `babysitter profile:render --user`
   - `babysitter profile:render --project`

   Use `--dir <dir>` to override the default profile directory when needed.

#### Process creation phase

After the interview phase, create the complete custom process files (js and
jsons) for the run according to the Process Creation Guidelines and
methodologies section. Also install the babysitter-sdk inside `.a5c/` if it is
not already installed. **IMPORTANT**: When installing into `.a5c/`, use
`npm i --prefix .a5c @a5c-ai/babysitter-sdk` or a subshell
`(cd .a5c && npm i @a5c-ai/babysitter-sdk)` to avoid leaving CWD inside
`.a5c/`, which causes doubled path resolution bugs.

You must abide the syntax and structure of the process files from the process
library.

**IMPORTANT -- Path resolution**: Always use **absolute paths** for `--entry`
when calling `run:create`, and always run the CLI from the **project root**
directory (not from `.a5c/`).

**User profile awareness**: If a user profile was loaded in the User Profile
Integration step, use it to inform process design -- adjust breakpoint density
per the user's tolerance level, select agents/skills the user prefers, and match
the process complexity to the user's expertise.

**IMPORTANT -- Profile I/O in processes**: When generating process files, all
profile read/write/merge operations MUST use the babysitter CLI commands
(`babysitter profile:read`, `profile:write`, `profile:merge`,
`profile:render`). Never instruct agents to import or call SDK profile functions
directly.

After the process is created and before creating the run:

- **Interactive mode**: describe the process at high level (not the code or
  implementation details) to the user and ask for confirmation to use it, also
  generate it as a [process-name].diagram.md and [process-name].process.md file.
  If the user is not satisfied with the process, go back to the process creation
  phase and modify the process according to the feedback.
- **Non-interactive mode**: proceed directly to creating the run without user
  confirmation.

#### Intent Fidelity Checks (required before `run:create`)

Before calling `run:create`, verify and document in your working notes:

1. The process scope matches the user prompt (no silent scope cuts).
2. The process structure follows library style/composition patterns rather than
   a one-off minimal flow.
3. Quality gates exist (verification/refinement loops, integration checks,
   and/or breakpoints appropriate for the task).
4. Any scope reduction, simplification, or recovery tradeoff is explicitly
   approved by the user before execution.

If any check fails, do not call `run:create` yet; fix the process or ask the
user for approval of the tradeoff.

**Common mistakes to avoid:**
- wrong: skipping repo/process-library research before writing the process
- wrong: bypassing the orchestration model with helper scripts or inline logic
- wrong: using `kind: 'node'` in generated tasks
- correct: use `agent` or `skill` tasks for reasoning work, with `shell` only
  for existing CLIs, tests, linters, git, or builds
- correct: include verification loops, refinement loops, quality gates, and
  breakpoints where appropriate

### 2. Create run and bind session (single command):

**For new runs:**

```bash
$CLI run:create \
  --process-id <id> \
  --entry <absolute-path>#<export> \
  --inputs <file> \
  --prompt "$PROMPT" \
  --harness codex \
  --state-dir .a5c \
  --plugin-root "${CODEX_PLUGIN_ROOT}" \
  --json
```

**Required flags:**
- `--process-id <id>` -- unique identifier for the process definition
- `--entry <absolute-path>#<export>` -- path to the process JS file and its
  named export (e.g., `./my-process.js#process`)
- `--prompt "$PROMPT"` -- the user's initial prompt/request text
- `--harness codex` -- activates Codex session binding. The session ID is
  auto-resolved from `CODEX_THREAD_ID`, `CODEX_SESSION_ID`, or `CODEX_ENV_FILE`.
- `--state-dir .a5c` -- required for honest workspace-local session state
- `--plugin-root "${CODEX_PLUGIN_ROOT}"` -- plugin root for state resolution

**Optional flags:**
- `--inputs <file>` -- path to a JSON file with process inputs
- `--run-id <id>` -- override auto-generated run ID
- `--runs-dir <dir>` -- override runs directory (default: `.a5c/runs`)

Do **not** pass `--session-id` explicitly inside a real Codex session. The Codex
adapter auto-resolves the session/thread ID from environment variables. Only pass
`--session-id` in out-of-band recovery flows.

**Common mistakes to avoid:**
- wrong: Calling `session:init` explicitly
- wrong: Fabricating a session ID when none is available from the environment
- wrong: Trying to bind the session in a separate step after run creation
- correct: Using `--harness codex` with `run:create` to create the run AND
  auto-bind the session, relying on environment variables for honest session
  binding

**For resuming existing runs:**

```bash
$CLI session:resume \
  --session-id <id> \
  --state-dir .a5c \
  --run-id <runId> --runs-dir .a5c/runs --json
```

### 3. Run Iteration

```bash
$CLI run:iterate .a5c/runs/<runId> --json --iteration <n> --plugin-root "${CODEX_PLUGIN_ROOT}"
```

**Output:**
```json
{
  "iteration": 1,
  "status": "executed|waiting|completed|failed|none",
  "action": "executed-tasks|waiting|none",
  "reason": "auto-runnable-tasks|breakpoint-waiting|terminal-state",
  "count": 3,
  "completionProof": "only-present-when-completed",
  "metadata": { "runId": "...", "processId": "..." }
}
```

**Status values:**
- `"executed"` - Tasks executed, continue looping
- `"waiting"` - Breakpoint/sleep, pause until released
- `"completed"` - Run finished successfully
- `"failed"` - Run failed with error
- `"none"` - No pending effects

**Common mistake to avoid:**
- wrong: Calling run:iterate, performing the effect, posting the result,
  then calling run:iterate again in the same session
- correct: Calling run:iterate, performing the effect, posting the result,
  then STOPPING the session so the hook triggers the next iteration
  (except on Windows, where you must continue in-turn)

### 4. Get Effects

```bash
$CLI task:list .a5c/runs/<runId> --pending --json
```

**Output:**
```json
{
  "tasks": [
    {
      "effectId": "effect-abc123",
      "kind": "agent|skill|breakpoint",
      "label": "auto",
      "status": "requested"
    }
  ]
}
```

### 5. Perform Effects

Run the effect externally to the SDK (by you, your hook, or another worker).
After execution (by delegation to an agent or skill), post the outcome summary
into the run by calling `task:post`, which:
- Writes the committed result to `tasks/<effectId>/result.json`
- Appends an `EFFECT_RESOLVED` event to the journal
- Updates the state cache

IMPORTANT:
- Delegate using the Task tool if possible.
- Make sure the change was actually performed and not described or implied.
  (for example, if code files were mentioned as created in the summary, make
  sure they were actually created.)
- Include in the instructions to the agent or skill to perform the task in
  full and return only the summary result in the requested schema.

#### 5.1 Breakpoint Handling

##### 5.1.0 Mode Detection and Breakpoint Policy

- If the user is present in chat, default to interactive breakpoint handling.
- Use non-interactive handling only when execution context is explicitly
  non-interactive (for example no question tool / explicit non-interactive run).
- Never auto-approve breakpoints when mode is ambiguous. Treat ambiguity as
  interactive and ask explicitly.
- Any mode switch that changes approval behavior must be stated explicitly in
  the run notes.

##### 5.1.1 Interactive mode

Ask the user explicitly for approval. Include explicit approve/reject options
so the user's intent is unambiguous.

**CRITICAL: Response validation rules:**
- If the response is empty, no selection, or dismissed: treat as **NOT
  approved**. Re-ask the question or keep the breakpoint pending. Do NOT
  proceed.
- NEVER fabricate, synthesize, or infer approval text. Only pass through the
  user's actual selected response verbatim.
- NEVER assume approval from ambiguous, empty, or missing responses. When in
  doubt, the answer is "not approved".

**CRITICAL: Breakpoint rejection posting rules:**
- Breakpoint rejection MUST be posted with `--status ok` and a value of
  `{"approved": false, "response": "..."}`. NEVER use `--status error` for a
  user rejection -- that signals a task execution failure and will trigger
  `RUN_FAILED`, requiring manual journal surgery to recover.
- Only use `--status error` if the question tool itself throws an error.

**Breakpoint posting examples:**

```bash
# User approved the breakpoint
echo '{"approved": true, "response": "Looks good, proceed"}' > tasks/<effectId>/output.json
$CLI task:post <runId> <effectId> --status ok --value tasks/<effectId>/output.json

# User rejected the breakpoint (ALWAYS use --status ok, not --status error)
echo '{"approved": false, "response": "Stop here"}' > tasks/<effectId>/output.json
$CLI task:post <runId> <effectId> --status ok --value tasks/<effectId>/output.json
```

##### 5.1.2 Non-interactive mode

Choose the best option from context and post the result. Rejections still use
`--status ok` with `{"approved": false}`.

### 6. Results Posting

**IMPORTANT**: Do NOT write `result.json` directly. The SDK owns that file.

**Workflow:**

1. Write the result **value** to a separate file (e.g., `output.json` or
   `value.json`):
```json
{
  "score": 85,
  "details": { ... }
}
```

2. Post the result, passing the value file:
```bash
$CLI task:post .a5c/runs/<runId> <effectId> \
  --status ok \
  --value tasks/<effectId>/output.json \
  --json
```

The `task:post` command will:
- Read the value from your file
- Write the complete `result.json` (including schema, metadata, and your value)
- Append an `EFFECT_RESOLVED` event to the journal
- Update the state cache

**Available flags:**
- `--status <ok|error>` (required)
- `--value <file>` - Result value (for status=ok)
- `--error <file>` - Error payload (for status=error)
- `--stdout-file <file>` - Capture stdout
- `--stderr-file <file>` - Capture stderr
- `--started-at <iso8601>` - Task start time
- `--finished-at <iso8601>` - Task end time
- `--metadata <file>` - Additional metadata JSON

**Common mistake to avoid:**
```bash
# wrong: Writing result.json directly
echo '{"result": {...}}' > tasks/<effectId>/result.json
$CLI task:post <runId> <effectId> --status ok

# correct: Write value to separate file, let SDK create result.json
echo '{"score": 85}' > tasks/<effectId>/output.json
$CLI task:post <runId> <effectId> --status ok --value tasks/<effectId>/output.json
```

**Breakpoint-specific posting:**

```bash
# Breakpoint approval
echo '{"approved": true, "response": "User approved"}' > tasks/<effectId>/output.json
$CLI task:post <runId> <effectId> --status ok --value tasks/<effectId>/output.json

# Breakpoint rejection (ALWAYS use --status ok, not --status error)
echo '{"approved": false, "response": "User rejected"}' > tasks/<effectId>/output.json
$CLI task:post <runId> <effectId> --status ok --value tasks/<effectId>/output.json
```

---

### 7. STOP after every phase after run-session association

After `run:create` or any posted effect result, end the current turn and yield
back to the Codex hook loop. The stop hook drives the loop, not you. Do not run
multiple `run:iterate` steps in the same turn.

**Native Windows exception**: because Codex does not execute hooks on Windows
yet, do not end the turn and wait for the hook loop there. Continue with the
next `run:iterate`, inspect tasks, perform effects, and post results in the same
turn until the run completes or you need explicit user input for a breakpoint.

Common mistakes to avoid:
- wrong: Stopping the session before run-session association
- correct: Stopping the session after run-session association, then after every
  iteration, letting the hook call you back to continue the loop until
  completion.
- wrong: Calling run:iterate multiple times in the same session without stopping
  and letting the hook call you back (except on Windows where this is required).
- correct: Calling run:iterate once, then stopping and letting the hook call you
  back for the next iteration until completion.

On native Windows, an in-turn loop across `run:iterate` -> `task:list` ->
effect execution -> `task:post` is expected and valid because hooks do not
resume the session. This is not considered bypassing the orchestration model as
long as each iteration/effect is handled through the CLI and run journal.

### 8. Completion Proof

When the run is completed, the CLI will emit a `completionProof` value in the
output of `run:iterate` and `run:status`. You must return that exact value
wrapped in a `<promise>...</promise>` tag to signal completion to the stop-hook
loop.

### Progressing Between The Phases

After you run `run:create`, progress through the phases above by stopping the
session, which will trigger the stop-hook and call you with the next phase.
After you finish each phase after `run:create`, stop the session and return
control to the user until you are called again by the hook.

## Task Kinds

**CRITICAL RULE: NEVER use `node` kind effects in generated processes.** The
`node` kind executes inline Node.js scripts which bypasses the agent
orchestration model entirely. Every task that would be a `node` effect MUST be
converted to an `agent` or `skill` effect instead. The only acceptable
non-agent kinds are `shell` (for running existing test suites, git commands, or
build tools), `breakpoint` (human approval), and `sleep` (time gates).

| Kind | Description | Executor | When to use |
|------|-------------|----------|-------------|
| ~~`node`~~ | ~~Node.js script~~ | ~~Local node process~~ | **NEVER -- forbidden. Convert to `agent` or `skill`.** |
| `shell` | Shell command | Local shell process | Only for running existing CLI tools, test suites, git, linters, builds |
| `agent` | LLM agent | Agent runtime | **Default for all tasks** -- planning, implementation, analysis, verification, scoring, debugging, code writing, research |
| `skill` | Installed skill | Skill system | When a matching installed skill exists (preferred over agent when available) |
| `breakpoint` | Human approval | UI/CLI | Decision gates requiring user input |
| `sleep` | Time gate | Scheduler | Time-based pauses |

### Agent Task Example

Important: Check which subagents and agents are actually available before
assigning the name. If none, pass the general-purpose subagent. Check the
subagents and agents in the plugin (in nested folders) and to find relevant
subagents and agents to use as a reference. Specifically check subagents and
agents in folders next to the reference process file.

When executing the agent task, use the Task tool. Never use the Babysitter skill
or agent to execute the task.

```javascript
export const agentTask = defineTask('agent-scorer', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Agent scoring',
  agent: {
    name: 'quality-scorer',
    prompt: {
      role: 'QA engineer',
      task: 'Score results 0-100',
      context: { ...args },
      instructions: ['Review', 'Score', 'Recommend'],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['score']
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));
```

### Skill Task Example

Important: Check which skills are actually available before assigning the skill
name. Check the skills in the plugin (in nested folders) and to find relevant
skills to use as a reference. Skills are preferred over subagents for executing
tasks.

```javascript
export const skillTask = defineTask('analyzer-skill', (args, taskCtx) => ({
  kind: 'skill',
  title: 'Analyze codebase',

  skill: {
    name: 'codebase-analyzer',
    context: {
      scope: args.scope,
      depth: args.depth,
      analysisType: args.type,
      criteria: ['Code consistency', 'Naming conventions', 'Error handling'],
      instructions: [
        'Scan specified paths for code patterns',
        'Analyze consistency across the codebase',
        'Check naming conventions',
        'Review error handling patterns',
        'Generate structured analysis report'
      ]
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));
```

---

## Quick Commands Reference

**Create run (with session binding):**
```bash
$CLI run:create --process-id <id> --entry <path>#<export> --inputs <file> \
  --prompt "$PROMPT" --harness codex \
  --state-dir .a5c --plugin-root "${CODEX_PLUGIN_ROOT}" --json
```

**Check status:**
```bash
$CLI run:status <runId> --json
```

When the run completes, `run:iterate` and `run:status` emit `completionProof`.
Use that exact value in a `<promise>...</promise>` tag to end the loop.

**View events:**
```bash
$CLI run:events <runId> --limit 20 --reverse
```

**List tasks:**
```bash
$CLI task:list <runId> --pending --json
```

**Post task result:**
```bash
$CLI task:post <runId> <effectId> --status <ok|error> --json
```

**Iterate:**
```bash
$CLI run:iterate <runId> --json --iteration <n> --plugin-root "${CODEX_PLUGIN_ROOT}"
```

---

## Recovery from failure

If at any point the run fails due to SDK issues or corrupted state or journal,
analyze the error and the journal events. Recover the state and journal to the
last known good state, adapt, and try to continue the run.

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

## Process Creation Guidelines and methodologies

- When building UX and full stack applications, integrate/link the main pages
  of the frontend with functionality created for every phase of the development
  process (where relevant), so that there is a way to test the functionality as
  you go.

- Unless otherwise specified, prefer quality gated iterative development loops
  in the process.

- You can change the process after the run is created or during the run (and
  adapt the process accordingly and journal accordingly) in case you discover new
  information or requirements.

- The process should be a comprehensive and complete solution to the user
  request.

- The process should usually be a composition (in code) of multiple processes
  from the process library (not just one), for multiple phases and parts of the
  process, each utilizing a different process from the library as a reference.

- Include verification and refinement steps (and loops) for planning phases and
  integration phases, debugging phases, refactoring phases, etc.

- Create the process with (and around) the available skills and subagents.
  (check which are available first and use discover to find them)

- Prefer incremental work that allows testing and experimentation with the new
  functionality as you go.

### Process File Discovery Markers

When creating process files, include `@skill` and `@agent` markers in the JSDoc
header listing the skills and agents relevant to this process. The SDK reads
these markers to provide targeted discovery results instead of scanning all
available skills.

**Format** (one per line, path relative to the active process-library root):
```javascript
/**
 * @process specializations/web-development/react-app-development
 * @description React app development with TDD
 * @skill frontend-design specializations/web-development/skills/frontend-design/SKILL.md
 * @agent frontend-architect specializations/web-development/agents/frontend-architect/AGENT.md
 */
```

**Steps during process creation:**
1. Use `babysitter skill:discover --process-path <path> --json` to find
   relevant skills/agents in the specialization directory
2. Select the ones actually needed by the process tasks
3. Add them as `@skill`/`@agent` markers in the JSDoc header
4. Use full relative path from the active process-library root returned in
   `binding.dir` by `babysitter process-library:active --json`

- Unless otherwise specified, prefer processes that close the widest loop in the
  quality gates (for example e2e tests with a full browser or emulator/vm if it
  is a mobile or desktop app) AND gates that make sure the work is accurate
  against the user request (all the specs are covered and no extra stuff was
  added unless permitted by the intent of the user).

- Scan the methodologies and processes in the active process library and the SDK
  package to find relevant processes and methodologies to use as a reference.
  This search is mandatory before writing the process.

- If you encounter a generic reusable part of a process that can be later reused
  and composed, build it in a modular way and organize it in the `.a5c/processes`
  directory.

Prefer processes that have the following characteristics unless otherwise
specified:
  - In case of a new project, plan the architecture, stack, parts, milestones
  - In case of an existing project, analyze the architecture, stack, relevant
    parts, milestones, and plan the changes
  - Integrate/link the main pages (or entry points) with functionality created
    for every phase of the development process
  - Quality gated iterative and convergent development/refinement loops
  - Test driven -- where quality gates can use executable tools, scripts, and
    tests to verify accuracy and completeness
  - Integration phases for each new functionality in every milestone
  - Where relevant -- beautiful and polished UX with pixel-perfect verification
  - Accurate and complete implementation of the user request
  - Closing quality feedback loops as comprehensively as practical
  - Search for processes, skills, agents, methodologies during the interactive
    process building phase to compose a comprehensive process:
    - `.a5c/processes/` (project level processes)
    - `specializations/` under the active process-library root
    - `methodologies/` under the active process-library root

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
process js file, create a run (with `--harness codex` to bind the session), then
iterate the run until it is completed.

CRITICAL RULE: After run:create or run-session association and after each effect
is posted, you MUST stop the session and return control. Do NOT proceed to the
next run:iterate in the same session turn. The stop-hook will call you back to
continue. Running multiple iterations in a single session turn bypasses the hook
loop and breaks the orchestration model. (Exception: on native Windows where
hooks do not run, you must continue in-turn.)

CRITICAL RULE: NEVER use `kind: 'node'` in generated process files. All tasks
MUST use `kind: 'agent'` or `kind: 'skill'`. The only non-agent kinds allowed
are `shell` (for existing CLI tools/tests/git), `breakpoint`, and `sleep`.

CRITICAL RULE: NEVER bypass, avoid, or skip the babysitter orchestration model
when the user explicitly requested this skill. Do not execute the tasks yourself,
do not create helper scripts. Use the CLI to drive the orchestration loop. On
native Windows, an in-turn iterative loop is required because hooks do not
resume execution there. Not for simple tasks, and even if things get complicated.
Persist in executing the orchestration itself.

CRITICAL RULE: Do not fabricate a session ID. Let the Codex adapter auto-resolve
it from `CODEX_THREAD_ID`, `CODEX_SESSION_ID`, or `CODEX_ENV_FILE`.

## See Also
- `library/tdd-quality-convergence.js` - TDD quality convergence example
- `library/reference/ADVANCED_PATTERNS.md` - Agent/skill patterns, iterative convergence
- `library/reference/sdk.md` - SDK API reference
