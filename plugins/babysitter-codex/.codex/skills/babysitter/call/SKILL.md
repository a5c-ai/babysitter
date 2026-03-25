---
name: babysitter:call
description: Orchestrate via @babysitter. Use this skill when asked to babysit a run, orchestrate a process or whenever it is called explicitly. (babysit, babysitter, orchestrate, orchestrate a run, workflow, etc.)
argument-hint: Specific instructions for the run
version: 0.1.1
---

# babysitter:call

Orchestrate `.a5c/runs/<runId>/` through iterative execution. Use the SDK CLI to drive the orchestration loop.

Start a babysitter run with the Codex hook model. The workspace must have
`.codex/hooks.json` wired for `SessionStart`, `UserPromptSubmit`, and `Stop`.

## Dependencies

### Babysitter SDK and CLI

Read the SDK version from the plugin manifest to ensure version compatibility:

```bash
PLUGIN_ROOT="${CODEX_PLUGIN_ROOT:-$(pwd)/.codex}"
SDK_VERSION=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('${PLUGIN_ROOT}/plugin.json','utf8')).sdkVersion||'latest')}catch{console.log('latest')}")
sudo npm i -g @a5c-ai/babysitter-sdk@$SDK_VERSION
# sudo is depending on the env and system
```

then use the CLI alias: CLI="babysitter"

**Alternatively, use the CLI alias:** `CLI="npx -y @a5c-ai/babysitter-sdk@$SDK_VERSION"`

### jq

make sure you have jq installed and available in the path. if not, install it.

---

## Core Iteration Workflow

The babysitter workflow has 4 steps:

1. **Run iteration** - Execute one orchestration step
2. **Get effects** - Check what tasks are requested
3. **Perform effects** - Execute the requested tasks
4. **Post results** - Tasks auto-record results to journal

### 1. Create or find the process for the run

#### Interview phase

##### Interactive mode (default)

Interview the user for the intent, requirements, goal, scope, etc. through conversational interaction (before setting the in-session loop).

