## Quick Commands Reference

**Create run (with session binding):**
```bash
$CLI run:create --process-id <id> --entry <path>#<export> --inputs <file> \
  --prompt "$PROMPT" --harness {{harness}}{{bindingFlags}} [--non-interactive] --json
```

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

**Iterate:**
```bash
$CLI run:iterate <runId> --json --iteration <n>{{iterateFlags}}
```
