# ACP Internals

> Source: https://hermes-agent.nousresearch.com/docs/developer-guide/acp-internals

## Architecture Overview

The ACP adapter implements a wrapper layer that "converts Hermes' synchronous `AIAgent` into an async JSON-RPC stdio server." This enables editor integration through a standardized protocol.

## Boot Sequence

The startup flow progresses through:
- Entry point invocation (`acp_adapter.entry.main()`)
- Version/configuration parsing
- Environment loading from `~/.hermes/.env`
- `HermesACPAgent` construction
- Server initialization with `acp.run_agent()`

Notably, "stdout is reserved for ACP JSON-RPC transport" while human-readable diagnostics route to stderr.

## Core Components

**HermesACPAgent** (`acp_adapter/server.py`)
Manages protocol implementation with responsibilities including session creation, prompt execution, and model switching. It bridges synchronous AI callbacks to asynchronous ACP notifications.

**SessionManager** (`acp_adapter/session.py`)
Maintains thread-safe session state including:
- Session identifiers and agent instances
- Working directory and model configuration
- Message history and cancellation signals

**Event Bridge** (`acp_adapter/events.py`)
Translates three callback types into ACP updates:
- Tool progress notifications
- Step execution events
- Reasoning/thinking signals

The bridge uses `asyncio.run_coroutine_threadsafe()` to coordinate between the worker thread running the AI agent and the main event loop.

**Permission System** (`acp_adapter/permissions.py`)
Maps approval prompts to ACP permission requests: `allow_once` -> once, `allow_always` -> always, with timeout/failure defaulting to denial.

## Session Management

Sessions persist to `~/.hermes/state.db` and restore across process restarts. The system supports:
- Creating new sessions with specified working directories
- Forking sessions by deep-copying message history
- Cancellation via interrupt signals
- FIFO tool tracking for parallel identical-name calls

**Working Directory Binding**: Sessions carry editor workspace context through task-scoped terminal/file overrides.

## Authentication

Rather than implementing custom auth, the adapter "reuses Hermes' runtime resolver," advertising the currently configured provider credentials and offering an interactive setup method for first-run registry clients.

## Implementation Files

Core modules: `entry.py`, `server.py`, `session.py`, `events.py`, `permissions.py`, `tools.py`, `auth.py`, plus test suite at `tests/acp/` and toolset definition in `toolsets.py`.
