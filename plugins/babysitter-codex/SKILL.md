---
name: babysit
description: >-
  Run babysitter workflows from Codex using the installed babysit skill bundle,
  Codex mode-wrapper skills, Codex hooks/config, and the Babysitter SDK runtime
  loop. Use when the user wants to babysit a task, start or resume a run,
  diagnose run health, install Codex integration, or assimilate a methodology.
---

# babysit

Babysitter on Codex is implemented as:

- the installed core skill under `~/.codex/skills/babysit` or `.codex/skills/babysit`
- installed mode-wrapper skills under `~/.codex/skills/<mode>` or `.codex/skills/<mode>`
- global `~/.codex/hooks.json` and `~/.codex/hooks/`
- global `~/.codex/config.toml`
- optional workspace `.codex/hooks.json` and `.codex/hooks/`
- optional workspace `.codex/config.toml`
- workspace `.a5c/`
- shared global `.a5c/` process-library state
- the Babysitter SDK CLI for `run:create`, `run:iterate`, `run:status`,
  `task:list`, `task:post`, and process-library binding

This package supports only the hooks model for the Codex plugin path. Do not
introduce an app-server loop, an external orchestrator, or fake plugin-manifest
machinery for the Codex integration.

## Choosing a Mode

Use this skill whenever it is invoked directly, and whenever one of the
installed mode-wrapper skills such as `$call`, `$plan`, `$resume`, or `$yolo`
loads it.

Choose the mode from either:

1. the direct user intent when the skill is invoked as `$babysit`
2. the installed wrapper skill name when the user invoked `$call`, `$plan`,
   `$resume`, `$yolo`, and the rest

| User intent | Mode |
|-------------|------|
| Start an orchestration run | `call` |
| Work an issue-centric flow | `issue` |
| Run autonomously | `yolo` |
| Run continuously / recurring workflow | `forever` |
| Resume an existing run | `resume` |
| Plan without executing | `plan` |
| Observe or inspect a run | `observe` |
| Summarize a completed run | `retrospect` |
| Diagnose run health | `doctor` |
| Change or inspect model routing | `model` |
| Help and documentation | `help` |
| Install into a project | `project-install` |
| Install user profile/setup | `user-install` |
| Install team-pinned setup | `team-install` |
| Assimilate external methodology | `assimilate` |

Deprecated prompt aliases are not the Codex command surface anymore. Do not
depend on `.codex/prompts` for normal operation.

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

## Core Iteration Workflow

The Babysitter workflow has 8 steps:

1. **Create or find the process** - interview the user or parse the prompt,
   research the repo and process library, and build a process definition
2. **Create run and bind session** - create the run via the Babysitter CLI and
   bind it to the current Codex session honestly
3. **Run iteration** - execute one orchestration step
4. **Get effects** - inspect pending effects
5. **Perform effects** - execute the requested tasks through skills, agents, or
   shell work
6. **Post results** - commit results back through `task:post`
7. **Stop and yield** - the Codex stop hook decides whether to continue
8. **Completion proof** - finish only when the emitted proof is returned

### 1. Create or find the process for the run

#### Interview phase

##### Interactive mode (default)

Interview the user for intent, requirements, goals, scope, and constraints
before entering the hook-driven loop.

This phase should be iterative and adaptive:

- inspect the current repo state first
- resolve the active process-library root with
  `babysitter process-library:active --json`
- conduct an actual search against that active process library before writing a
  process
- research the repo, online references, methodologies, specializations, skills,
  agents, and related processes as needed
- ask the user follow-up questions when the intent or constraints are still not
  clear

Do not plan more than one step ahead during the interview phase. After each
step, decide the next best step from the current evidence.

The `process-library:active` command bootstraps the shared global SDK process
library automatically if no binding exists yet. Read:

- `binding.dir` as the active process-library root that must be searched
- `defaultSpec.cloneDir` as the cloned repo root when adjacent repo-level
  material is needed

After that, treat `specializations/**/**/**`, `methodologies/`, `contrib/`, and
`reference/` as paths relative to `binding.dir`.

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
6. if no profile exists, proceed normally and consider suggesting `$user-install`

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