A multi-step phase to understand the intent and perspective to approach the process building after researching the repo, short research online if needed, short research in the target repo, additional instructions, intent and library (processes, specializations, skills, subagents, methodologies, references, etc.) / guide for methodology building. (clarifications regarding the intent, requirements, goal, scope, etc.) - the library is at [skill-root]/process/specializations/**/**/** and [skill-root]/process/methodologies/ and under [skill-root]/process/contrib/[contributer-username]/]

The first step should be the look at the state of the repo, then find the most relevant processes, specializations, skills, subagents, methodologies, references, etc. to use as a reference. use the babysitter cli discover command to find the relevant processes, skills, subagents, etc at various stages.

Then this phase can have: research online, research the repo, user questions, and other steps one after the other until the intent, requirements, goal, scope, etc. are clear and the user is satisfied with the understanding. after each step, decide the type of next step to take. do not plan more than 1 step ahead in this phase. and the same step type can be used more than once in this phase.

##### Non-interactive mode (running non-interactively)

When running non-interactively, skip the interview phase entirely. Instead:
1. Parse the initial prompt to extract intent, scope, and requirements.
2. Research the repo structure to understand the codebase.
3. Search the process library for the most relevant specialization/methodology.
4. Proceed directly to the process creation phase using the extracted requirements.

#### User Profile Integration

Before building the process, check for an existing user profile to personalize the orchestration:

1. **Read user profile**: Run `babysitter profile:read --user --json` to load the user profile from `~/.a5c/user-profile.json`. **Always use the CLI for profile operations — never import or call SDK profile functions directly.**

2. **Pre-fill context**: Use the profile to understand the user's specialties, expertise levels, preferences, and communication style. This informs how you conduct the interview (skip questions the profile already answers) and how you build the process.

3. **Breakpoint density**: Use the `breakpointTolerance` field to calibrate breakpoint placement in the generated process:
   - `minimal`/`low` (expert users): Fewer breakpoints — only at critical decision points (architecture choices, deployment, destructive operations)
   - `moderate` (intermediate users): Standard breakpoints at phase boundaries
   - `high`/`maximum` (novice users): More breakpoints — add review gates after each implementation step, before each integration, and at every quality gate
   - Always respect `alwaysBreakOn` for operations that must always pause (e.g., destructive-git, deploy)
   - If `skipBreakpointsForKnownPatterns` is true, reduce breakpoints for operations the user has previously approved

4. **Tool preferences**: Use `toolPreferences` and `installedSkills`/`installedAgents` to prioritize which agents and skills to use in the process. Prefer tools the user is familiar with.

5. **Communication style**: Adapt process descriptions and breakpoint questions to match the user's `communicationStyle` preferences (tone, explanationDepth, preferredResponseFormat).

6. **If no profile exists**: Proceed normally with the interview phase. Consider suggesting the user run `/user-install` first to create a profile for better personalization.

7. **CLI profile commands (mandatory)**: **All profile operations MUST use the babysitter CLI — never import SDK profile functions directly.** This applies to the babysit skill itself, all generated processes, and all agent task instructions:
   - `babysitter profile:read --user --json` — Read user profile as JSON
   - `babysitter profile:read --project --json` — Read project profile as JSON
   - `babysitter profile:write --user --input <file> --json` — Write user profile from file
   - `babysitter profile:write --project --input <file> --json` — Write project profile from file
   - `babysitter profile:merge --user --input <file> --json` — Merge partial updates into user profile
   - `babysitter profile:merge --project --input <file> --json` — Merge partial updates into project profile
   - `babysitter profile:render --user` — Render user profile as readable markdown
   - `babysitter profile:render --project` — Render project profile as readable markdown

   Use `--dir <dir>` to override the default profile directory when needed.

#### Process creation phase

after the interview phase, create the complete custom process files (js and jsons) for the run according to the Process Creation Guidelines and methodologies section. also install the babysitter-sdk inside .a5c if it is not already installed. (install it in .a5c/package.json if it is not already installed, make sure to use the latest version). **IMPORTANT**: When installing into `.a5c/`, use `npm i --prefix .a5c @a5c-ai/babysitter-sdk@latest` or a subshell `(cd .a5c && npm i @a5c-ai/babysitter-sdk@latest)` to avoid leaving CWD inside `.a5c/`, which causes doubled path resolution bugs.
you must abide the syntax and structure of the process files from the process library.

**IMPORTANT — Path resolution**: Always use **absolute paths** for `--entry` when calling `run:create`, and always run the CLI from the **project root** directory (not from `.a5c/`). Using relative paths while CWD is inside `.a5c/` causes doubled paths like `.a5c/.a5c/runs/` or `.a5c/.a5c/processes/`.

**User profile awareness**: If a user profile was loaded in the User Profile Integration step, use it to inform process design — adjust breakpoint density per the user's tolerance level, select agents/skills the user prefers, and match the process complexity to the user's expertise.

**IMPORTANT — Profile I/O in processes**: When generating process files, all profile read/write/merge operations MUST use the babysitter CLI commands (`babysitter profile:read`, `profile:write`, `profile:merge`, `profile:render`). Never instruct agents to import or call SDK profile functions (`readUserProfile`, `writeUserProfile`, etc.) directly. The CLI handles atomic writes, directory creation, and markdown generation automatically.

After the process is created and before creating the run:
- **Interactive mode**: describe the process at high level (not the code or implementation details) to the user and ask for confirmation to use it, also generate it as a [process-name].diagram.md and [process-name].process.md file. If the user is not satisfied with the process, go back to the process creation phase and modify the process according to the feedback of the user until the user is satisfied with the process.
- **Non-interactive mode**: proceed directly to creating the run without user confirmation.

### 2. Create run and bind session (single command):

**For new runs:**

```bash
# Detect session ID from Codex environment variables
SESSION_ID="${CODEX_THREAD_ID:-${CODEX_SESSION_ID:-}}"

$CLI run:create \
  --process-id <id> \
  --entry <path>#<export> \
  --inputs <file> \
  --prompt "$PROMPT" \
  --harness codex \
  --state-dir .a5c \
  --json
```

If a Codex session or thread ID is available (`CODEX_THREAD_ID` or `CODEX_SESSION_ID`), add `--session-id "$SESSION_ID"` to bind the session at creation time. If no stable session/thread ID is available, omit `--session-id` rather than fabricating one.

**Required flags:**
- `--process-id <id>` — unique identifier for the process definition
- `--entry <path>#<export>` — path to the process JS file and its named export (e.g., `./my-process.js#process`)
- `--prompt "$PROMPT"` — the user's initial prompt/request text
- `--harness codex` — activates Codex session binding. The session ID is detected from `CODEX_THREAD_ID` or `CODEX_SESSION_ID` environment variables.

**Optional flags:**
- `--inputs <file>` — path to a JSON file with process inputs
- `--session-id <id>` — explicit session/thread ID (auto-detected from env vars if omitted)
- `--run-id <id>` — override auto-generated run ID
- `--runs-dir <dir>` — override runs directory (default: `.a5c/runs`)
- `--state-dir <dir>` — state directory for session tracking

This single command creates the run AND binds the session (initializing the stop-hook loop). The JSON output includes `runId`, `runDir`, and `session` binding status.

**For resuming existing runs:**

```bash
$CLI session:resume \
  --state-dir .a5c \
  --run-id <runId> --runs-dir .a5c/runs --json
```

### 3. Run Iteration

```bash
$CLI run:iterate .a5c/runs/<runId> --json --iteration <n>
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
  - WRONG: Calling run:iterate, performing the effect, posting the result,
     then calling run:iterate again in the same session
  - CORRECT: Calling run:iterate, performing the effect, posting the result,
     then STOPPING the session so the Stop hook triggers the next iteration

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
      "kind": "node|agent|skill|breakpoint",
      "label": "auto",
      "status": "requested"
    }
  ]
}
```

### 5. Perform Effects

Run the effect externally to the SDK (by you, your hook, or another worker). After execution (by delegation to an agent or skill), post the outcome summary into the run by calling `task:post`, which:
- Writes the committed result to `tasks/<effectId>/result.json`
- Appends an `EFFECT_RESOLVED` event to the journal
- Updates the state cache

IMPORTANT:
- Make sure the change was actually performed and not described or implied. (for example, if code files were mentioned as created in the summary, make sure they were actually created.)
- Include in the instructions to the agent or skill to perform the task in full and return the only the summary result in the requested schema.

#### 5.1 Breakpoint Handling

##### 5.1.1 Interactive mode

If running in interactive mode, present the breakpoint question to the user through Codex's native interaction model (direct conversational prompt).

**CRITICAL: Response validation rules:**
- The breakpoint question MUST include explicit "Approve" and "Reject" (or similar) options so the user's intent is unambiguous.
- If the user provides an empty, ambiguous, or no response: treat as **NOT approved**. Re-ask the question or keep the breakpoint in a pending/waiting state. Do NOT proceed.
- NEVER fabricate, synthesize, or infer approval text. Only pass through the user's actual response verbatim.
- NEVER assume approval from ambiguous, empty, or missing responses. When in doubt, the answer is "not approved".

**CRITICAL: Breakpoint rejection posting rules:**
- Breakpoint rejection MUST be posted with `--status ok` and a value of `{"approved": false, "response": "..."}`. NEVER use `--status error` for a user rejection — that signals a task execution failure and will trigger `RUN_FAILED`, requiring manual journal surgery to recover.
- Only use `--status error` if a genuine error occurs during breakpoint handling.

**Breakpoint posting examples:**

```bash
# CORRECT: User approved the breakpoint
echo '{"approved": true, "response": "Looks good, proceed"}' > tasks/<effectId>/output.json
$CLI task:post <runId> <effectId> --status ok --value tasks/<effectId>/output.json

# CORRECT: User rejected the breakpoint
echo '{"approved": false, "response": "Stop here"}' > tasks/<effectId>/output.json
$CLI task:post <runId> <effectId> --status ok --value tasks/<effectId>/output.json

# WRONG: Posting rejection as error — causes RUN_FAILED
$CLI task:post <runId> <effectId> --status error
```

**Breakpoint value payload schema:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `approved` | `boolean` | Yes | Whether the user approved the breakpoint |
| `response` | `string` | No | The user's response text or selected option |
| `feedback` | `string` | No | Additional feedback from the user |

After receiving an explicit approval or rejection from the user, post the result of the breakpoint to the run by calling `task:post`.

Breakpoints are meant for human approval. NEVER auto-approve breakpoints in interactive mode. NEVER release or approve breakpoints yourself. Once the user responds, post the result of the breakpoint to the run by calling `task:post` when the breakpoint is resolved.

Otherwise:

##### 5.1.2 Non-interactive mode

If running in non-interactive mode, resolve the breakpoint by selecting the best option according to the context and the intent of the user, then post the result via `task:post`.

**CRITICAL:** When rejecting a breakpoint in non-interactive mode, always use `--status ok` with `{"approved": false}` in the value payload. Never use `--status error` for rejections — it will fail the entire run.

**Non-interactive breakpoint posting:**
```bash
# Approve: proceed with the action
echo '{"approved": true, "response": "Auto-approved based on context"}' > tasks/<effectId>/output.json
$CLI task:post <runId> <effectId> --status ok --value tasks/<effectId>/output.json

# Reject: skip but keep the run alive
echo '{"approved": false, "response": "Skipped — not applicable in current context"}' > tasks/<effectId>/output.json
$CLI task:post <runId> <effectId> --status ok --value tasks/<effectId>/output.json
```

### 6. Results Posting

**IMPORTANT**: Do NOT write `result.json` directly. The SDK owns that file.

**Workflow:**

1. Write the result **value** to a separate file (e.g., `output.json` or `value.json`):
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
# WRONG: Writing result.json directly
echo '{"result": {...}}' > tasks/<effectId>/result.json
$CLI task:post <runId> <effectId> --status ok

# CORRECT: Write value to separate file, let SDK create result.json
echo '{"score": 85}' > tasks/<effectId>/output.json
$CLI task:post <runId> <effectId> --status ok --value tasks/<effectId>/output.json
```

**Breakpoint-specific posting:**

Breakpoints use the same `task:post` workflow but require a specific value payload with an `approved` field:

```bash
# Breakpoint approval
echo '{"approved": true, "response": "User approved"}' > tasks/<effectId>/output.json
$CLI task:post <runId> <effectId> --status ok --value tasks/<effectId>/output.json

# Breakpoint rejection (ALWAYS use --status ok, not --status error)
echo '{"approved": false, "response": "User rejected"}' > tasks/<effectId>/output.json
$CLI task:post <runId> <effectId> --status ok --value tasks/<effectId>/output.json
```

---

### 7. STOP after every phase after run-session association — the Stop hook drives the loop, not you.

You will be called back by the Codex Stop hook (`.codex/hooks/babysitter-stop-hook.sh`) and asked to repeat the orchestration loop or exit the loop by posting the completion proof. Repeat orchestration loop by calling run:iterate or doing the next right thing.

The Codex hook model uses three hooks wired in `.codex/hooks.json`:
- **SessionStart** (`.codex/hooks/babysitter-session-start.sh`) — initializes the babysitter state at session start
- **UserPromptSubmit** (`.codex/hooks/user-prompt-submit.sh`) — processes user prompts
- **Stop** (`.codex/hooks/babysitter-stop-hook.sh`) — drives the orchestration loop between iterations

Common mistakes to avoid:
- WRONG: Stopping the session before run-session association
- CORRECT: Stopping the session after run-session association, then after every iteration, letting the Stop hook call you back to continue the loop until completion.

- WRONG: Calling run:iterate multiple times in the same session without stopping and letting the Stop hook call you back.
- CORRECT: Calling run:iterate once, then stopping and letting the Stop hook call you back for the next iteration until completion.

### 8. Completion Proof

When the run is completed, the CLI will emit a `completionProof` value in the output of `run:iterate` and `run:status`. You must return that exact value wrapped in a `<promise>...</promise>` tag to signal completion to the stop-hook loop.

### Progressing Between The Phases

After you ran run:create, progress through the phases above by Stopping the session, which will trigger the Codex Stop hook and call you with the next phase. After you finish each phase after run:create, stop the session and return the control to the user until you are called again by the hook.

## Task Kinds

**CRITICAL RULE: NEVER use `node` kind effects in generated processes.** The `node` kind executes inline Node.js scripts which bypasses the agent orchestration model entirely — it produces deterministic scripts instead of leveraging LLM reasoning. Every task that would be a `node` effect MUST be converted to an `agent` or `skill` effect instead. If you encounter `node` kind tasks in reference process files, convert them to `agent` kind when using them as templates. The only acceptable non-agent kinds are `shell` (for running existing test suites, git commands, or build tools), `breakpoint` (human approval), and `sleep` (time gates).

| Kind | Description | Executor | When to use |
|------|-------------|----------|-------------|
| ~~`node`~~ | ~~Node.js script~~ | ~~Local node process~~ | **NEVER — forbidden. Convert to `agent` or `skill`.** |
| `shell` | Shell command | Local shell process | Only for running existing CLI tools, test suites, git, linters, builds |
| `agent` | LLM agent | Agent runtime | **Default for all tasks** — planning, implementation, analysis, verification, scoring, debugging, code writing, research |
| `skill` | Codex skill | Skill system | When a matching installed skill exists (preferred over agent when available) |
| `breakpoint` | Human approval | UI/CLI | Decision gates requiring user input |
| `sleep` | Time gate | Scheduler | Time-based pauses |

### Agent Task Example

Important: Check which subagents and agents are actually available before assigning the name. if none, pass the general-purpose subagent. check the subagents and agents in the plugin (in nested folders) and to find relevant subagents and agents to use as a reference. specifically check subagents and agents in folders next to the reference process file.
when executing the agent task, delegate to an appropriate agent. never use the Babysitter skill or agent to execute the task. if the subagent or agent is not installed for the project before running the process, install it first.

```javascript
export const agentTask = defineTask('agent-scorer', (args, taskCtx) => ({
  kind: 'agent',  // ← Use "agent" not "node"
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
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
```

### Skill Task Example

Important: Check which skills are actually available before assigning the skill name. check the skills in the plugin (in nested folders) and to find relevant skills to use as a reference. specifically check skills in folders next to the reference process file.

Never use the Babysitter skill or agent to execute the task. if the skill or subagent is not installed for the project before running the process, install it first. skills are prefered over subagents for executing tasks, especially if you can find the right skill for the task. you can convert a agent call to a skill call even if the reference process mentions an agent call.

```javascript
export const skillTask = defineTask('analyzer-skill', (args, taskCtx) => ({
  kind: 'skill',  // ← Use "skill" not "node"
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
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
```

---

## Quick Commands Reference

**Create run (with session binding):**
```bash
SESSION_ID="${CODEX_THREAD_ID:-${CODEX_SESSION_ID:-}}"
$CLI run:create --process-id <id> --entry <path>#<export> --inputs <file> \
  --prompt "$PROMPT" --harness codex \
  --state-dir .a5c --json
# Add --session-id "$SESSION_ID" if a session/thread ID is available
```

**Check status:**
```bash
$CLI run:status <runId> --json
```

When the run completes, `run:iterate` and `run:status` emit `completionProof`. Use that exact value in a `<promise>...</promise>` tag to end the loop.

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
$CLI run:iterate <runId> --json --iteration <n>
```
---

## Recovery from failure

If at any point the run fails due to SDK issues or corrupted state or journal. analyze the error and the journal events. recover the state to the state and journal to the last known good state and adapt and try to continue the run.

## Process Creation Guidelines and methodologies

- When building ux and full stack applications, integrate/link the main pages of the frontend with functionality created for every phase of the development process (where relevant). so that is a way to test the functionality of the app as we go.

- Unless otherwise specified, prefer quality gated iterative development loops in the process.

- You can change the process after the run is created or during the run (and adapt the process accordingly and journal accordingly) in case you discovered new information or requirements that were not previously known that changes the approach or the process.

- The process should be a comprehensive and complete solution to the user request. it should not be a partial solution or a work in progress. it should be a complete and working solution that can be used to test the functionality of the app as we go.

- the process should usally be a composition (in code) of multiple processes from the process library (not just one), for multiple phases and parts of the process, each utilizing a different process from the library as a reference. in order to perform the user request in the most accurate and robust process that utilizes the best-practices from the library in every part.

- include verification and refinement steps (and loops) for planning phases and integration phases, debugging phases, refactoring phases, etc. as well.

- Create the process with (and around) the available skills and subagents. (check which are available first and use discover to allow)

- Prefer incremental work that allows testing and experimentation with the new functionality of the work or app as we go. for example, when building a new feature, prefer building it in a way that allows testing it with a simple script or a simple page in the frontend before integrating it to the main pages and flows of the app.

### Process File Discovery Markers

When creating process files, include `@skill` and `@agent` markers in the JSDoc header listing the skills and agents relevant to this process. The SDK reads these markers to provide targeted discovery results instead of scanning all available skills.

**Format** (one per line, path relative to process root):
```javascript
/**
 * @process specializations/web-development/react-app-development
 * @description React app development with TDD
 * @skill frontend-design specializations/web-development/skills/frontend-design/SKILL.md
 * @skill visual-diff-scorer specializations/web-development/skills/visual-diff-scorer/SKILL.md
 * @agent frontend-architect specializations/web-development/agents/frontend-architect/AGENT.md
 * @agent fullstack-architect specializations/web-development/agents/fullstack-architect/AGENT.md
 */
