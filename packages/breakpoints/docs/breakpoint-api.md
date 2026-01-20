# Breakpoint CLI + API

Use the `breakpoints` CLI to communicate with the user. The CLI wraps the local
API. Never prompt directly.

## Base URL
- Default: `http://localhost:3000`
- Override with `BREAKPOINT_API_URL` if set.

## Auth
- Agent token: `AGENT_TOKEN`
- Human token: `HUMAN_TOKEN`
- Use `Authorization: Bearer <token>` when set.

## Create a breakpoint (agent)
```bash
breakpoints breakpoint create \
  --question "Approve process + inputs + main.js?" \
  --run-id run-... \
  --title "Approval needed" \
  --file ".a5c/runs/<runId>/artifacts/process.md,markdown" \
  --file ".a5c/runs/<runId>/inputs.json,code,json" \
  --file ".a5c/runs/<runId>/code/main.js,code,javascript"
```

## Poll for status
```bash
breakpoints breakpoint status <id>
```

## Fetch full details (including feedback)
```bash
breakpoints breakpoint show <id>
```

## Wait for release (prints details)
```bash
breakpoints breakpoint wait <id> --interval 3
```

## Fetch context file content (API)
```bash
curl -s "$BREAKPOINT_API_URL/api/breakpoints/<id>/context?path=path/to/file"
```

## Release with feedback (human)
```bash
curl -s -X POST "$BREAKPOINT_API_URL/api/breakpoints/<id>/feedback" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $HUMAN_TOKEN" \
  -d '{"author":"reviewer","comment":"approved","release":true}'
```

## Notes
- Poll every 2-10 seconds.
- Continue orchestration only after `status` becomes `released` and feedback is retrieved.
- Context files must be listed in the breakpoint payload and use allowlisted extensions.
