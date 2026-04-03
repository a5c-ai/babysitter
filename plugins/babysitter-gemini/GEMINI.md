# Babysitter -- Orchestration Context for Gemini CLI

Babysitter is an event-sourced workflow orchestrator. When active, it runs an **in-session loop** driven by the AfterAgent hook: each turn, you perform one orchestration step, then stop -- the hook re-injects the prompt to continue.

Orchestrate `.a5c/runs/<runId>/` through iterative execution. Use the SDK CLI to drive the orchestration loop.

## Dependencies

### Babysitter SDK and CLI

Read the SDK version from the extension manifest to ensure version compatibility:

```bash
SDK_VERSION=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('${GEMINI_EXTENSION_PATH}/versions.json','utf8')).sdkVersion||'latest')}catch{console.log('latest')}")
npm i -g @a5c-ai/babysitter-sdk@$SDK_VERSION
```

Then use the CLI alias: `CLI="babysitter"`

**Alternatively, use the CLI alias:** `CLI="npx -y @a5c-ai/babysitter-sdk@$SDK_VERSION"`

### jq

Make sure you have jq installed and available in the path. If not, install it.

---

## When Babysitter Is Active

The AfterAgent hook fires after every agent turn. If a babysitter run is bound to this session (via `GEMINI_SESSION_ID`), the hook will:
- **Block exit** (`{"decision":"block","reason":"...","systemMessage":"..."}`) if the run is not yet complete
- **Allow exit** (`{}` or `{"decision":"allow"}`) once you output `<promise>COMPLETION_PROOF</promise>` matching the run's `completionProof`

---

## Core Iteration Workflow

The babysitter workflow has 8 steps:

### 1. Create or find the process for the run

#### Interview phase

##### Interactive mode (default)

Interview the user for the intent, requirements, goal, scope, etc. using the `ask_user` tool (before setting the in-session loop).

