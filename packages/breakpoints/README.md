# Breakpoint Manager

Lightweight breakpoint manager with API, queue worker, and web UI.

This package now lives at `packages/breakpoints`.

## Requirements
- Node.js 18+

## Setup
```bash
cd packages/breakpoints
npm install
npm run init:db
```

## Run (dev)
```bash
cd packages/breakpoints
npm run dev
```

## Run (installed CLI)
```bash
breakpoints start
```

Or run separately:
```bash
npm run start:api
npm run start:worker
```

## CLI Examples
Start the full system (API + web UI + worker):
```bash
breakpoints start
```

Create a breakpoint (agent):
```bash
breakpoints breakpoint create --question "Need approval?" --title "Approval"
```

Check status:
```bash
breakpoints breakpoint status <id>
```

Wait for release:
```bash
breakpoints breakpoint wait <id> --interval 3
```

## Configuration
Environment variables:
- `PORT` (default 3185)
- `WEB_PORT` (default 3184)
- `DB_PATH` (default `~/.a5c/breakpoints/db/breakpoints.db`)
- `REPO_ROOT` (default package root / current working directory)
- `AGENT_TOKEN` (optional)
- `HUMAN_TOKEN` (optional)
- `WORKER_POLL_MS` (default 2000)
- `WORKER_BATCH_SIZE` (default 10)

## API Examples
Create breakpoint (agent):
```bash
curl -X POST http://localhost:3185/api/breakpoints \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AGENT_TOKEN" \
  -d '{"agentId":"agent-1","title":"Need review","payload":{"summary":"check this"},"tags":["review"],"ttlSeconds":3600}'
```

Check status:
```bash
curl http://localhost:3185/api/breakpoints/<id>/status
```

Release with feedback (human):
```bash
curl -X POST http://localhost:3185/api/breakpoints/<id>/feedback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $HUMAN_TOKEN" \
  -d '{"author":"reviewer","comment":"Looks good","release":true}'
```

## Breakpoint Context Payload
To enable context rendering in the UI, include a `context.files` array in the
breakpoint payload:
```json
{
  "context": {
    "runId": "run-...",
    "files": [
      { "path": "docs/plan.md", "format": "markdown" },
      { "path": "api/routes.js", "format": "code", "language": "javascript" }
    ]
  }
}
```

The API serves file content via:
```
GET /api/breakpoints/:id/context?path=path/to/file
```
Only allowlisted extensions are served, and the file must be listed in the
breakpoint payload.

## Web UI
Open `http://localhost:3184` and provide the human token in the UI.

## Telegram Extension

The Telegram extension allows you to receive breakpoint notifications and interact with them via Telegram.

### Setup
1. Create a Telegram bot via [@BotFather](https://t.me/botfather)
2. Get your bot token
3. Configure the extension:
```bash
breakpoints extension enable telegram --token <bot-token> --username <your-username>
```

### Features

**Automatic Notifications:**
- Receive notification when a new breakpoint is created
- Get notified when a breakpoint is released

**Connection:**
Send any slash command (e.g., `/start`) to your bot to connect. The bot will:
- Confirm connection
- Show all waiting breakpoints with titles, IDs, run IDs, and questions
- Provide instructions for interacting with breakpoints

**Commands:**
- `list` (or `ls`, `waiting`) - Show all waiting breakpoints
- `preview <number>` (or `show <number>`) - View full details of a breakpoint
- `file <number>` - Download a context file by its number
- `file <path>` - Download a context file by its path
- `raw <path>` - View file inline with syntax highlighting (if short enough)

**Releasing Breakpoints:**
- Reply to any breakpoint message to release it
- Send the breakpoint ID to release it
- Send any text message to release the most recent breakpoint

**Example Workflow:**
```
You: /start
Bot: Telegram connected. I will notify you about breakpoints here.

     🔔 You have 2 waiting breakpoints:

     1. Approve refactoring plan
        ID: abc-123
        Run: run-20260120-refactor
        Created: 5 mins ago
        Question: Should I proceed with this refactoring?

     2. Review API changes
        ID: def-456
        Run: run-20260120-api
        Created: 2 mins ago
        Question: Are these API changes acceptable?

You: preview 1
Bot: [Shows full details including all context files]

You: file 1
Bot: [Sends the first context file as document]

You: Looks good, proceed!
Bot: ✅ Breakpoint released
     ID: abc-123
     Feedback: Looks good, proceed!
```

## Breakpoint CLI (agent-friendly)
Create a breakpoint:
```bash
breakpoints breakpoint create \
  --question "Approve process + inputs + main.js?" \
  --run-id run-123 \
  --title "Approval needed" \
  --file ".a5c/runs/run-123/artifacts/process.md,markdown" \
  --file ".a5c/runs/run-123/inputs.json,code,json" \
  --file ".a5c/runs/run-123/code/main.js,code,javascript"
```

Wait for release (prints full details when released):
```bash
breakpoints breakpoint wait <id> --interval 3
```

## Notes
- Tags are stored as JSON in SQLite; tag filtering uses a simple string match.
- The queue worker processes TTL expiration jobs; notification jobs are stubbed.
