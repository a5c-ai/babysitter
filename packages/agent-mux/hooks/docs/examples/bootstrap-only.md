# Example: Bootstrap-Only Mode

Initialize session context without running any hook logic. Useful when you need session state and env propagation set up before any real hook handlers are registered.

---

## Use Case

You want to:
- Ensure `AGENT_SESSION_ID` is available for downstream tools
- Initialize the session store for later hook invocations
- Set up baseline context without custom hook logic
- Prepare for plugins that will be added later

---

## Claude Code Setup

In `.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "type": "command",
        "command": "npx -y @a5c-ai/agent-mux-hooks-cli invoke --adapter claude --native-event SessionStart --bootstrap-only"
      }
    ]
  }
}
```

Or use the dedicated bootstrap command:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "type": "command",
        "command": "npx -y @a5c-ai/agent-mux-hooks-cli bootstrap --adapter claude"
      }
    ]
  }
}
```

For Claude, the dedicated `bootstrap` command is supported specifically as a native
`SessionStart` hook target. Claude sends the same stdin payload to this command, so
`hooks-mux bootstrap --adapter claude` resolves the native Claude `session_id` the
same way `invoke --bootstrap-only` does.

---

## Codex Setup

```bash
npx -y @a5c-ai/agent-mux-hooks-cli invoke --adapter codex --bootstrap-only
```

---

## What Happens

When bootstrap-only mode runs:

1. The adapter resolves the session ID from the harness-native payload
2. If no session exists, a new one is created with baseline state
3. `AGENT_SESSION_ID` is stored in the session's persisted env baseline
4. The session is persisted to the session store
5. If the adapter has a usable native propagation channel for that invocation, `AGENT_SESSION_ID` is propagated
6. A valid success result is returned to the harness
7. No user-provided handlers are executed

For Claude, both `invoke --bootstrap-only` and `bootstrap --adapter claude` read the
native hook stdin payload and resolve the session from Claude's native `session_id`.
When Claude provides `CLAUDE_ENV_FILE`, both commands append `AGENT_SESSION_ID` there.
If `CLAUDE_ENV_FILE` is absent for a given invocation, the session is still persisted
and later `invoke` or `exec` calls can rehydrate it from the session store.

---

## Verifying the Bootstrap

After a bootstrap hook has run, verify with:

```bash
# Check the session was created
a5c-hooks-mux show-session --session-id "$AGENT_SESSION_ID"

# Run doctor to check session store health
a5c-hooks-mux doctor --json
```

---

## Adding Handlers Later

Once bootstrap is working, add handlers by switching to a registry:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "type": "command",
        "command": "npx -y @a5c-ai/agent-mux-hooks-cli invoke --adapter claude --native-event SessionStart"
      }
    ]
  }
}
```

The registry can include handlers that depend on the session context initialized by earlier invocations.
