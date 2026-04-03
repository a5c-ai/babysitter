'use strict';

const path = require('path');
const {
  normalizeNewlines,
  reportCheckResult,
  writeFileIfChanged,
} = require('../../../scripts/plugin-command-sync-lib.cjs');

const PACKAGE_ROOT = path.resolve(__dirname, '..');
const COMMANDS_ROOT = path.join(PACKAGE_ROOT, 'commands');
const LABEL = 'babysitter-omp sync';

const HARNESS_LABEL = 'oh-my-pi';
const TROUBLESHOOT_CMD = 'where omp';

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

This command initialises a fresh babysitter run with the given prompt, associates it with the active ${HARNESS_LABEL} session, and kicks off the first orchestration iteration. The loop driver will continue iterating automatically on subsequent \`agent_end\` events until the run completes, fails, or a guard trips.
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

## Behaviour

1. Locates the run directory for the given run ID.
2. Reads run metadata and journal to determine current state.
3. Re-binds the run to the active ${HARNESS_LABEL} session.
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
`,
  'babysitter-status.md': `---
name: babysitter:status
description: Check the status of the active babysitter run
arguments:
  - name: runId
    description: Optional run ID to check (defaults to the active run)
    required: false
---

Check the current status of a babysitter orchestration run.

## Notes

- When called without arguments, reports on the run bound to the current session.
- If discovery reports \`${HARNESS_LABEL}\` as installed but direct invocation fails, validate \`${TROUBLESHOOT_CMD}\`.
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
    console.log(`[${LABEL}] no OMP command doc changes were needed.`);
    return;
  }

  console.log(`[${LABEL}] updated ${updated} OMP command doc file(s).`);
}

main();
