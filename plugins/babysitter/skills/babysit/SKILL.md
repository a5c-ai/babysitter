---
name: babysit
description: Orchestrate via @babysitter. Use this skill when asked to babysit a run, orchestrate a process or whenever it is called explicitly. (babysit, babysitter, orchestrate, orchestrate a run, workflow, etc.)
allowed-tools: Read, Grep, Write, Task, Bash, Edit, Grep, Glob, WebFetch, WebSearch, Search, AskUserQuestion, TodoWrite, TodoRead, Skill, BashOutput, Skill, KillShell, MultiEdit, LS
version: 0.1.1
---

# babysit

Orchestrate `.a5c/runs/<runId>/` through iterative execution. Use the SDK CLI to drive the orchestration loop. 
## Dependencies

### Babysitter SDK and CLI
make sure you have the latest version of the cli:

```bash
npm i -g @a5c-ai/babysitter@latest @a5c-ai/babysitter-sdk@latest @a5c-ai/babysitter-breakpoints@latest
```

then use the CLI alias: CLI="babysitter"

**Alternatively, use the CLI alias:** `CLI="npx -y @a5c-ai/babysitter-sdk@latest"`

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

interview the user for the intent, requirements, goal, scope, etc.
using AskUserQuestion tool (or breakpoint if running in non-interactive mode) -  (before setting the in-session loop).

