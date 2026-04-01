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
