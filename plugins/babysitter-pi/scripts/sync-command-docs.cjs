'use strict';

const path = require('path');
const {
  normalizeNewlines,
  reportCheckResult,
  writeFileIfChanged,
} = require('../../../scripts/plugin-command-sync-lib.cjs');

const PACKAGE_ROOT = path.resolve(__dirname, '..');
const COMMANDS_ROOT = path.join(PACKAGE_ROOT, 'commands');
const LABEL = 'babysitter-pi sync';

const COMMAND_DOCS = {
  'babysitter-call.md': `---
name: babysitter:call
description: Start a babysitter orchestration run
arguments:
  - name: prompt
    description: The task to orchestrate
    required: true
---

Start a babysitter orchestration run. Creates a new run using the SDK, binds it to the current session, and begins iteration.

This command initialises a fresh babysitter run with the given prompt, associates it with the active oh-my-pi session, and kicks off the first orchestration iteration. The loop driver will continue iterating automatically on subsequent \`agent_end\` events until the run completes, fails, or a guard trips.

## Usage

\`\`\`
/babysitter:call "build feature X"
/babysitter:call "refactor the auth module to use JWT"
\`\`\`

## Behaviour

1. Creates a new run via the SDK (\`createRun\`).
2. Binds the run to the current oh-my-pi session (\`bindRun\`).
3. Runs the first orchestration iteration (\`iterate\`).
4. Injects a continuation prompt if effects are pending.

## Implementation Notes

This command doc is the right place for low-level Babysitter runtime mechanics.
The top-level plugin README should stay at the \`/babysitter:*\` command surface.

- The command implementation may call raw Babysitter runtime primitives such as
  harness-aware \`run:create\`, iteration, status inspection, and result posting.
- Result values are written to \`tasks/<effectId>/output.json\` and then committed
  through \`task:post\`; the implementation must never write \`result.json\`
  directly.
- If the harness exposes a stronger native binding path than explicit session
  association, the implementation should prefer that path.

## Notes

- Only one run can be active per session. Starting a new run while one is active will replace it.
- The run directory defaults to \`BABYSITTER_RUNS_DIR\` (\`.a5c/runs\`).
- Use \`/babysitter:status\` to check progress and \`/babysitter:resume\` to pick up a stopped run.
`,
  'babysitter-resume.md': `---
name: babysitter:resume
description: Resume a previously stopped or interrupted babysitter run
arguments:
  - name: runId
    description: The run ID to resume
    required: true
---

Resume an existing babysitter orchestration run that was previously stopped, interrupted, or is in a waiting state. Re-binds the run to the current session and continues iteration from where it left off.

## Usage

\`\`\`
/babysitter:resume 01ABCDEF1234
\`\`\`

## Behaviour

1. Locates the run directory for the given run ID.
2. Reads run metadata and journal to determine current state.
3. Re-binds the run to the active oh-my-pi session.
4. Restores iteration count and timing state from the journal.
5. Runs the next orchestration iteration via the SDK.
6. Injects a continuation prompt if effects are still pending.

## Implementation Notes

This command doc can describe the low-level Babysitter runtime behavior that the
pi plugin hides from end users.

- Resume may use raw Babysitter replay, iteration, and session-binding
  primitives internally.
- If the harness has a native resume path, prefer that over an explicit
  fallback association flow.

## Notes

- The run must exist on disk in the configured runs directory (\`BABYSITTER_RUNS_DIR\`).
- Completed or failed runs cannot be resumed; use \`/babysitter:status\` to check state first.
- If another run is active for the current session, it will be replaced.
- The replay engine handles deterministic re-execution of previously resolved effects.
`,
  'babysitter-doctor.md': `---
name: babysitter:doctor
description: Diagnose the health of a babysitter run
arguments:
  - name: runId
    description: Optional run ID to diagnose (defaults to the active run)
    required: false
---

Run diagnostic checks against a babysitter run to identify potential issues. Inspects run metadata, journal integrity, state cache, lock files, and effect health.

## Usage

\`\`\`
/babysitter:doctor
/babysitter:doctor 01ABCDEF1234
\`\`\`

## Checks Performed

- **Run directory structure**: verifies that \`run.json\`, \`inputs.json\`, \`journal/\`, \`tasks/\`, and \`state/\` exist and are well-formed.
- **Journal integrity**: validates event checksums, ordering, and completeness. Detects gaps or duplicate sequence numbers.
- **State cache**: checks whether the state cache is current or needs rebuilding. Reports schema version mismatches.
- **Lock file**: detects stale \`run.lock\` files that may block iteration (e.g., from a crashed process).
- **Effect health**: identifies effects that have been pending longer than expected, effects with missing task definitions or result files, and orphaned blobs.
- **Guard status**: reports current iteration count vs. maximum, elapsed time vs. time limit, consecutive error count, and doom-loop detection state.
- **Disk usage**: reports total run directory size and identifies large blobs.

## Output

Each check reports one of:
- **OK**: the check passed
- **WARN**: a potential issue was detected that may not be blocking
- **FAIL**: a definite problem that needs attention

## Notes

- When called without arguments, diagnoses the run bound to the current session.
- Suggests remediation commands (e.g., \`run:repair-journal\`, \`run:rebuild-state\`) when issues are found.
- Does not modify any run state; this is a read-only diagnostic.

## Implementation Notes

This command doc is an appropriate place for low-level runtime inspection and
repair references. The plugin README should not tell end users to operate those
Babysitter primitives manually.
`,
  'babysitter-status.md': `---
name: babysitter:status
description: Check the status of the active babysitter run
arguments:
  - name: runId
    description: Optional run ID to check (defaults to the active run)
    required: false
---

Check the current status of a babysitter orchestration run. Displays run metadata, iteration count, pending and resolved effects, elapsed time, and current phase.

## Usage

\`\`\`
/babysitter:status
/babysitter:status 01ABCDEF1234
\`\`\`

## Output

- **Run ID** and **process ID**
- **Status**: idle, running, completed, or failed
- **Iteration count** and elapsed wall-clock time
- **Pending effects**: effects awaiting execution with their kind and title
- **Resolved effects**: effects that have been completed
- **Current phase**: the active orchestration phase (e.g., plan, execute, verify)
- **Quality score**: the most recent score value, if available

## Notes

- When called without arguments, reports on the run bound to the current session.
- When called with a run ID, the implementation may read status directly from
  the underlying Babysitter runtime.

## Implementation Notes

Raw Babysitter runtime inspection belongs here, not in the user-facing README.
If the command implementation shells out to Babysitter status or event APIs,
that is an internal harness detail.
`,
};

function main() {
  const check = process.argv.includes('--check');
  const stale = [];
  let updated = 0;

  for (const [fileName, expectedRaw] of Object.entries(COMMAND_DOCS)) {
    const targetPath = path.join(COMMANDS_ROOT, fileName);
    const expected = normalizeNewlines(expectedRaw);

    if (check) {
      const actual = require('fs').existsSync(targetPath)
        ? normalizeNewlines(require('fs').readFileSync(targetPath, 'utf8'))
        : null;
      if (actual !== expected) {
        stale.push(path.relative(PACKAGE_ROOT, targetPath));
      }
      continue;
    }

    if (writeFileIfChanged(targetPath, expected)) {
      updated += 1;
      console.log(`[${LABEL}] updated ${path.relative(PACKAGE_ROOT, targetPath)}`);
    }
  }

  if (check) {
    reportCheckResult(LABEL, stale);
    return;
  }

  if (updated === 0) {
    console.log(`[${LABEL}] no PI command doc changes were needed.`);
    return;
  }

  console.log(`[${LABEL}] updated ${updated} PI command doc file(s).`);
}

main();