a multi-step phase to understand the intent and perspecitve to approach the process building after researching the repo, short research online if needed, short research in the target repo, additional instructions, intent and library (processes, specializations, skills, subagents, methodologies, references, etc.) / guide for methodology building. (clarifications regarding the intent, requirements, goal, scope, etc.) - the library is at [skill-root]/process/specializations/**/**/** and [skill-root]/process/methodologies/ 

the first step should be the look at the state of the repo, then find the most relevant processes, specializations, skills, subagents, methodologies, references, etc. to use as a reference.

then this phase can have: research online, research the repo, user questions, and other steps one after the other until the intent, requirements, goal, scope, etc. are clear and the user is satisfied with the understanding. after each step, decide the type of next step to take. do not plan more than 1 step ahead in this phase. and the same step type can be used more than once in this phase.

#### Process creation phase

after the interview phase, create the complete custom process files (js and jsons) for the run according to the Process Creation Guidelines and methodologies section. also install the babysitter-sdk inside .a5c if it is not already installed. (install it in .a5c/package.json if it is not already installed. make sure )
you must abide the syntax and structure of the process files from the process library.

### 2. Setup session:

**For new runs:**

1. Setup in-session loop:
```bash
bash "${CLAUDE_PLUGIN_ROOT}/skills/babysit/scripts/setup-babysitter-run.sh" --claude-session-id "${CLAUDE_SESSION_ID}" $PROMPT
```

2. Create the run:
```bash
$CLI run:create --process-id <id> --entry <path> --inputs <file> --json
```

3. Associate session with run:
```bash
bash "${CLAUDE_PLUGIN_ROOT}/skills/babysit/scripts/associate-session-with-run.sh" \
  --run-id <runId-from-step-2> \
  --claude-session-id "${CLAUDE_SESSION_ID}"
```

**For resuming existing runs:**

```bash
bash "${CLAUDE_PLUGIN_ROOT}/skills/babysit/scripts/setup-babysitter-run-resume.sh" --claude-session-id "${CLAUDE_SESSION_ID}" --run-id RUN_ID"
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
  "completionSecret": "only-present-when-completed",
  "metadata": { "runId": "...", "processId": "..." }
}
```

**Status values:**
- `"executed"` - Tasks executed, continue looping
- `"waiting"` - Breakpoint/sleep, pause until released
- `"completed"` - Run finished successfully
- `"failed"` - Run failed with error
- `"none"` - No pending effects

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
- Delegate using the Task tool if possible. 
- Make sure the change was actually performed and not described or implied. (for example, if code files were mentioned as created in the summary, make sure they were actually created.)
- Include in the instructions to the agent or skill to perform the task in full and return the only the summary result in the requested schema.

#### 5.1 Breakpoint Handling

##### 5.1.1 Interactive mode

If running in interactive mode, use AskUserQuestion tool to ask the user the question and get the answer.

then post the result of the breakpoint to the run by calling `task:post`.

Otherwise:

##### 5.1.2 Non-interactive mode

if running in non-interactive mode, use the breakpoint create command to create the breakpoint and get the answer from the user:

```bash
npx @a5c-ai/babysitter-breakpoints breakpoint create --tag <tag> --question "<question>" --title "<title>" --run-id <runId> --file <file,format,language,label> --file <file,format,language,label> --file <file,format,language,label> ...
```

 to create the breakpoint and get the answer from the user. breakpoint are meant for human approval through the breakpoint tool. NEVER prompt directly and never release or approve this breakpoint yourself. but you may need to post the result of the breakpoint to the run by calling `task:post` when the breakpoint is resolved.

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
# ❌ WRONG: Writing result.json directly
echo '{"result": {...}}' > tasks/<effectId>/result.json
$CLI task:post <runId> <effectId> --status ok

# ✅ CORRECT: Write value to separate file, let SDK create result.json
echo '{"score": 85}' > tasks/<effectId>/output.json
$CLI task:post <runId> <effectId> --status ok --value tasks/<effectId>/output.json
```

---

### 7. repeat the orchestration loop as needed.

Repeat orchestration loop by calling run:iterate or doing the next right thing.

In case you don't follow this step, you will be called by the stop-hook and you will be asked to repeat the orchestration loop or exit the loop by posting the completion secret.

## Task Kinds

| Kind | Description | Executor |
|------|-------------|----------|
| `node` | Node.js script | Local node process |
| `shell` | Shell script | Local shell process |
| `agent` | LLM agent | Agent runtime |
| `skill` | Claude Code skill | Skill system |
| `breakpoint` | Human approval | UI/CLI |
| `sleep` | Time gate | Scheduler |

### Agent Task Example

Important: Check which subagents and agents are actually available before assigning the name. if none, pass the general-purpose subagent.
when executing the agent task, use the Task tool. never use the Babysitter skill or agent to execute the task. if the subagent or agent is not installed for the project before running the process, install it first.

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

Important: Check which skills are actually available before assigning the name. 
Never use the Babysitter skill or agent to execute the task. if the skill or subagent is not installed for the project before running the process, install it first.

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

**Create run:**
```bash
$CLI run:create --process-id <id> --entry <path>#<export> --inputs <path> --run-id <id>
```

**Check status:**
```bash
$CLI run:status <runId> --json
```

When the run completes, `run:iterate` and `run:status` emit `completionSecret`. Use that exact value in a `<promise>...</promise>` tag to end the loop.

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

- include verification and refinement steps (and loops) for planning phases and integration phases, debugging phases, refactoring phases, etc. as well.

- Create the process with the available skills and subagents. 

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
  - search for processes (js files), skills and agents (SKILL.md and AGENT.md files) in during the interactive process building phase to compose a comprehensive process that may combine various parts from different sources:
    - .a5c/processes/ (project level processes)
    - plugins/babysitter/skills/babysit/process/specializations/[rnd-specialization-name-slugified]/ (rnd specializations)
    - plugins/babysitter/skills/babysit/process/specializations/domains/[domain-name-slugified]/[specialization-name-slugified]/ (non rnd specializations)
    - plugins/babysitter/skills/babysit/process/methodologies/ (methodologies)

## Critical Rules

CRITICAL RULE: The completion secret is emitted only when the run is completed. You may ONLY output `<promise>SECRET</promise>` when the run is completely and unequivocally DONE (completed status from the orchestration CLI). Do not output false promises to escape the run, and do not mention the secret to the user.

CRITICAL RULE: in non-interactive mode, never approve breakpoints through the CLI by yourself. only create them and wait for them. they will always be resolved externally.

CRITICAL RULE: in non-interactive mode, if a breakpoint is still waiting. monitor it for approval until it is resolved. do not return prompt to the user. just wait for the breakpoint to be resolved.

CRITICAL RULE: if a run is broken/failed/at unknown state, when of the way to recover is to remove last bad entries in the journal and rebuild the state. in interactive mode, use the AskUserQuestion tool if you need to ask the user for a question about the recovery and you exhausted all other options.

CRITICAL RULE: when creating processes, search for available skills and subagents before thinking about the exact orchestration. prefer processes that close the widest loop in the quality gates (for example e2e tests with a full browser or emulator/vm if it a mobile or desktop app) AND gates that make sure the work is accurate against the user request (all the specs is covered and no extra stuff was added unless permitted by the intent of the user).

CRITICAL RULE: do not use the babysit skill inside the delegated tasks. if you are performing a delgated task as a subagent. you will get an error when trying to run the setup shell script. that means you have to actually perform the task yourself and not orchestrate, babysit or even use this skill.

CRITICAL RULE: Never build a wrapper, python or helper scripts to orchestrate the runs. Use the CLI to drive the orchestration loop and never loop programmatically.

CRITICAL RULE: Never fallback to simpler execution if the user activated this skill. persist in executing the orchestration itself rather than simplifying the execution by bypassing the process above - you must create a valid process js file, create a run and associate it with the session, then iterate the run until it is completed.

## See Also
- `process/tdd-quality-convergence.js` - TDD quality convergence example - read and look for relevant processes and methodolies before creating the code process for a new run (create the run using the CLI, then use these process as a reference)
- `reference/ADVANCED_PATTERNS.md` - Agent/skill patterns, iterative convergence
- `packages/sdk/sdk.md` - SDK API reference