A multi-step phase to understand the intent and perspective to approach the process building after researching the repo, short research online if needed, short research in the target repo, additional instructions, intent and library (processes, specializations, skills, subagents, methodologies, references, etc.) / guide for methodology building. (clarifications regarding the intent, requirements, goal, scope, etc.) - the library is at [skill-root]/process/specializations/**/**/** and [skill-root]/process/methodologies/ and under [skill-root]/process/contrib/[contributer-username]/]

The first step should be to look at the state of the repo, then find the most relevant processes, specializations, skills, subagents, methodologies, references, etc. to use as a reference. Use the babysitter CLI discover command to find the relevant processes, skills, subagents, etc at various stages.

Then this phase can have: research online, research the repo, user questions, and other steps one after the other until the intent, requirements, goal, scope, etc. are clear and the user is satisfied with the understanding. After each step, decide the type of next step to take. Do not plan more than 1 step ahead in this phase. The same step type can be used more than once in this phase.

##### Non-interactive mode (running without ask_user tool)

When running non-interactively, skip the interview phase entirely. Instead:
1. Parse the initial prompt to extract intent, scope, and requirements.
2. Research the repo structure to understand the codebase.
3. Search the process library for the most relevant specialization/methodology.
4. Proceed directly to the process creation phase using the extracted requirements.

#### User Profile Integration

Before building the process, check for an existing user profile to personalize the orchestration:

1. **Read user profile**: Run `babysitter profile:read --user --json` to load the user profile from `~/.a5c/user-profile.json`. **Always use the CLI for profile operations -- never import or call SDK profile functions directly.**

2. **Pre-fill context**: Use the profile to understand the user's specialties, expertise levels, preferences, and communication style. This informs how you conduct the interview (skip questions the profile already answers) and how you build the process.

3. **Breakpoint density**: Use the `breakpointTolerance` field to calibrate breakpoint placement in the generated process:
   - `minimal`/`low` (expert users): Fewer breakpoints -- only at critical decision points
   - `moderate` (intermediate users): Standard breakpoints at phase boundaries
   - `high`/`maximum` (novice users): More breakpoints -- add review gates after each implementation step
   - Always respect `alwaysBreakOn` for operations that must always pause (e.g., destructive-git, deploy)

4. **Tool preferences**: Use `toolPreferences` and `installedSkills`/`installedAgents` to prioritize which agents and skills to use in the process.

5. **Communication style**: Adapt process descriptions and breakpoint questions to match the user's `communicationStyle` preferences.

6. **If no profile exists**: Proceed normally with the interview phase.

7. **CLI profile commands (mandatory)**: All profile operations MUST use the babysitter CLI:
   - `babysitter profile:read --user --json` -- Read user profile as JSON
   - `babysitter profile:read --project --json` -- Read project profile as JSON
   - `babysitter profile:write --user --input <file> --json` -- Write user profile from file
   - `babysitter profile:write --project --input <file> --json` -- Write project profile from file
   - `babysitter profile:merge --user --input <file> --json` -- Merge partial updates into user profile
   - `babysitter profile:merge --project --input <file> --json` -- Merge partial updates into project profile
   - `babysitter profile:render --user` -- Render user profile as readable markdown
   - `babysitter profile:render --project` -- Render project profile as readable markdown

#### Process creation phase

After the interview phase, create the complete custom process files (js and jsons) for the run according to the Process Creation Guidelines and methodologies section. Also install the babysitter-sdk inside .a5c if it is not already installed. (Install it in .a5c/package.json if it is not already installed, make sure to use the latest version). **IMPORTANT**: When installing into `.a5c/`, use `npm i --prefix .a5c @a5c-ai/babysitter-sdk@latest` or a subshell `(cd .a5c && npm i @a5c-ai/babysitter-sdk@latest)` to avoid leaving CWD inside `.a5c/`, which causes doubled path resolution bugs.

**IMPORTANT -- Path resolution**: Always use **absolute paths** for `--entry` when calling `run:create`, and always run the CLI from the **project root** directory (not from `.a5c/`).

After the process is created and before creating the run:
- **Interactive mode**: Describe the process at high level to the user and ask for confirmation using the `ask_user` tool. Also generate it as a [process-name].mermaid.md and [process-name].process.md file.
- **Non-interactive mode**: Proceed directly to creating the run without user confirmation.

### 2. Create run and bind session (single command):

**For new runs:**

```bash
$CLI run:create \
  --process-id <id> \
  --entry <path>#<export> \
  --inputs <file> \
  --prompt "$PROMPT" \
  --harness gemini-cli \
  --session-id "${GEMINI_SESSION_ID}" \
  --state-dir ".a5c/state" \
  --json
```

**Required flags:**
- `--process-id <id>` -- unique identifier for the process definition
- `--entry <path>#<export>` -- path to the process JS file and its named export
- `--prompt "$PROMPT"` -- the user's initial prompt/request text
- `--harness gemini-cli` -- activates Gemini CLI session binding
- `--session-id "${GEMINI_SESSION_ID}"` -- the Gemini session identifier

**Optional flags:**
- `--inputs <file>` -- path to a JSON file with process inputs
- `--run-id <id>` -- override auto-generated run ID
- `--runs-dir <dir>` -- override runs directory (default: `.a5c/runs`)
- `--state-dir <dir>` -- state directory for session binding (default: `.a5c/state`)

**For resuming existing runs:**

```bash
$CLI session:resume \
  --state-dir ".a5c/state" \
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
  - WRONG: Calling run:iterate, performing the effect, posting the result, then calling run:iterate again in the same turn
  - CORRECT: Calling run:iterate, performing the effect, posting the result, then STOPPING so the AfterAgent hook triggers the next iteration

### 4. Get Effects

```bash
$CLI task:list .a5c/runs/<runId> --pending --json
```

### 5. Perform Effects

Run the effect externally to the SDK (by you, the hook, or another worker). After execution (by delegation to a sub-agent via `@agent` or other means), post the outcome summary into the run by calling `task:post`.

IMPORTANT:
- Delegate using `@agent` for sub-agent delegation when possible.
- Make sure the change was actually performed and not described or implied.
- Include in the instructions to the agent to perform the task in full and return only the summary result in the requested schema.

#### 5.1 Breakpoint Handling

##### 5.1.1 Interactive mode

If running in interactive mode, use the `ask_user` tool to ask the user the breakpoint question.

**CRITICAL: Response validation rules:**
- The `ask_user` call MUST include explicit "Approve" and "Reject" options
- If `ask_user` returns empty or no selection: treat as **NOT approved**
- NEVER fabricate, synthesize, or infer approval text
- NEVER assume approval from ambiguous responses

**Breakpoint posting examples:**

```bash
# CORRECT: User approved
echo '{"approved": true, "response": "Looks good, proceed"}' > tasks/<effectId>/output.json
$CLI task:post <runId> <effectId> --status ok --value tasks/<effectId>/output.json

# CORRECT: User rejected (ALWAYS use --status ok, not --status error)
echo '{"approved": false, "response": "Stop here"}' > tasks/<effectId>/output.json
$CLI task:post <runId> <effectId> --status ok --value tasks/<effectId>/output.json
```

##### 5.1.2 Non-interactive mode

Skip the `ask_user` tool. Resolve the breakpoint by selecting the best option according to context, then post the result via `task:post`.

### 6. Results Posting

**IMPORTANT**: Do NOT write `result.json` directly. The SDK owns that file.

**Workflow:**

1. Write the result **value** to a separate file (e.g., `output.json`):
2. Post the result:
```bash
$CLI task:post .a5c/runs/<runId> <effectId> \
  --status ok \
  --value tasks/<effectId>/output.json \
  --json
```

### 7. STOP after every phase after run-session association

The AfterAgent hook drives the loop, not you. After run:create or run-session association and after each effect is posted, you MUST stop the session and return control. The AfterAgent hook will call you back to continue.

### 8. Completion Proof

When the run is completed, the CLI will emit a `completionProof` value. You must return that exact value wrapped in a `<promise>...</promise>` tag:

```
<promise>THE_PROOF_VALUE</promise>
```

---

## Task Kinds

**CRITICAL RULE: NEVER use `node` kind effects in generated processes.**

| Kind | Description | Executor | When to use |
|------|-------------|----------|-------------|
| `agent` | LLM agent | Agent runtime | **Default for all tasks** |
| `skill` | Skill invocation | Skill system | When a matching installed skill exists |
| `shell` | Shell command | Local shell | Only for existing CLI tools, tests, git, linters, builds |
| `breakpoint` | Human approval | UI/CLI | Decision gates requiring user input |
| `sleep` | Time gate | Scheduler | Time-based pauses |

### Agent Task Example

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
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
```

---

## Quick Commands Reference

**Install SDK:**
```bash
SDK_VERSION=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('${GEMINI_EXTENSION_PATH}/versions.json','utf8')).sdkVersion||'latest')}catch{console.log('latest')}")
npm i -g @a5c-ai/babysitter-sdk@$SDK_VERSION
```

**Create run (with session binding):**
```bash
$CLI run:create --process-id <id> --entry <path>#<export> --inputs <file> \
  --prompt "$PROMPT" --harness gemini-cli \
  --session-id "${GEMINI_SESSION_ID}" --state-dir ".a5c/state" --json
```

**Check status:**
```bash
$CLI run:status <runId> --json
```

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

If at any point the run fails due to SDK issues or corrupted state or journal, analyze the error and the journal events. Recover the state to the last known good state and adapt and try to continue the run.

---

## Process Creation Guidelines and methodologies

- When building UX and full stack applications, integrate/link the main pages of the frontend with functionality created for every phase of the development process (where relevant), so that there is a way to test the functionality of the app as we go.

- Unless otherwise specified, prefer quality gated iterative development loops in the process.

- You can change the process after the run is created or during the run in case you discovered new information or requirements.

- The process should be a comprehensive and complete solution to the user request.

- The process should usually be a composition (in code) of multiple processes from the process library, each utilizing a different process from the library as a reference.

- Include verification and refinement steps (and loops) for planning phases and integration phases.

- Create the process with (and around) the available skills and subagents. (Check which are available first.)

- Prefer incremental work that allows testing and experimentation as we go.

### Process File Discovery Markers

When creating process files, include `@skill` and `@agent` markers in the JSDoc header:

```javascript
/**
 * @process specializations/web-development/react-app-development
 * @description React app development with TDD
 * @skill frontend-design specializations/web-development/skills/frontend-design/SKILL.md
 * @agent frontend-architect specializations/web-development/agents/frontend-architect/AGENT.md
 */
