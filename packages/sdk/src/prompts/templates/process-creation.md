#### Process creation phase

After the interview phase, create the complete custom process files (js and
jsons) for the run according to the Process Creation Guidelines and
methodologies section. Also install the babysitter-sdk inside `.a5c/` if it is
not already installed. **IMPORTANT**: When installing into `.a5c/`, use
`{{sdkInstallCmd}}` or a subshell
`{{sdkSubshellCmd}}` to avoid leaving CWD inside
`.a5c/`, which causes doubled path resolution bugs.

You must abide the syntax and structure of the process files from the process
library.
{{#processLibraryRoot}}

**Process library root**: `{{processLibraryRoot}}`
{{#processLibraryReferenceRoot}}
**Reference root**: `{{processLibraryReferenceRoot}}`
{{/processLibraryReferenceRoot}}
Use these paths to find relevant process patterns, specializations, and
methodologies when authoring the process.
{{/processLibraryRoot}}
{{^processLibraryRoot}}
Resolve the active library root with `babysitter process-library:active --json`
before process authoring, and conduct an actual search against that active process
library. Read `binding.dir` from the returned JSON to get the active
process-library root.
{{/processLibraryRoot}}

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
  generate it as a [process-name].mermaid.md and [process-name].process.md file.
  If the user is not satisfied with the process, go back to the process creation
  phase and modify the process according to the feedback.
- **Non-interactive mode**: proceed directly to creating the run without user
  confirmation.

**Common mistakes to avoid:**
- wrong: skipping repo/process-library research before writing the process
- wrong: bypassing the orchestration model with helper scripts or inline logic
- wrong: using `kind: 'node'` in generated tasks
- correct: use `agent` or `skill` tasks for reasoning work, with `shell` only
  for existing CLIs, tests, linters, git, or builds
- correct: include verification loops, refinement loops, quality gates, and
  breakpoints where appropriate
