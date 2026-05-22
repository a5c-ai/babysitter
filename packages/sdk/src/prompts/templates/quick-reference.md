## Quick Commands Reference

**Create run (with session binding):**
```bash
$CLI run:create --process-id <id> --entry <path>#<export> --inputs <file> \
  --prompt "$PROMPT" --harness {{harness}}{{bindingFlags}} [--non-interactive] --json
```

`--harness` binds the run to the current session via the **PID-scoped session
marker** (authoritative) written by the session-start hook. The harness env
file and `AGENT_SESSION_ID` env var are only consulted as fallbacks, so
runs stay bound to the correct session even when env vars are stale or
inherited across shells. Verify with `babysitter session:whoami --json`.

**Check status:**
```bash
$CLI run:status <runId> --json
```

When the run completes, `run:iterate` and `run:status` emit `completionProof`.
Use that exact value in a `<promise>...</promise>` tag to end the loop.

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

**Assign process to bare run:**
```bash
$CLI run:assign-process <runDir> --entry <path>#<export> [--process-id <id>] [--json]
```

**Iterate:**
```bash
$CLI run:iterate <runId> --json --iteration <n>{{iterateFlags}}
```
