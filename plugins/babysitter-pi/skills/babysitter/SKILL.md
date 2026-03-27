---
name: babysitter
description: Orchestrate via @babysitter. Use this skill when asked to babysit a run, orchestrate a process or whenever it is called explicitly. (babysit, babysitter, orchestrate, orchestrate a run, workflow, etc.)
---

# babysitter

Orchestrate `.a5c/runs/<runId>/` through iterative execution. The pi plugin uses the SDK bridge (programmatic API) as the primary interface, with the babysitter CLI available as a fallback.

## Dependencies

### Babysitter SDK

The SDK is declared as a dependency in the pi plugin's `package.json`. Verify it is installed:

```bash
PLUGIN_ROOT="${OMP_PLUGIN_ROOT:-$PI_PLUGIN_ROOT}"
cd "$PLUGIN_ROOT" && node -e "try{require.resolve('@a5c-ai/babysitter-sdk');console.log('SDK OK')}catch{console.log('SDK MISSING')}"
```

If missing, install it:

```bash
PLUGIN_ROOT="${OMP_PLUGIN_ROOT:-$PI_PLUGIN_ROOT}"
cd "$PLUGIN_ROOT" && npm install
```

The CLI is also available as a fallback: `CLI="babysitter"` or `CLI="npx -y @a5c-ai/babysitter-sdk"`

### jq

Make sure you have jq installed and available in the path. If not, install it.

---

## Core Iteration Workflow

The babysitter workflow has 8 steps:

1. **Create or find the process** - Interview the user (or parse the prompt), build a process definition
2. **Create run and bind session** - Create the run via the SDK bridge and bind to the pi session
3. **Run iteration** - Execute one orchestration step
4. **Get effects** - Check what tasks are requested
5. **Perform effects** - Execute the requested tasks
6. **Post results** - Commit results back to the journal
7. **Return control to the loop-driver** - The pi plugin's loop-driver controls iteration flow
8. **Completion proof** - Signal completion when the run is done

### 1. Create or find the process for the run

#### Interview phase

##### Interactive mode (default)

Interview the user for the intent, requirements, goal, scope, etc. In pi, use the TUI prompt capabilities to gather user input before the loop-driver takes over.

A multi-step phase to understand the intent and perspective to approach the process building after researching the repo, short research online if needed, short research in the target repo, additional instructions, intent and library (processes, specializations, skills, subagents, methodologies, references, etc.) / guide for methodology building. You MUST resolve the active library root with `babysitter process-library:active --json` before process authoring, and you MUST conduct an actual search against that active process library instead of skipping directly to writing a process. The `process-library:active` command now bootstraps the shared global SDK process library automatically if no binding exists yet. Read `binding.dir` from the returned JSON to get the active process-library root that must be searched. If you need the cloned repo root itself, read `defaultSpec.cloneDir` from the same JSON. After that, treat `specializations/**/**/**`, `methodologies/`, `contrib/`, and `reference/` as paths relative to `binding.dir`.

The first step should be the look at the state of the repo, then find the most relevant processes, specializations, skills, subagents, methodologies, references, etc. to use as a reference. Use the babysitter CLI discover command to find the relevant processes, skills, subagents, etc at various stages.

Then this phase can have: research online, research the repo, user questions, and other steps one after the other until the intent, requirements, goal, scope, etc. are clear and the user is satisfied with the understanding. After each step, decide the type of next step to take. Do not plan more than 1 step ahead in this phase. And the same step type can be used more than once in this phase.

##### Non-interactive mode (running with -p flag or no user prompt tool)

When running non-interactively, skip the interview phase entirely. Instead:
1. Parse the initial prompt to extract intent, scope, and requirements.
2. Research the repo structure to understand the codebase.
3. Resolve the active process-library root with `babysitter process-library:active --json`, then search that active library for the most relevant specialization/methodology. Do not skip this search step.
4. Proceed directly to the process creation phase using the extracted requirements.

#### User Profile Integration

Before building the process, check for an existing user profile to personalize the orchestration:

1. **Read user profile**: Run `babysitter profile:read --user --json` to load the user profile from `~/.a5c/user-profile.json`. **Always use the CLI for profile operations -- never import or call SDK profile functions directly.**

