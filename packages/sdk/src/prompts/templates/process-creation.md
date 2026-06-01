#### Process creation phase

After the interview phase, create the complete custom process files (js and
jsons) for the run according to the Process Creation Guidelines and
methodologies section. Place process files in `.a5c/processes/`.

**Note:** The `run:create` command automatically ensures `.a5c/package.json`
exists with `"type": "module"` for ESM support. You do **not** need to install
the babysitter-sdk inside `.a5c/` or create a package.json manually.

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

**Phase 0 -- REUSE-AUDIT for `babysitter:plan`**: Before drafting a plan that
introduces new infrastructure such as tables, migrations, API routes,
environment variables, or SDK installs, run a targeted reuse audit:

1. Extract keyword nouns and verbs from the user prompt.
2. Scan existing migrations such as `supabase/migrations/*.sql` or the
   framework-equivalent migration path for those keywords.
3. Scan API route files such as `src/app/api/**/route.{ts,js}` and equivalent
   framework route locations by filename and handler content.
4. Scan environment-variable usage such as `process.env.*<KEYWORD>*` in source
   files.
5. Check package dependencies and source imports for SDKs matching the
   keywords.
6. If `.a5c/reuse-audit.json` exists, use its scan globs and keyword extraction
   rules instead of hard-coding project assumptions.

When producing a plan, render this block before Phase 1:

```markdown
## Reuse-audit findings (REVIEW BEFORE PROCEEDING)

The following pre-existing infrastructure matches keywords from your prompt:

- **Migration**: `<path>` -- `<finding>`. Consider extending this instead of adding a duplicate.
- **Route**: `<path>` -- `<finding>`. Consider reusing or extending this route.
- **Env var**: `<NAME>` -- already used by `<path>`. Consider reusing it.
- **SDK**: `<package>` -- already declared or imported. Consider whether it can serve this feature.

If any of the above changes your plan, revise BEFORE Phase 1.
```

If the audit finds no matches, still include the heading with a brief "No
matching existing infrastructure found" note so reviewers know the pre-flight
ran. Draft the plan with the reuse-audit findings in context.

**Implementation-time orphan-file preflight**: In implementation tasks, before
an agent authors planned new files under `scripts/`, `supabase/migrations/`,
`src/server/`, or `src/lib/`, instruct it to check each exact path with `ls`
or `rg`/`grep`. If an exact planned new path already exists, the agent must
read the existing file, report findings to the orchestrator, and wait for
scope direction such as use-existing, replace, append, or renumber. Do not auto-resolve
existing-file collisions.

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
- wrong: using `kind: 'agent'` for deterministic verification (compilation,
  linting, test execution, grep checks, dependency validation) -- these MUST
  use `kind: 'shell'` with `expectedExitCode` for binary pass/fail enforcement
- correct: use `agent` or `skill` tasks for reasoning work (planning, code
  review, architecture assessment, subjective evaluation)
- correct: use `shell` tasks for all objectively verifiable checks (tsc, eslint,
  vitest, grep, dependency imports, runtime smoke tests)
- correct: include verification loops, refinement loops, quality gates, and
  breakpoints where appropriate
- correct: pair shell verification gates with agent analysis tasks (shell runs
  the check, agent interprets failures and suggests fixes)
- correct: for brownfield changes, trace the runtime call path from entry points
  to final output first, record as `runtimeCallPaths`, and scope modifications
  only to files on the live execution path (see ADVANCED_PATTERNS.md Pattern 9)

### Drift-resistant prompt composition (issue #129)

In multi-phase processes, your own attention is biased toward recently-built
implementation artifacts when you compose later-phase agent prompts. This
systematically rewrites spec acceptance criteria to match what got built --
e.g. "integration test with ReplicatedTransform sync" silently becomes "unit
test calling tick_projectile with MockWorld". All tests then pass (exit 0)
while testing the wrong thing. The defense is to keep spec bytes out of your
compose pass entirely.

**Runtime-read pattern (mandatory for spec-bearing prompts).** Never paraphrase
or inline spec text when authoring a prompt literal. Instead, read the spec
file at run time via a `kind: 'shell'` task and interpolate its stdout into
the downstream agent prompt verbatim:

```javascript
const spec = await ctx.task({
  kind: 'shell',
  command: `cat specs/projectile-sync.md`,
  expectedExitCode: 0,
});

await ctx.task({
  kind: 'agent',
  prompt: [
    'SPEC (verbatim, do not paraphrase):',
    '---',
    spec.stdout,
    '---',
    'Your task: author integration tests that exercise every acceptance',
    'criterion above. Cite spec lines in test names.',
  ].join('\n'),
});
```

The `cat` runs at execution time, so the spec content bypasses the process-
authoring compose pass where proximity bias operates. You only ever write the
`cat` line; the runtime pulls the spec bytes fresh from disk. This works for
any spec source (markdown, `bd show > /tmp/spec.md && cat /tmp/spec.md`,
issue body dumps, etc.).

**Recency-anchored verification prompts.** Verification/acceptance agent
prompts must end with two freshly-interpolated blocks -- a `SPEC (verbatim)`
block read via `cat`, followed by an `ARTIFACTS (verbatim)` block read via
`cat`/`git show` on the produced files -- followed by one line: "Compare
SPEC to ARTIFACTS directly. Ignore any narrative in your context about how
ARTIFACTS were built." Do not summarize either block. Put the spec last so
the verifier's own attention anchors on it.

**Test-authoring phase must precede implementation.** In any multi-phase
process with a verification/test gate, order the test-authoring phase before
the first implementation phase. Its agent prompt must use the runtime-read
pattern for the spec and must include: "Do not read files under
implementation directories. Author tests strictly from the spec text above."
The committed tests become frozen inputs to later implementation phases --
implementation cannot retroactively redefine what "correct" means. If the
spec is underspecified, this surfaces as "cannot author tests" at phase 1
rather than hiding as "tests that test the wrong thing" at phase 5.
