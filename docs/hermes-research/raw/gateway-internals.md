# Gateway Internals

> Source: https://hermes-agent.nousresearch.com/docs/developer-guide/gateway-internals

## Key Files

| File | Purpose |
|------|---------|
| `gateway/run.py` | Main loop, slash commands, message dispatch |
| `gateway/session.py` | Conversation persistence and session key construction |
| `gateway/delivery.py` | Outbound message delivery to target platforms |
| `gateway/pairing.py` | DM pairing flow for user authorization |
| `gateway/channel_directory.py` | Maps chat IDs to human-readable names |
| `gateway/hooks.py` | Hook discovery, loading, lifecycle dispatch |
| `gateway/mirror.py` | Cross-session message mirroring |
| `gateway/status.py` | Token lock management for gateway instances |
| `gateway/platforms/` | Platform adapters (one per messaging platform) |

## Architecture Overview

The messaging gateway connects Hermes to 20+ external messaging platforms through platform adapters that normalize events into a unified `MessageEvent` format. All adapters route through a central `GatewayRunner` that handles authorization, session management, and command dispatch.

## Message Flow

When a message arrives:

1. Platform adapter normalizes raw event into `MessageEvent`
2. Base adapter checks active session guard (queues if agent running)
3. `GatewayRunner._handle_message()` resolves session key via format: `agent:main:{platform}:{chat_type}:{chat_id}`
4. Authorization checks are performed
5. Slash commands are dispatched to handlers
6. Running agent checks intercept commands like `/stop`
7. Response sent back through platform adapter

## Two-Level Message Guard

**Level 1 -- Base adapter**: Checks `_active_sessions`; if active, queues message and sets interrupt event.

**Level 2 -- Gateway runner**: Checks `_running_agents`; intercepts specific commands (`/stop`, `/new`, `/queue`, `/status`, `/approve`, `/deny`) for appropriate routing.

Commands reaching the runner while agent is blocked are dispatched inline via `await self._message_handler(event)` to avoid race conditions.

## Authorization

Multi-layer checks evaluated in order:

1. Per-platform allow-all flag (e.g., `TELEGRAM_ALLOW_ALL_USERS`)
2. Platform allowlist (e.g., `TELEGRAM_ALLOWED_USERS`)
3. DM pairing (authenticated users pair new users)
4. Global allow-all (`GATEWAY_ALLOW_ALL_USERS`)
5. Default: deny

### DM Pairing Flow

Admin initiates with `/pair`, gateway generates code (e.g., "ABC123"), new user shares code, gateway confirms pairing and authorizes user. Pairing state persists in `gateway/pairing.py`.

## Slash Command Dispatch

1. `resolve_command()` maps input to canonical name (handles aliases)
2. Canonical name checked against `GATEWAY_KNOWN_COMMANDS`
3. Handler dispatches based on canonical name
4. Some commands gated on config via `gateway_config_gate`

Running agents reject non-bypass commands early with message: "Agent is running -- wait or `/stop` first."

## Config Sources

| Source | Provides |
|--------|----------|
| `~/.hermes/.env` | API keys, bot tokens, credentials |
| `~/.hermes/config.yaml` | Model settings, tool config, display options |
| Environment variables | Overrides for above |

Gateway reads `config.yaml` directly via YAML loader, unlike CLI which uses hardcoded defaults.

## Platform Adapters

20+ adapters in `gateway/platforms/` including Telegram, Discord, Slack, WhatsApp, Signal, Matrix, Email, SMS, Mattermost, and others.

Common interface:
- `connect()` / `disconnect()` -- lifecycle management
- `send_message()` -- outbound delivery
- `on_message()` -- inbound normalization

### Token Locks

Adapters with unique credentials call `acquire_scoped_lock()` in `connect()` and `release_scoped_lock()` in `disconnect()` to prevent concurrent profile access with same bot token.

## Delivery Path

Handles:
- Direct reply to originating chat
- Home channel delivery for cron/background results
- Explicit target delivery via `send_message` tool
- Cross-platform delivery

Cron deliveries intentionally not mirrored into gateway session history.

## Hooks

Python modules responding to lifecycle events discovered from `gateway/builtin_hooks/` and `~/.hermes/hooks/`. Each hook has `HOOK.yaml` manifest and `handler.py`.

### Hook Events

`gateway:startup`, `session:start`, `session:end`, `session:reset`, `agent:start`, `agent:step`, `agent:end`, `command:*`

## Memory Provider Integration

When memory provider enabled: gateway creates `AIAgent` per message, `MemoryManager` initializes provider, provider tools routed through `AIAgent._invoke_tool()`, on session end/reset `on_session_end()` fires for cleanup.

## Process Management

Gateway runs long-lived via:
- `hermes gateway start` / `hermes gateway stop` -- manual control
- `systemctl` (Linux) or `launchctl` (macOS) -- service management
- PID file at `~/.hermes/gateway.pid` -- profile-scoped tracking

Profile-scoped processes allow independent gateway instances; `--all` flag kills all profiles.