```

**Steps during process creation:**
1. Use `babysitter skill:discover --process-path <path> --json` to find relevant skills/agents in the specialization directory
2. Select the ones actually needed by the process tasks
3. Add them as `@skill`/`@agent` markers in the JSDoc header
4. Use full relative path from the process root

When these markers are present, `run:create` and `run:iterate` will return only the marked skills/agents (with full file paths) instead of scanning the entire plugin tree. Without markers, the SDK falls back to scanning ALL specializations, which can return dozens of irrelevant results and degrade orchestration quality.

- Unless otherwise specified, prefer processes that close the widest loop in the quality gates (for example e2e tests with a full browser or emulator/vm if it a mobile or desktop app) AND gates that make sure the work is accurate against the user request (all the specs is covered and no extra stuff was added unless permitted by the intent of the user).

- Scan the methodologies and processes in the plugin and the sdk package to find relevant processes and methodologies to use as a reference. also search for process files bundled in active skills, processes in the repo (.a5c/processes/).

- if you encounter a generic reusable part of a process that can be later reused and composed, build it in a modular way and organize it in the .a5c/processes directory. and import it to compose it to the specific process in the current user request. prefer architecting processes in such modular way for reusability and composition.

prefer processes that have the following characteristics unless otherwise specified:
  - in case of a new project, plan the architecture, stack, parts, milestones, etc.
  - in case of an existing project, analyze the architecture, stack, relevant parts, milestones, etc. and plan the changes to be made in: milestones, existing modules modification/preparation steps, new modules, integration steps, etc.
  - integrate/link the main pages (or entry points) with functionality created for every phase of the development process (where relevant). so that there is a way to test and experiment with the new functionality of the work or app as we go.
  - Quality gated iterative and convergent development/refinement/optimization loops for each part of the implementation, definition, ux design and definition, specs, etc.
  - Test driven - where quality gates agents can use executable tools, scripts and tests to verify the accuracy and completeness of the implementation.
  - Integration Phases for each new functionality in every milestone with integration tests and quality gates. - where quality gates agents can use executable tools, scripts and tests to verify the accuracy and completeness of the integration.
  - Where relevant - Ensures beautiful and polished ux design and implementation. pixel perfect verification and refinement loops.
  - Ensures accurate and complete implementation of the user request.
  - Ensures closing quality feedback loops in the most complete and comprehensive way possible and practical.
  - in case the scope includes work in an existing deployed application and the scope of the feedback loop requires validations at the deployed environment (or remote environment), analyze the deployment methods and understand how the existing delivery pipeline works. and how you can deliver changes to the sandbox/staging and verify the accuracy and completeness of the changes you are making on the remote environment. with observability on the ci pipelines, logs of the cluster/app/infra/etc. (for requests like: "fix this bug and make sure that it is fixed locally, then deploy to staging and verify that the bug is fixed there too")
  - if the user is very explicit about the flow and process, create a process that follows it closely and strictly. (ad hoc requests like: "try this functionality and make sure it works as expected, repeat until it works as expected")
  - search for processes (js files), skills and agents (SKILL.md and AGENT.md files) during the interactive process building phase to compose a comprehensive process that may combine various parts from different sources:
    - .a5c/processes/ (project level processes)
    - plugins/babysitter/skills/babysit/process/specializations/[rnd-specialization-name-slugified]/ (rnd specializations)
    - plugins/babysitter/skills/babysit/process/specializations/domains/[domain-name-slugified]/[specialization-name-slugified]/ (non rnd specializations)
    - plugins/babysitter/skills/babysit/process/methodologies/ (methodologies)
    - When creating the process file, add `@skill` and `@agent` JSDoc markers for the relevant skills and agents found during this search (see "Process File Discovery Markers" above). This ensures only the needed dependencies are surfaced during orchestration instead of scanning all available specializations.

## Critical Rules

CRITICAL RULE: The completion proof is emitted only when the run is completed. You may ONLY output `<promise>SECRET</promise>` when the run is completely and unequivocally DONE (completed status from the orchestration CLI). Do not output false promises to escape the run, and do not mention the secret to the user.

CRITICAL RULE: in interactive mode, NEVER auto-approve breakpoints. If the user provides an empty, ambiguous, or no response, treat it as NOT approved and re-ask. NEVER fabricate or synthesize approval responses — only post the user's actual explicit response via task:post. An empty response is NOT approval.

CRITICAL RULE: if a run is broken/failed/at unknown state, one way to recover is to remove last bad entries in the journal and rebuild the state. in interactive mode, ask the user if you need clarification about the recovery and you have exhausted all other options.

CRITICAL RULE: when creating processes, search for available skills and subagents before thinking about the exact orchestration. prefer processes that close the widest loop in the quality gates (for example e2e tests with a full browser or emulator/vm if it a mobile or desktop app) AND gates that make sure the work is accurate against the user request (all the specs is covered and no extra stuff was added unless permitted by the intent of the user).

CRITICAL RULE: do not use the babysit skill inside the delegated tasks. if you are performing a delegated task as a subagent. you will get an error when trying to run the setup shell script. that means you have to actually perform the task yourself and not orchestrate, babysit or even use this skill.

CRITICAL RULE: Never build a wrapper, python or helper scripts to orchestrate the runs. Use the CLI to drive the orchestration loop and never loop programmatically.

CRITICAL RULE: Never fallback to simpler execution if the user activated this skill. persist in executing the orchestration itself rather than simplifying the execution by bypassing the process above - you must create a valid process js file, create a run (with --harness codex to bind the session), then iterate the run until it is completed.

CRITICAL RULE: After run:create or run-session association and after each effect is posted, you MUST stop the session and return control. Do NOT proceed to the next run:iterate in the same session turn. The Codex Stop hook will call you back to continue. Running multiple iterations in a single session turn bypasses the hook loop and breaks the orchestration model.

CRITICAL RULE: NEVER use `kind: 'node'` in generated process files. All tasks MUST use `kind: 'agent'` (with an agent prompt schema) or `kind: 'skill'` (when a matching skill is available). If a reference process template uses `node` kind tasks, you MUST convert them to `agent` kind when adapting the template. The `node` kind produces inline scripts that bypass LLM reasoning — this defeats the purpose of agent orchestration. The only non-agent kinds allowed are `shell` (for existing CLI tools/tests/git), `breakpoint`, and `sleep`.

CRITICAL RULE: NEVER bypass, avoid or skip the babysitter orchestration model when the user explicitly requested this skill. Do not execute the tasks yourself, do not loop programmatically, do not create helper scripts to orchestrate the runs. Use the CLI to drive the orchestration loop and do not bypass it. not for simple tasks, and even if things get complicated or don't go smoothly. persist in executing the orchestration itself rather than simplifying the execution by bypassing the process above.

## See Also
- `process/tdd-quality-convergence.js` - TDD quality convergence example - read and look for relevant processes and methodologies before creating the code process for a new run (create the run using the CLI, then use these process as a reference)
- `process/reference/ADVANCED_PATTERNS.md` - Agent/skill patterns, iterative convergence
- `process/reference/sdk.md` - SDK API reference