2. **Pre-fill context**: Use the profile to understand the user's specialties, expertise levels, preferences, and communication style. This informs how you conduct the interview (skip questions the profile already answers) and how you build the process.

3. **Breakpoint density**: Use the `breakpointTolerance` field to calibrate breakpoint placement in the generated process:
   - `minimal`/`low` (expert users): Fewer breakpoints -- only at critical decision points (architecture choices, deployment, destructive operations)
   - `moderate` (intermediate users): Standard breakpoints at phase boundaries
   - `high`/`maximum` (novice users): More breakpoints -- add review gates after each implementation step, before each integration, and at every quality gate
   - Always respect `alwaysBreakOn` for operations that must always pause (e.g., destructive-git, deploy)
   - If `skipBreakpointsForKnownPatterns` is true, reduce breakpoints for operations the user has previously approved

4. **Tool preferences**: Use `toolPreferences` and `installedSkills`/`installedAgents` to prioritize which agents and skills to use in the process. Prefer tools the user is familiar with.

5. **Communication style**: Adapt process descriptions and breakpoint questions to match the user's `communicationStyle` preferences (tone, explanationDepth, preferredResponseFormat).

6. **If no profile exists**: Proceed normally with the interview phase.

7. **CLI profile commands (mandatory)**: **All profile operations MUST use the babysitter CLI -- never import SDK profile functions directly.** This applies to the babysit skill itself, all generated processes, and all agent task instructions:
   - `babysitter profile:read --user --json` -- Read user profile as JSON
   - `babysitter profile:read --project --json` -- Read project profile as JSON
   - `babysitter profile:write --user --input <file> --json` -- Write user profile from file
   - `babysitter profile:write --project --input <file> --json` -- Write project profile from file
   - `babysitter profile:merge --user --input <file> --json` -- Merge partial updates into user profile
   - `babysitter profile:merge --project --input <file> --json` -- Merge partial updates into project profile
   - `babysitter profile:render --user` -- Render user profile as readable markdown
   - `babysitter profile:render --project` -- Render project profile as readable markdown

   Use `--dir <dir>` to override the default profile directory when needed.

#### Process creation phase

After the interview phase, create the complete custom process files (js and jsons) for the run according to the Process Creation Guidelines and methodologies section. Also install the babysitter-sdk inside .a5c if it is not already installed. (Install it in .a5c/package.json if it is not already installed, make sure to use the latest version). **IMPORTANT**: When installing into `.a5c/`, use `npm i --prefix .a5c @a5c-ai/babysitter-sdk@latest` or a subshell `(cd .a5c && npm i @a5c-ai/babysitter-sdk@latest)` to avoid leaving CWD inside `.a5c/`, which causes doubled path resolution bugs.
You must abide the syntax and structure of the process files from the process library.

**IMPORTANT -- Path resolution**: Always use **absolute paths** for `--entry` when calling `run:create`, and always run the CLI from the **project root** directory (not from `.a5c/`). Using relative paths while CWD is inside `.a5c/` causes doubled paths like `.a5c/.a5c/runs/` or `.a5c/.a5c/processes/`.

**User profile awareness**: If a user profile was loaded in the User Profile Integration step, use it to inform process design -- adjust breakpoint density per the user's tolerance level, select agents/skills the user prefers, and match the process complexity to the user's expertise.

**IMPORTANT -- Profile I/O in processes**: When generating process files, all profile read/write/merge operations MUST use the babysitter CLI commands (`babysitter profile:read`, `profile:write`, `profile:merge`, `profile:render`). Never instruct agents to import or call SDK profile functions (`readUserProfile`, `writeUserProfile`, etc.) directly. The CLI handles atomic writes, directory creation, and markdown generation automatically.

After the process is created and before creating the run:
- **Interactive mode**: Describe the process at high level (not the code or implementation details) to the user and ask for confirmation to use it, also generate it as a [process-name].diagram.md and [process-name].process.md file. If the user is not satisfied with the process, go back to the process creation phase and modify the process according to the feedback of the user until the user is satisfied with the process.
- **Non-interactive mode**: Proceed directly to creating the run without user confirmation.

### 2. Create run and bind session

The pi plugin uses the **SDK bridge** (programmatic API) as the primary method for creating runs. The session-binder extension auto-binds the run to the current pi session.