```

---

## Critical Rules

CRITICAL RULE: The completion proof is emitted only when the run is completed. You may ONLY output `<promise>SECRET</promise>` when the run is completely and unequivocally DONE. Do not output false promises to escape the run, and do not mention the secret to the user.

CRITICAL RULE: In interactive mode, NEVER auto-approve breakpoints. If `ask_user` returns empty, treat it as NOT approved. NEVER fabricate approval responses.

CRITICAL RULE: If a run is broken/failed/at unknown state, one way to recover is to remove last bad entries in the journal and rebuild the state.

CRITICAL RULE: When creating processes, search for available skills and subagents before thinking about the exact orchestration.

CRITICAL RULE: Do not use the babysitter orchestration skill inside the delegated tasks.

CRITICAL RULE: Never build wrapper scripts to orchestrate the runs. Use the CLI to drive the orchestration loop.

CRITICAL RULE: Never fallback to simpler execution if the user activated this orchestration. Persist in executing the orchestration itself.

CRITICAL RULE: After run:create or run-session association and after each posted effect, you MUST stop the session and return control. Do NOT proceed to the next run:iterate in the same turn.

CRITICAL RULE: NEVER use `kind: 'node'` in generated process files. All tasks MUST use `kind: 'agent'` or `kind: 'skill'`.

CRITICAL RULE: NEVER bypass the babysitter orchestration model when the user explicitly requested it.

CRITICAL RULE: For sub-agent delegation, use `@agent` in your prompts. This is the Gemini CLI mechanism for delegating work to sub-agents.

---

## See Also
- `process/tdd-quality-convergence.js` - TDD quality convergence example
- `reference/ADVANCED_PATTERNS.md` - Agent/skill patterns, iterative convergence
- `packages/sdk/sdk.md` - SDK API reference