For new runs:

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

Required flags:

- `--process-id <id>` - unique identifier for the process definition
- `--entry <absolute-path>#<export>` - process JS file plus named export
- `--prompt "$PROMPT"` - the user's initial request
- `--harness codex` - activates Codex session binding
- `--state-dir .a5c` - required for honest workspace-local Codex session state
- `--plugin-root "${CODEX_PLUGIN_ROOT}"` - plugin root used for session/state
  resolution

Optional flags:

- `--inputs <file>` - process input JSON
- `--run-id <id>` - override the generated run id
- `--runs-dir <dir>` - override the default runs directory

Inside a real Codex hook/session environment, do **not** pass `--session-id`
explicitly. The Codex adapter auto-resolves the session/thread id from
`CODEX_THREAD_ID`, `CODEX_SESSION_ID`, or `CODEX_ENV_FILE`. Only pass
`--session-id` in out-of-band recovery flows where no ambient Codex session
identity exists.

In normal Codex usage, `run:create` must bind the session into the active
workspace `.a5c`, not the global `~/.a5c`, so the Stop hook can find the same
session state file in later turns.

For resuming existing runs in a manual recovery flow:

```bash
$CLI session:resume \
  --session-id <id> \
  --state-dir .a5c \
  --run-id <runId> \
  --runs-dir .a5c/runs \
  --json
```

### 3. Run iteration

```bash
$CLI run:iterate .a5c/runs/<runId> --json --iteration <n> --plugin-root "${CODEX_PLUGIN_ROOT}"
```

Status values:

- `"executed"` - tasks executed, continue looping
- `"waiting"` - breakpoint or sleep is pending
- `"completed"` - run finished successfully
- `"failed"` - run failed
- `"none"` - no runnable effects exist

### 4. Get effects

```bash
$CLI task:list .a5c/runs/<runId> --pending --json
```

### 5. Perform effects

Run the effect externally to the SDK, then post the outcome summary with
`task:post`.

Important:

- delegate using Codex skills or agent tooling when possible
- make sure the requested change actually happened
- do not describe or imply success without verifying the requested effect
- do not use the `babysit` skill itself inside delegated task execution

#### 5.1 Breakpoint handling

##### Interactive mode

Ask the user explicitly for approval. If the Codex environment provides a
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

### 7. Stop after every phase after run-session association

After `run:create` or any posted effect result, end the current assistant turn
and yield back to the Codex hook loop. Do not run multiple `run:iterate` steps
in the same turn.

### 8. Completion proof

When `run:iterate` or `run:status` returns `completionProof`, return that exact
value wrapped in `<promise>...</promise>`.

## Hook Loop

Global install must materialize `~/.codex/hooks.json`, `~/.codex/hooks/`, and
`~/.codex/config.toml`.

Workspace onboarding may also materialize `.codex/hooks.json`,
`.codex/hooks/`, and `.codex/config.toml` for repo-local pinning.

Both levels must provide:

1. `SessionStart` seeds `.a5c` session state
2. `UserPromptSubmit` performs prompt-time transformations when needed
3. `Stop` decides whether the run is complete or Codex should receive the next
   Babysitter iteration context

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

## Codex-Specific Rules

- `$babysit` is the core skill
- `$call`, `$plan`, `$resume`, `$yolo`, and the other mode skills are thin
  wrappers that must only load `babysit` for the matching mode
- do not revive prompt aliases as a parallel integration surface
- do not fabricate a session id
- use `notify` only for telemetry or monitoring, never as the orchestration
  control loop

## Critical Rules

CRITICAL RULE: The completion proof is emitted only when the run is truly
completed. Output `<promise>SECRET</promise>` only when the orchestration status
is completed.

CRITICAL RULE: Never bypass the Babysitter orchestration model when this skill
is active. Do not replace it with ad-hoc direct execution.

CRITICAL RULE: Never build helper scripts or wrapper programs to drive the run.
Use the CLI and the hook loop directly.

CRITICAL RULE: In interactive mode, never auto-approve breakpoints.

CRITICAL RULE: Do not use `kind: 'node'` in generated process files.
