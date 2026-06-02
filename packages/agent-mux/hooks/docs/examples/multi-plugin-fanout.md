# Example: Multi-Plugin Fan-Out

Run multiple plugin hooks within a single native hook registration, with deterministic ordering and merged results.

---

## Use Case

You have multiple plugins that all need to run on `session.start`:

- A security plugin that sets up environment guards
- A logging plugin that initializes structured logging context
- An integration plugin that configures API tokens

Without the proxy, each would need a separate native hook registration, leading to race conditions, conflicting env writes, and non-deterministic ordering.

---

## Setup

### Handler Registry

Create `.a5c/hooks-registry.json`:

```json
[
  {
    "id": "security-bootstrap",
    "pluginId": "security-plugin",
    "phase": "session.start",
    "priority": 10,
    "handler": {
      "source": "./hooks/security-bootstrap.js",
      "handler": "handler"
    }
  },
  {
    "id": "logging-init",
    "pluginId": "logging-plugin",
    "phase": "session.start",
    "priority": 50,
    "handler": {
      "source": "./hooks/logging-init.js",
      "handler": "handler"
    }
  },
  {
    "id": "api-config",
    "pluginId": "api-plugin",
    "phase": "session.start",
    "priority": 100,
    "handler": {
      "source": "./hooks/api-config.js",
      "handler": "handler"
    }
  },
  {
    "id": "security-tool-guard",
    "pluginId": "security-plugin",
    "phase": "tool.before",
    "priority": 10,
    "handler": {
      "source": "./hooks/security-tool-guard.js",
      "handler": "handler"
    }
  }
]
```

### Hook Registration

In `.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "type": "command",
        "command": "npx -y @a5c-ai/agent-mux-hooks-cli invoke --adapter claude --native-event SessionStart"
      }
    ],
    "PreToolUse": [
      {
        "type": "command",
        "command": "npx -y @a5c-ai/agent-mux-hooks-cli invoke --adapter claude --native-event PreToolUse"
      }
    ]
  }
}
```

For Claude, pass the native hook name explicitly with `--native-event`. Claude's stdin payloads do not carry `event_name`, so this command shape is the supported contract.

---

## Handler Implementations

### `hooks/security-bootstrap.js`

```javascript
exports.handler = async function(event) {
  if (event.phase !== 'session.start') return { decision: 'noop' };

  return {
    decision: 'noop',
    persistEnv: {
      SECURITY_PLUGIN_ACTIVE: 'true',
      SECURITY_BLOCKED_COMMANDS: 'rm -rf /,format c:,dd if=/dev/zero',
    },
    additionalContext: 'Security plugin is active. Dangerous commands will be blocked.',
  };
};
```

### `hooks/logging-init.js`

```javascript
exports.handler = async function(event) {
  if (event.phase !== 'session.start') return { decision: 'noop' };

  return {
    decision: 'noop',
    persistEnv: {
      LOG_LEVEL: 'info',
      LOG_SESSION_ID: event.execution.sessionId ?? 'unknown',
    },
    contextVars: {
      'logging.initialized': 'true',
      'logging.start-time': new Date().toISOString(),
    },
  };
};
```

### `hooks/api-config.js`

```javascript
exports.handler = async function(event) {
  if (event.phase !== 'session.start') return { decision: 'noop' };

  // Can see env set by earlier handlers (security, logging)
  const securityActive = event.execution.persistedEnv.SECURITY_PLUGIN_ACTIVE === 'true';

  return {
    decision: 'noop',
    persistEnv: {
      API_BASE_URL: 'https://api.example.com',
      API_SECURITY_MODE: securityActive ? 'strict' : 'relaxed',
    },
  };
};
```

### `hooks/security-tool-guard.js`

```javascript
exports.handler = async function(event) {
  if (event.phase !== 'tool.before') return { decision: 'noop' };

  const toolName = event.execution.toolName;
  if (toolName !== 'Bash') return { decision: 'allow' };

  const command = String(event.payload.command ?? '');
  const blocked = (event.execution.persistedEnv.SECURITY_BLOCKED_COMMANDS ?? '').split(',');

  for (const pattern of blocked) {
    if (command.includes(pattern.trim())) {
      return {
        decision: 'deny',
        reason: `Command matches blocked pattern: ${pattern.trim()}`,
      };
    }
  }

  return { decision: 'allow' };
};
```

---

## Execution Flow

When a session starts:

1. The proxy reads the registry and finds 3 handlers for `session.start`
2. Handlers are sorted by priority: security (10) -> logging (50) -> api-config (100)
3. Each handler runs sequentially (ordered fan-out, not parallel)
4. Later handlers can see env/context set by earlier handlers
5. Results are merged:
   - `persistEnv`: key-wise merge (last writer wins for conflicts)
   - `additionalContext`: concatenated with `---` delimiters
   - `decision`: most restrictive wins
6. The merged result is rendered into Claude-native format
7. Session state is persisted

When a tool is used:

1. Only the `tool.before` handler (security-tool-guard) matches
2. It checks the command against the blocked patterns set during session start
3. Returns `deny` or `allow`

---

## Merge Behavior

The proxy applies these rules when merging results from multiple handlers:

| Field | Rule |
|-------|------|
| `persistEnv` | Key-wise merge; last writer wins |
| `unsetEnv` | Union |
| `contextVars` | Key-wise merge; last writer wins |
| `additionalContext` | Concatenate in order |
| `systemMessage` | Concatenate (or keep first, per adapter) |
| `decision` | Most restrictive wins |
| `continueSession` | `false` dominates |
| `toolMutation` | Single writer only |

---

## Diagnostics

The proxy emits structured diagnostics during fan-out. Check handler order and merge decisions:

```bash
# Enable debug logging
AGENT_HOOKS_LOG_LEVEL=debug npx -y @a5c-ai/agent-mux-hooks-cli invoke --adapter claude --native-event SessionStart

# Enable trace file
AGENT_HOOKS_TRACE_FILE=./trace.jsonl npx -y @a5c-ai/agent-mux-hooks-cli invoke --adapter claude --native-event SessionStart
```