**Primary method -- SDK bridge (via the plugin extension):**

The session-binder extension provides `bindRun()` which calls `createRun` from `@a5c-ai/babysitter-sdk` directly -- no CLI subprocess is spawned. The session ID is auto-detected from `OMP_SESSION_ID` or `PI_SESSION_ID` environment variables.

**Fallback method -- CLI:**

```bash
PLUGIN_ROOT="${OMP_PLUGIN_ROOT:-$PI_PLUGIN_ROOT}"

babysitter run:create \
  --process-id <id> \
  --entry <path>#<export> \
  --inputs <file> \
  --prompt "$PROMPT" \
  --harness pi \
  --json
```

**Required flags (CLI fallback):**
- `--process-id <id>` -- unique identifier for the process definition
- `--entry <path>#<export>` -- path to the process JS file and its named export (e.g., `./my-process.js#process`)
- `--prompt "$PROMPT"` -- the user's initial prompt/request text
- `--harness pi` -- activates pi harness binding

**Optional flags:**
- `--inputs <file>` -- path to a JSON file with process inputs
- `--run-id <id>` -- override auto-generated run ID
- `--runs-dir <dir>` -- override runs directory (default: `.a5c/runs`)

**For resuming existing runs:**

The session-binder extension automatically detects and resumes active runs on session start. It checks `.a5c/runs/` for pending tasks and resumes from the first pending effect. No manual resume command is needed -- the plugin handles it.

### 3. Run Iteration

**Primary method -- SDK bridge:**

The loop-driver extension calls `iterate(runDir)` from the SDK bridge directly. Each `agent_end` event triggers the loop-driver which:
1. Checks for a `<promise>` completion proof in the agent output
2. Runs guard checks (max iterations, time limits, doom-loop detection)
3. Calls `orchestrateIteration` via the SDK bridge
4. Based on the result, either cleans up (completed/failed) or injects a follow-up prompt to continue (waiting)

**Fallback method -- CLI:**

```bash
babysitter run:iterate .a5c/runs/<runId> --json --iteration <n>
```

**Iteration result statuses:**
- `"completed"` - Run finished successfully
- `"failed"` - Run failed with error
- `"waiting"` - Effects pending, continue executing them

### 4. Get Effects

**Primary method -- SDK bridge:**

The SDK bridge provides `getPendingEffects(runDir)` and `getRunStatus(runDir)` which return pending effects directly from the journal without spawning a subprocess.

**Fallback method -- CLI:**

```bash
babysitter task:list .a5c/runs/<runId> --pending --json
```

**Output:**
```json
{
  "tasks": [
    {
      "effectId": "effect-abc123",
      "kind": "agent|skill|breakpoint|shell|sleep",
      "label": "auto",
      "status": "requested"
    }
  ]
}
```

### 5. Perform Effects

Run the effect externally to the SDK (by you, the loop-driver, or another worker). After execution (by delegation to an agent or skill), post the outcome summary into the run, which:
- Writes the committed result to `tasks/<effectId>/result.json`
- Appends an `EFFECT_RESOLVED` event to the journal
- Updates the state cache

IMPORTANT:
- Make sure the change was actually performed and not described or implied. (For example, if code files were mentioned as created in the summary, make sure they were actually created.)
- Include in the instructions to the agent or skill to perform the task in full and return only the summary result in the requested schema.

#### 5.1 Breakpoint Handling

##### 5.1.1 Interactive mode

In pi, breakpoints are presented to the user via TUI prompts. The pi plugin can render breakpoint questions directly in the terminal UI.

**CRITICAL: Response validation rules:**
- The breakpoint prompt MUST include explicit "Approve" and "Reject" (or similar) options so the user's intent is unambiguous.
- If the prompt returns empty, no selection, or the user dismisses it without choosing an option: treat as **NOT approved**. Re-ask the question or keep the breakpoint in a pending/waiting state. Do NOT proceed.
- NEVER fabricate, synthesize, or infer approval text. Only pass through the user's actual selected response verbatim.
- NEVER assume approval from ambiguous, empty, or missing responses. When in doubt, the answer is "not approved".

