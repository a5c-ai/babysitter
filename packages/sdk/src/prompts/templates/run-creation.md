### 2. Create run and bind session (single command):

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
- `--runs-dir <dir>` -- override runs directory (default: `.a5c/runs`)
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
  --run-id <runId> --runs-dir .a5c/runs --json
```
