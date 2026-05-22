# Example: Wrapped Command Execution

Use the `exec` command to run downstream commands with session context injected, even on harnesses that do not support native env persistence.

---

## Use Case

Your hooks persist environment variables and context, but the harness does not natively propagate those to tool subprocesses. You need downstream commands to see the session context.

This is especially relevant for:
- Gemini CLI (wrapper-only env persistence)
- GitHub Copilot (wrapper-only env persistence)
- Cursor (no env persistence)
- Any harness where env persistence mode is `wrapper_only` or `none`

---

## Basic Usage

```bash
# Run npm test with session context restored
a5c-hooks-mux exec --session-id "$AGENT_SESSION_ID" -- npm test

# Run a custom script with session env
a5c-hooks-mux exec --session-id "$AGENT_SESSION_ID" -- node scripts/deploy.js

# Run a shell command
a5c-hooks-mux exec --session-id "$AGENT_SESSION_ID" -- bash -c "echo $MY_PLUGIN_VAR"
```

---

## How It Works

1. **Load session** -- the proxy reads the session file for the given session ID from the session store
2. **Materialize env** -- all `persistedEnv` entries from the session are loaded into memory
3. **Enrich environment** -- the target command's environment is augmented with the persisted variables
4. **Execute** -- the target command is spawned as a child process with the enriched environment

The command inherits:
- All current process environment variables
- All persisted env from the session store (overriding any same-named vars)
- `AGENT_SESSION_ID` set to the session ID

---

## Setup Example: Gemini CLI

### Hook Registration

In your Gemini extension config:

```json
{
  "hooks": {
    "onSessionStart": "npx -y @a5c-ai/hooks-mux invoke --adapter gemini"
  }
}
```

### Handler That Sets Env

```javascript
// hooks/setup-env.js
exports.handler = async function(event) {
  if (event.phase !== 'session.start') return { decision: 'noop' };

  return {
    persistEnv: {
      DATABASE_URL: 'postgres://localhost:5432/mydb',
      API_KEY: process.env.MY_API_KEY ?? '',
      DEPLOY_TARGET: 'staging',
    },
  };
};
```

### Using exec for Downstream Commands

Since Gemini's env persistence is `wrapper_only`, downstream tool processes will not see `DATABASE_URL` etc. unless wrapped:

```bash
# Instead of:
npm run migrate

# Use:
a5c-hooks-mux exec --session-id "$AGENT_SESSION_ID" -- npm run migrate
```

---

## Integration with Tool Hooks

You can combine `exec` with tool hooks. For example, a `tool.before` hook could rewrite commands to use the wrapper:

```javascript
// hooks/wrap-commands.js
exports.handler = async function(event) {
  if (event.phase !== 'tool.before') return { decision: 'noop' };
  if (event.execution.toolName !== 'Bash') return { decision: 'noop' };

  const originalCommand = String(event.payload.command ?? '');
  const sessionId = event.execution.sessionId;

  if (!sessionId) return { decision: 'noop' };

  // Wrap the command with exec to inject session context
  return {
    decision: 'allow',
    toolMutation: {
      mode: 'replace',
      value: {
        command: `npx -y @a5c-ai/hooks-mux exec --session-id "${sessionId}" -- ${originalCommand}`,
      },
    },
  };
};
```

Note: Tool mutation is only supported on adapters with `supportsToolInputMutation: true`. Check the adapter capabilities with `a5c-hooks-mux doctor`.

---

## Verifying Context Propagation

To verify that session context is being properly injected:

```bash
# Check what env would be materialized
a5c-hooks-mux show-session --session-id "$AGENT_SESSION_ID" --json

# Test exec with a simple env dump
a5c-hooks-mux exec --session-id "$AGENT_SESSION_ID" -- env | grep MY_PLUGIN
```

---

## Limitations

- **Performance**: Each `exec` invocation reads the session file from disk. For high-frequency tool calls, this adds I/O overhead.
- **Atomicity**: If a hook updates the session concurrently with an `exec` call, the exec may see stale state. This is acceptable for most use cases.
- **Security**: Persisted env values are stored in plain text in the session file. Do not persist secrets that should not be on disk.