**CRITICAL: Breakpoint rejection posting rules:**
- Breakpoint rejection MUST be posted with `status: 'ok'` and a value of `{"approved": false, "response": "..."}`. NEVER use `status: 'error'` for a user rejection -- that signals a task execution failure and will trigger `RUN_FAILED`, requiring manual journal surgery to recover.
- Only use `status: 'error'` if the prompt tool itself throws an error.

**Breakpoint posting examples (SDK bridge):**

```typescript
// User approved the breakpoint
await postResult({
  runDir, effectId,
  status: 'ok',
  value: { approved: true, response: "Looks good, proceed" }
});

// User rejected the breakpoint
await postResult({
  runDir, effectId,
  status: 'ok',
  value: { approved: false, response: "Stop here" }
});
```

**Breakpoint posting examples (CLI fallback):**

```bash
# User approved
echo '{"approved": true, "response": "Looks good, proceed"}' > tasks/<effectId>/output.json
babysitter task:post <runId> <effectId> --status ok --value tasks/<effectId>/output.json

# User rejected (ALWAYS --status ok, NEVER --status error)
echo '{"approved": false, "response": "Stop here"}' > tasks/<effectId>/output.json
babysitter task:post <runId> <effectId> --status ok --value tasks/<effectId>/output.json
```

**Breakpoint value payload schema:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `approved` | `boolean` | Yes | Whether the user approved the breakpoint |
| `response` | `string` | No | The user's response text or selected option |
| `feedback` | `string` | No | Additional feedback from the user |

Breakpoints are meant for human approval. NEVER approve breakpoints yourself. Once the user responds via the TUI prompt, post the result of the breakpoint.

##### 5.1.2 Non-interactive mode

If running in non-interactive mode, resolve the breakpoint by selecting the best option according to the context and the intent of the user, then post the result.

**CRITICAL:** When rejecting a breakpoint in non-interactive mode, always use `status: 'ok'` with `{"approved": false}` in the value payload. Never use `status: 'error'` for rejections -- it will fail the entire run.

### 6. Results Posting

**IMPORTANT**: Do NOT write `result.json` directly. The SDK owns that file.

**Primary method -- SDK bridge:**

Use `postResult()` or the convenience wrappers `postOkResult()` / `postErrorResult()` from the result-poster module:

```typescript
import { postResult, postOkResult, postErrorResult } from './result-poster';

// Successful result
await postOkResult(runDir, effectId, { score: 85, details: { ... } });

// Failed result
await postErrorResult(runDir, effectId, {
  code: 'TASK_FAILED',
  message: 'Something went wrong',
  detail: 'Stack trace...'
});

// Full options
await postResult({
  runDir,
  effectId,
  status: 'ok',
  value: { score: 85 },
  stdout: 'captured stdout',
  stderr: 'captured stderr',
  startedAt: '2026-03-24T10:00:00Z',
  finishedAt: '2026-03-24T10:05:00Z',
});
```

The `postResult` function calls `commitEffectResult` from the SDK directly -- no CLI subprocess, no JSON parsing. It:
- Writes the complete `result.json` (including schema, metadata, and your value)
- Appends an `EFFECT_RESOLVED` event to the journal
- Updates the state cache

**Fallback method -- CLI:**

1. Write the result **value** to a separate file (e.g., `output.json`):
```json
{
  "score": 85,
  "details": { ... }
}
```

2. Post the result, passing the value file:
```bash
babysitter task:post .a5c/runs/<runId> <effectId> \
  --status ok \
  --value tasks/<effectId>/output.json \
  --json
```

**Available CLI flags:**
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

