---
name: babysitter
description: Orchestrate via @babysitter. Use this skill when asked to babysit a run, orchestrate a process or whenever it is called explicitly. (babysit, babysitter, orchestrate, orchestrate a run, workflow, etc.)
---

# babysitter

Orchestrate `.a5c/runs/<runId>/` through iterative execution.

For PI-family sessions, the built-in internal `session:create` harness is the
default execution surface. Phase 1 must use the built-in `piWrapper` path and
its process-library research tools. Later phases should also default to the
same built-in internal harness unless the process itself explicitly dispatches a
different harness for a specific task.

## Dependencies

### Babysitter SDK and CLI

The PI plugin package already depends on `@a5c-ai/babysitter-sdk`. Verify it is
installed:

```bash
PLUGIN_ROOT="${OMP_PLUGIN_ROOT:-$PI_PLUGIN_ROOT}"
cd "$PLUGIN_ROOT" && node -e "try{require.resolve('@a5c-ai/babysitter-sdk');console.log('SDK OK')}catch{console.log('SDK MISSING')}"
```

If missing, install the plugin dependencies:

```bash
PLUGIN_ROOT="${OMP_PLUGIN_ROOT:-$PI_PLUGIN_ROOT}"
cd "$PLUGIN_ROOT" && npm install
```

Use the CLI alias:

```bash
CLI="babysitter"
```

If it is not available on the path, use:

```bash
CLI="npx -y @a5c-ai/babysitter-sdk"
```

### jq

Make sure `jq` is available in the path. Install it if missing.

## Core Iteration Workflow

The Babysitter workflow has 8 steps:

1. **Create or find the process** - interview the user or parse the prompt,
   research the repo and process library, and build a process definition
2. **Create run and bind session** - create the run and bind it to the PI
   session
3. **Run iteration** - execute one orchestration step
4. **Get effects** - inspect pending effects
5. **Perform effects** - fulfill the requested tasks agentically
6. **Post results** - commit results back through `task:post`
7. **Return control to the loop-driver** - the PI loop-driver advances the next
   phase
8. **Completion proof** - finish only when the emitted proof is returned

### 1. Create or find the process for the run

#### Interview phase

##### Interactive mode (default)

Interview the user for intent, requirements, goals, scope, and constraints
before the loop-driver takes over.

This phase should be iterative and adaptive:

- inspect the current repo state first
- resolve the active process-library root with
  `babysitter process-library:active --json`
- conduct an actual search against that active process library before writing a
  process
- research the repo, online references, methodologies, specializations, skills,
  agents, and related processes as needed
- ask follow-up questions when the intent or constraints are still not clear

Do not plan more than one step ahead during the interview phase. After each
step, decide the next best step from the current evidence.

The `process-library:active` command bootstraps the shared global SDK process
library automatically if no binding exists yet. Read:

- `binding.dir` as the active process-library root that must be searched
- `defaultSpec.cloneDir` as the cloned repo root when adjacent repo-level
  material is needed

After that, treat `specializations/**/**/**`, `methodologies/`, `contrib/`, and
`reference/` as paths relative to `binding.dir`.

When the workflow is running through the built-in internal `session:create`
harness, phase 1 must use the dedicated process-library tools that expose the
active shared binding directly:

- `babysitter_resolve_process_library`
- `babysitter_search_process_library`
- `babysitter_read_process_library_file`

##### Non-interactive mode

When running non-interactively:

1. parse the initial prompt to extract intent, scope, and constraints
2. inspect the repo structure
3. resolve the active process-library root with
   `babysitter process-library:active --json`
4. search that active library for the most relevant specialization,
   methodology, process, skill, or agent
5. proceed directly to process creation

Do not skip the active-library search step.

#### User Profile Integration

Before building the process, check for an existing user profile:

1. run `babysitter profile:read --user --json`
2. use the profile to pre-fill user preferences, expertise, and communication
   style
3. calibrate breakpoint density from `breakpointTolerance`
4. prefer tools, skills, and agents the user already uses
5. adapt explanations and breakpoint text to the user's communication style
6. if no profile exists, proceed normally

All profile read/write/merge/render operations must go through the Babysitter
CLI, never direct SDK imports.

#### Process creation phase

After the interview phase, create the full custom process files for the run
according to the process-library patterns and the process-creation guidelines
below.

Install `@a5c-ai/babysitter-sdk` into `.a5c/` if it is missing. When doing so,
run the install from the project root and use either `npm i --prefix .a5c ...`
or a subshell so the working directory does not stay inside `.a5c/`.

Always use an **absolute path** for `--entry` when calling `run:create`.

After the process is created and before creating the run:

- in interactive mode, describe the process at a high level, generate
  `[process-name].diagram.md` and `[process-name].process.md`, and get user
  confirmation before proceeding
- in non-interactive mode, proceed directly to `run:create`

Common mistakes to avoid:

- wrong: skipping repo/process-library research before writing the process
- wrong: bypassing the orchestration model with helper scripts or inline logic
- wrong: using `kind: 'node'` in generated tasks
- correct: use `agent` or `skill` tasks for reasoning work, with `shell` only
  for existing CLIs, tests, linters, git, or builds
- correct: include verification loops, refinement loops, quality gates, and
  breakpoints where appropriate

### 2. Create run and bind session

Use the Babysitter orchestration contract directly. The built-in internal PI
harness may implement this with plugin/runtime helpers, but it should still be
treated as the same `run:create` contract, not as a different orchestration
model.

Underlying CLI contract:

```bash
PLUGIN_ROOT="${OMP_PLUGIN_ROOT:-$PI_PLUGIN_ROOT}"

$CLI run:create \
  --process-id <id> \
  --entry <absolute-path>#<export> \
  --inputs <file> \
  --prompt "$PROMPT" \
  --harness pi \
  --json
```

Required flags:

- `--process-id <id>` - unique identifier for the process definition
- `--entry <absolute-path>#<export>` - process JS file plus named export
- `--prompt "$PROMPT"` - the user's initial request
- `--harness pi` - activates PI session binding

Optional flags:

- `--inputs <file>` - process input JSON
- `--run-id <id>` - override the generated run id
- `--runs-dir <dir>` - override the default runs directory

For resuming existing runs, let the harness/session layer restore the bound run
when possible. Use explicit resume flows only for recovery.

### 3. Run iteration

Use the standard iteration contract. The loop-driver may invoke it through PI
runtime helpers, but the orchestrator should reason about it as the same
Babysitter iteration step:

```bash
$CLI run:iterate .a5c/runs/<runId> --json --iteration <n>
```

Status values:

- `"executed"` - tasks executed, continue looping
- `"waiting"` - breakpoint or sleep is pending
- `"completed"` - run finished successfully
- `"failed"` - run failed
- `"none"` - no runnable effects exist

### 4. Get effects

Use the standard pending-effects contract:

```bash
$CLI task:list .a5c/runs/<runId> --pending --json
```

### 5. Perform effects

Run the effect externally to the SDK, then post the outcome summary with
`task:post`.

Important:

- make sure the requested change actually happened
- do not describe or imply success without verifying the requested effect
- do not use the `babysitter` skill itself inside delegated task execution

In the built-in internal `session:create` PI orchestration path, the
second-phase orchestrator must handle **all** pending effects agentically,
including `shell` ones.

The default effect-fulfillment toolset should include Bash and the other dev
tools, plus tools that dispatch available harness wrappers.

Rules for phase 2:

- do not hard-code shell execution outside the task system
- do not assume the host runs shell effects automatically
- inspect each pending effect, decide how to fulfill it with the available
  tools, execute it, collect the real outcome, and only then post the result
- use `babysitter_dispatch_effect_harness` for dispatchable harness-backed
  effects when another harness should fulfill the task
- for shell work, either execute the requested command explicitly with the
  available shell/dev tools or use `babysitter_run_shell_effect` when the
  built-in harness exposes that convenience tool
- post the result through `babysitter_task_post_result` or the equivalent
  `task:post` contract after the effect is actually fulfilled

#### 5.1 Breakpoint handling

##### Interactive mode

Ask the user explicitly for approval. If the PI environment provides a
structured question UI, include explicit approve/reject options. If not, ask in
chat and require an explicit approval response.

Never infer approval from silence, ambiguity, or dismissal.

Breakpoint rejections must still be posted with `--status ok` and a value such
as `{"approved": false, "response": "..."}`.

##### Non-interactive mode

Choose the best option from context and post the result. Rejections still use
`--status ok` with `{"approved": false}`.

### 6. Results posting

Never write `result.json` directly.

Workflow:

1. write the result value to `tasks/<effectId>/output.json`
2. call `task:post` with `--value tasks/<effectId>/output.json`
3. let the SDK write `result.json`, append the journal event, and update state

### 7. The loop-driver controls iteration

The PI loop-driver controls the orchestration loop. Complete the current phase
or effect, post the result, then hand control back to the loop-driver.

Do not run multiple iterations in one agent turn.

### 8. Completion proof

When `run:iterate` or `run:status` returns `completionProof`, return that exact
value wrapped in `<promise>...</promise>`.

## Task Kinds

Never generate `kind: 'node'` effects.

| Kind | When to use |
|------|-------------|
| `agent` | default for planning, implementation, analysis, debugging, scoring, research |
| `skill` | when a matching installed skill exists |
| `shell` | existing CLI tools, tests, git, linters, builds |
| `breakpoint` | human approval gates |
| `sleep` | time gates |

## Process Creation Guidelines

- always research the repo and the active process library before writing the
  process
- prefer composing multiple relevant library processes rather than copying just
  one template blindly
- include verification and refinement loops
- prefer processes that close the widest practical quality loop
- add `@skill` and `@agent` discovery markers to generated process files for
  the dependencies you actually selected
- prefer incremental work that can be tested as you go

Search for relevant processes, skills, agents, methodologies, and references
in:

1. `.a5c/processes/`
2. the active process-library root from `binding.dir`
3. the cloned repo root from `defaultSpec.cloneDir` when adjacent material is
   needed

## Critical Rules

CRITICAL RULE: The completion proof is emitted only when the run is truly
completed. Output `<promise>SECRET</promise>` only when the orchestration status
is completed.

CRITICAL RULE: Never bypass the Babysitter orchestration model when this skill
is active. Do not replace it with ad-hoc direct execution.

CRITICAL RULE: Never build helper scripts or wrapper programs to drive the run.
Use the orchestration contract and the loop-driver directly.

CRITICAL RULE: In interactive mode, never auto-approve breakpoints.

CRITICAL RULE: Do not use `kind: 'node'` in generated process files.

CRITICAL RULE: In the built-in internal `session:create` flow, phase 1 must use
the PI internal harness (`piWrapper`) and its process-library research tools.
Later phases should also default to that built-in harness unless the process
explicitly dispatches another harness.

CRITICAL RULE: In the second-phase orchestrator, every pending effect is an
agentic task, including `shell`. Do not hard-code shell execution outside the
task system and do not skip task creation.
