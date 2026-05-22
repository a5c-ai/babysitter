### 2. Create run and bind session:

If an existing bare run is reported in the **Existing Run State** section above,
use `run:assign-process` (see below) instead of creating a new run.

**For new runs:**

```bash
$CLI run:create \
  --process-id <id> \
  --entry <absolute-path>#<export> \
  --inputs <file> \
  --prompt "$PROMPT" \
  --harness {{harness}} \{{bindingFlagsLine}}
  --json
```

{{requiredFlagsList}}

**Optional flags:**
- `--inputs <file>` -- path to a JSON file with process inputs
- `--run-id <id>` -- override auto-generated run ID
- `--runs-dir <dir>` -- advanced compatibility override for the runs directory (default: `~/.a5c/runs`, or `<repo>/.a5c/runs` when `BABYSITTER_RUNS_SCOPE=repo`)
- `--non-interactive` -- auto-approve breakpoints without human interaction (yolo mode)

{{sessionIdNote}}

**Common mistakes to avoid:**
- wrong: Calling `session:init` explicitly
- wrong: Fabricating a session ID when none is available from the environment
{{mistakeHarnessNote}}

**For resuming existing runs:**

```bash
$CLI session:resume \
  --session-id <id> \{{resumeFlagsLine}}
  --run-id <runId> --json
```

**For assigning a process to an existing bare run:**

When the session-start hook has already created a bare run (no `--entry`), use
`run:assign-process` to attach the process definition, then bind the session:

```bash
# 1. Assign the process to the bare run
$CLI run:assign-process <runDir> \
  --entry <absolute-path>#<export> \
  --process-id <id> \
  --json

# 2. Bind the session to the run (if not already bound by session-start)
$CLI session:associate \
  --session-id <id> \
  --run-id <runId> \
  --state-dir <stateDir> \
  --json
```

**Required arguments:**
- `<runDir>` — path to the existing run directory (positional)
- `--entry <path>#<export>` — path to the process JS file and its named export

**Optional flags:**
- `--process-id <id>` — override the process identifier stored in the run (defaults to the existing `processId` from the bare run)
- `--process-revision <rev>` — pin a specific process revision
- `--force` — allow re-assigning even if the run already has a process
- `--dry-run` — validate without writing changes
- `--json` — emit machine-readable JSON output
- `--verbose` — log resolved paths and options to stderr

This command rejects if the run already has a process assigned unless `--force` is
passed. On success it updates `run.json` and appends a `PROCESS_ASSIGNED` journal
event to the run.

**Common mistakes to avoid:**
- wrong: Always creating a new run when a bare run already exists from session-start
- correct: Check `.a5c/runs/` for existing bare runs and use `run:assign-process`
- wrong: Skipping `run:assign-process` and calling `run:iterate` on a bare run (will fail)