# CORRECT: Write value to separate file, let SDK create result.json
echo '{"score": 85}' > tasks/<effectId>/output.json
babysitter task:post <runId> <effectId> --status ok --value tasks/<effectId>/output.json
```

### 7. The loop-driver controls iteration -- not you.

The pi plugin's **loop-driver extension** controls the orchestration loop. On every `agent_end` event, the loop-driver:
1. Checks for a `<promise>` completion proof in the agent output
2. Runs guard checks (max iterations, time limits, doom-loop detection)
3. Calls `orchestrateIteration` via the SDK bridge
4. Injects a continuation prompt with pending effects for the next turn

**You do NOT loop independently.** Complete one task, post the result, and the loop-driver handles the rest by injecting a follow-up prompt via `session.followUp()`.

Common mistakes to avoid:
- WRONG: Running multiple iterations in a single agent turn
- CORRECT: Execute the pending effects, post results, then let the loop-driver trigger the next iteration

- WRONG: Building your own iteration loop
- CORRECT: Responding to the continuation prompt injected by the loop-driver

### 8. Completion Proof

When the run is completed, the SDK emits a `completionProof` value. You must return that exact value wrapped in a `<promise>...</promise>` tag to signal completion to the loop-driver.

The loop-driver's `extractPromiseTag()` function scans agent output for `<promise>...</promise>` tags. When found, the run is finalized and the loop stops.

---

## Task Kinds

**CRITICAL RULE: NEVER use `node` kind effects in generated processes.** The `node` kind executes inline Node.js scripts which bypasses the agent orchestration model entirely -- it produces deterministic scripts instead of leveraging LLM reasoning. Every task that would be a `node` effect MUST be converted to an `agent` or `skill` effect instead. If you encounter `node` kind tasks in reference process files, convert them to `agent` kind when using them as templates. The only acceptable non-agent kinds are `shell` (for running existing test suites, git commands, or build tools), `breakpoint` (human approval), and `sleep` (time gates).

| Kind | Description | Executor | When to use |
|------|-------------|----------|-------------|
| ~~`node`~~ | ~~Node.js script~~ | ~~Local node process~~ | **NEVER -- forbidden. Convert to `agent` or `skill`.** |
| `shell` | Shell command | Local shell process | Only for running existing CLI tools, test suites, git, linters, builds |
| `agent` | LLM agent | Agent runtime | **Default for all tasks** -- planning, implementation, analysis, verification, scoring, debugging, code writing, research |
| `skill` | Skill invocation | Skill system | When a matching installed skill exists (preferred over agent when available) |
| `breakpoint` | Human approval | TUI prompt | Decision gates requiring user input |
| `sleep` | Time gate | Scheduler | Time-based pauses |

### Agent Task Example

Important: Check which subagents and agents are actually available before assigning the name. If none, pass the general-purpose subagent. Check the subagents and agents in the plugin (in nested folders) and to find relevant subagents and agents to use as a reference. Specifically check subagents and agents in folders next to the reference process file.

```javascript
export const agentTask = defineTask('agent-scorer', (args, taskCtx) => ({
  kind: 'agent',  // Use "agent" not "node"
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

Important: Check which skills are actually available before assigning the skill name. Check the skills in the plugin (in nested folders) and to find relevant skills to use as a reference. Specifically check skills in folders next to the reference process file.

Never use the Babysitter skill or agent to execute the task. If the skill or subagent is not installed for the project before running the process, install it first. Skills are preferred over subagents for executing tasks, especially if you can find the right skill for the task. You can convert an agent call to a skill call even if the reference process mentions an agent call.

```javascript
export const skillTask = defineTask('analyzer-skill', (args, taskCtx) => ({
  kind: 'skill',  // Use "skill" not "node"
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

**Create run (SDK bridge -- primary):**
The session-binder's `bindRun()` handles run creation and session binding automatically.

**Create run (CLI fallback):**
```bash
babysitter run:create --process-id <id> --entry <path>#<export> --inputs <file> \
  --prompt "$PROMPT" --harness pi --json
```

**Check status (SDK bridge):**
```typescript
const status = await getRunStatus(runDir);
```

**Check status (CLI fallback):**
```bash
babysitter run:status <runId> --json
```

**View events:**
```bash
babysitter run:events <runId> --limit 20 --reverse
```

**List pending tasks (SDK bridge):**
```typescript
const pending = await getPendingEffects(runDir);
```

**List pending tasks (CLI fallback):**
```bash
babysitter task:list <runId> --pending --json
```

**Post task result (SDK bridge):**
```typescript
await postOkResult(runDir, effectId, value);
await postErrorResult(runDir, effectId, error);
```

**Post task result (CLI fallback):**
```bash
babysitter task:post <runId> <effectId> --status <ok|error> --json
```

**Iterate (SDK bridge):**
```typescript
const result = await iterate(runDir);
```

**Iterate (CLI fallback):**
```bash
babysitter run:iterate <runId> --json --iteration <n>
```

---

## Recovery from failure

If at any point the run fails due to SDK issues or corrupted state or journal, analyze the error and the journal events. Recover the state to the last known good state and adapt and try to continue the run.

The session-binder extension persists run state to `plugins/babysitter-pi/state/<sessionId>.json` using an atomic tmp+rename pattern. If the in-memory state is lost (e.g., after a restart), the session-binder automatically recovers from the persisted state file on the next `initSession()` call.

---

## Process Creation Guidelines and methodologies

- When building ux and full stack applications, integrate/link the main pages of the frontend with functionality created for every phase of the development process (where relevant). So that is a way to test the functionality of the app as we go.

- Unless otherwise specified, prefer quality gated iterative development loops in the process.

- You can change the process after the run is created or during the run (and adapt the process accordingly and journal accordingly) in case you discovered new information or requirements that were not previously known that changes the approach or the process.

- The process should be a comprehensive and complete solution to the user request. It should not be a partial solution or a work in progress. It should be a complete and working solution that can be used to test the functionality of the app as we go.

- The process should usually be a composition (in code) of multiple processes from the process library (not just one), for multiple phases and parts of the process, each utilizing a different process from the library as a reference. In order to perform the user request in the most accurate and robust process that utilizes the best-practices from the library in every part.

- Include verification and refinement steps (and loops) for planning phases and integration phases, debugging phases, refactoring phases, etc. as well.

- Create the process with (and around) the available skills and subagents. (Check which are available first and use discover to allow)

- Prefer incremental work that allows testing and experimentation with the new functionality of the work or app as we go. For example, when building a new feature, prefer building it in a way that allows testing it with a simple script or a simple page in the frontend before integrating it to the main pages and flows of the app.

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

- Scan the methodologies and processes in the active process library and the sdk package to find relevant processes and methodologies to use as a reference. This search is mandatory before writing the process. Also search for process files bundled in active skills and processes in the repo (`.a5c/processes/`).

- If you encounter a generic reusable part of a process that can be later reused and composed, build it in a modular way and organize it in the .a5c/processes directory. And import it to compose it to the specific process in the current user request. Prefer architecting processes in such modular way for reusability and composition.

Prefer processes that have the following characteristics unless otherwise specified:
  - In case of a new project, plan the architecture, stack, parts, milestones, etc.
  - In case of an existing project, analyze the architecture, stack, relevant parts, milestones, etc. and plan the changes to be made in: milestones, existing modules modification/preparation steps, new modules, integration steps, etc.
  - Integrate/link the main pages (or entry points) with functionality created for every phase of the development process (where relevant). So that there is a way to test and experiment with the new functionality of the work or app as we go.
  - Quality gated iterative and convergent development/refinement/optimization loops for each part of the implementation, definition, ux design and definition, specs, etc.
  - Test driven - where quality gates agents can use executable tools, scripts and tests to verify the accuracy and completeness of the implementation.
  - Integration Phases for each new functionality in every milestone with integration tests and quality gates. - where quality gates agents can use executable tools, scripts and tests to verify the accuracy and completeness of the integration.
  - Where relevant - Ensures beautiful and polished ux design and implementation. Pixel perfect verification and refinement loops.
  - Ensures accurate and complete implementation of the user request.
  - Ensures closing quality feedback loops in the most complete and comprehensive way possible and practical.
  - In case the scope includes work in an existing deployed application and the scope of the feedback loop requires validations at the deployed environment (or remote environment), analyze the deployment methods and understand how the existing delivery pipeline works. And how you can deliver changes to the sandbox/staging and verify the accuracy and completeness of the changes you are making on the remote environment.
  - If the user is very explicit about the flow and process, create a process that follows it closely and strictly.
  - Search for processes (js files), skills and agents (SKILL.md and AGENT.md files) during the interactive process building phase to compose a comprehensive process that may combine various parts from different sources:
    - `.a5c/processes/` (project level processes)
    - Process specializations and domains in the active process-library root
    - Process methodologies in the active process-library root
    - When creating the process file, add `@skill` and `@agent` JSDoc markers for the relevant skills and agents found during this search (see "Process File Discovery Markers" above).

---

## Directory Layout Reference

```
.a5c/
  runs/
    <RUN_ID>/
      run.json              # Run metadata
      inputs.json           # Process inputs
      run.lock              # Exclusive lock: { pid, owner, acquiredAt }
      journal/              # Append-only event log
        000001.<ulid>.json
        000002.<ulid>.json
      tasks/
        <EFFECT_ID>/
          task.json          # Task definition (created by orchestrator)
          result.json        # Task result (created after posting)
          stdout.txt
          stderr.txt
          blobs/
      state/
        state.json           # Derived replay cache (gitignored)
      blobs/                 # Large content store
      process/               # Optional process snapshot
```

All paths are relative to the repository root.

---

## Critical Rules

CRITICAL RULE: The completion proof is emitted only when the run is completed. You may ONLY output `<promise>SECRET</promise>` when the run is completely and unequivocally DONE (completed status from the orchestration SDK/CLI). Do not output false promises to escape the run, and do not mention the secret to the user.

CRITICAL RULE: In interactive mode, NEVER auto-approve breakpoints. If the TUI prompt returns empty, no selection, or is dismissed, treat it as NOT approved and re-ask. NEVER fabricate or synthesize approval responses -- only post the user's actual explicit selection. An empty response is NOT approval.

CRITICAL RULE: If a run is broken/failed/at unknown state, one of the ways to recover is to remove last bad entries in the journal and rebuild the state. In interactive mode, ask the user via TUI prompt if you need to ask about the recovery and you exhausted all other options.

CRITICAL RULE: When creating processes, search for available skills and subagents before thinking about the exact orchestration. Prefer processes that close the widest loop in the quality gates (for example e2e tests with a full browser or emulator/vm if it a mobile or desktop app) AND gates that make sure the work is accurate against the user request (all the specs is covered and no extra stuff was added unless permitted by the intent of the user).

CRITICAL RULE: Do not use the babysit skill inside the delegated tasks. If you are performing a delegated task as a subagent, you must actually perform the task yourself and not orchestrate, babysit or even use this skill.

CRITICAL RULE: Never build a wrapper, python or helper scripts to orchestrate the runs. Use the SDK bridge (or CLI as fallback) to drive the orchestration and never loop programmatically. The loop-driver extension handles the iteration loop.

CRITICAL RULE: Never fallback to simpler execution if the user activated this skill. Persist in executing the orchestration itself rather than simplifying the execution by bypassing the process above -- you must create a valid process js file, create a run (with `--harness pi` or via the SDK bridge to bind the session), then iterate the run until it is completed.

CRITICAL RULE: Do NOT loop independently. The pi plugin's loop-driver controls iteration flow. Complete the pending effects, post results, and the loop-driver injects the next continuation prompt via `session.followUp()`. Running multiple iterations in a single agent turn bypasses the loop-driver and breaks the orchestration model.

CRITICAL RULE: NEVER use `kind: 'node'` in generated process files. All tasks MUST use `kind: 'agent'` (with an agent prompt schema) or `kind: 'skill'` (when a matching skill is available). If a reference process template uses `node` kind tasks, you MUST convert them to `agent` kind when adapting the template. The `node` kind produces inline scripts that bypass LLM reasoning -- this defeats the purpose of agent orchestration. The only non-agent kinds allowed are `shell` (for existing CLI tools/tests/git), `breakpoint`, and `sleep`.

CRITICAL RULE: NEVER bypass, avoid or skip the babysitter orchestration model when the user explicitly requested this skill. Do not execute the tasks yourself, do not loop programmatically, do not create helper scripts to orchestrate the runs. Use the SDK bridge (or CLI as fallback) and do not bypass it. Not for simple tasks, and even if things get complicated or don't go smoothly. Persist in executing the orchestration itself rather than simplifying the execution by bypassing the process above.

CRITICAL RULE: Always prefer the SDK bridge over the CLI for run operations. The pi plugin provides `createNewRun()`, `iterate()`, `postResult()`, `getRunStatus()`, and `getPendingEffects()` via the sdk-bridge module. These run in-process, avoiding subprocess overhead and JSON parsing. Only fall back to the CLI when the SDK bridge is unavailable.

## See Also
- `library/tdd-quality-convergence.js` - TDD quality convergence example - read and look for relevant processes and methodologies before creating the code process for a new run
- `library/reference/ADVANCED_PATTERNS.md` - Agent/skill patterns, iterative convergence
- `library/reference/sdk.md` - SDK API reference
