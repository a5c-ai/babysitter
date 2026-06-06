# Memory Provider Plugins

> Source: https://hermes-agent.nousresearch.com/docs/developer-guide/memory-provider-plugin

## Overview

Memory provider plugins extend Hermes Agent with persistent, cross-session knowledge capabilities beyond the built-in MEMORY.md and USER.md files. These are "provider plugin" types that follow a single-select, config-driven pattern managed via `hermes plugins`.

## Directory Structure

Memory providers reside in `plugins/memory/<name>/`:

```
plugins/memory/my-provider/
  __init__.py      # MemoryProvider implementation + register() entry point
  plugin.yaml      # Metadata (name, description, hooks)
  cli.py           # Optional: register_cli(subparser) -- CLI commands
  README.md        # Setup instructions, config reference, tools
```

## Core Implementation

### The MemoryProvider ABC

Plugins implement `MemoryProvider` from `agent/memory_provider.py`:

```python
from agent.memory_provider import MemoryProvider

class MyMemoryProvider(MemoryProvider):
    @property
    def name(self) -> str:
        return "my-provider"

    def is_available(self) -> bool:
        """Check if this provider can activate. NO network calls."""
        return bool(os.environ.get("MY_API_KEY"))

    def initialize(self, session_id: str, **kwargs) -> None:
        """Called once at agent startup.
        kwargs always includes:
          hermes_home (str): Active HERMES_HOME path. Use for storage.
        """
        self._api_key = os.environ.get("MY_API_KEY", "")
        self._session_id = session_id
```

### Required Methods

**Core Lifecycle:**

| Method | When Called | Must Implement? |
|--------|------------|-----------------|
| `name` (property) | Always | **Yes** |
| `is_available()` | Agent init, before activation | **Yes** -- no network calls |
| `initialize(session_id, **kwargs)` | Agent startup | **Yes** |
| `get_tool_schemas()` | After init, for tool injection | **Yes** |
| `handle_tool_call(tool_name, args, **kwargs)` | When agent uses your tools | **Yes** (if you have tools) |

**Config:**

| Method | Purpose | Must Implement? |
|--------|---------|-----------------|
| `get_config_schema()` | Declare config fields for `hermes memory setup` | **Yes** |
| `save_config(values, hermes_home)` | Write non-secret config to native location | **Yes** (unless env-var-only) |

**Optional Hooks:**

| Method | When Called | Use Case |
|--------|------------|----------|
| `system_prompt_block()` | System prompt assembly | Static provider info |
| `prefetch(query, *, session_id="")` | Before each API call | Return recalled context |
| `queue_prefetch(query)` | After each turn | Pre-warm for next turn |
| `sync_turn(user, assistant, *, session_id="")` | After each completed turn | Persist conversation |
| `on_session_end(messages)` | Conversation ends | Final extraction/flush |
| `on_pre_compress(messages)` | Before context compression | Save insights before discard |
| `on_memory_write(action, target, content)` | Built-in memory writes | Mirror to your backend |
| `shutdown()` | Process exit | Clean up connections |

## Configuration

### Config Schema

The `get_config_schema()` method returns field descriptors for `hermes memory setup`:

```python
def get_config_schema(self):
    return [
        {
            "key": "api_key",
            "description": "My Provider API key",
            "secret": True,           # written to .env
            "required": True,
            "env_var": "MY_API_KEY",   # explicit env var name
            "url": "https://my-provider.com/keys",  # where to get it
        },
        {
            "key": "region",
            "description": "Server region",
            "default": "us-east",
            "choices": ["us-east", "eu-west", "ap-south"],
        },
        {
            "key": "project",
            "description": "Project identifier",
            "default": "hermes",
        },
    ]
```

**Best Practice:** Keep schemas minimal -- only prompt for essential settings (API keys, credentials). Document optional settings in config files referenced in README rather than adding to setup prompts.

### Save Config

```python
def save_config(self, values: dict, hermes_home: str) -> None:
    """Write non-secret config to your native location."""
    import json
    from pathlib import Path
    config_path = Path(hermes_home) / "my-provider.json"
    config_path.write_text(json.dumps(values, indent=2))
```

For environment-variable-only providers, leave the default no-op.

## Plugin Registration

### Entry Point

```python
def register(ctx) -> None:
    """Called by the memory plugin discovery system."""
    ctx.register_memory_provider(MyMemoryProvider())
```

### plugin.yaml

```yaml
name: my-provider
version: 1.0.0
description: "Short description of what this provider does."
hooks:
  - on_session_end    # list hooks you implement
```

## Threading Contract

The `sync_turn()` method **must be non-blocking**. Run backend latency work in daemon threads:

```python
def sync_turn(self, user_content, assistant_content, *, session_id="", messages=None):
    def _sync():
        try:
            self._api.ingest(user_content, assistant_content,
                            session_id=session_id, messages=messages)
        except Exception as e:
            logger.warning("Sync failed: %s", e)

    if self._sync_thread and self._sync_thread.is_alive():
        self._sync_thread.join(timeout=5.0)
    self._sync_thread = threading.Thread(target=_sync, daemon=True)
    self._sync_thread.start()
```

The `messages` parameter includes OpenAI-style conversation context: user/assistant messages, tool calls, and results. Cloud providers must document which message parts transmit off-device.

## Profile Isolation

All storage paths must use the `hermes_home` kwarg from `initialize()`:

```python
# CORRECT -- profile-scoped
from hermes_constants import get_hermes_home
data_dir = get_hermes_home() / "my-provider"

# WRONG -- shared across all profiles
data_dir = Path("~/.hermes/my-provider").expanduser()
```

## Testing

```python
from agent.memory_manager import MemoryManager

mgr = MemoryManager()
mgr.add_provider(my_provider)
mgr.initialize_all(session_id="test-1", platform="cli")

# Test tool routing
result = mgr.handle_tool_call("my_tool", {"action": "add", "content": "test"})

# Test lifecycle
mgr.sync_all("user msg", "assistant msg")
mgr.on_session_end([])
mgr.shutdown_all()
```

Reference test patterns: `tests/agent/test_memory_provider.py`, `tests/agent/test_memory_session_switch.py`, `tests/agent/test_memory_user_id.py`, `tests/run_agent/test_memory_provider_init.py`

## CLI Commands

Memory provider plugins can register custom CLI subcommands via convention-based discovery (no core file changes needed).

### Implementation

1. Add a `cli.py` file to the plugin directory
2. Define a `register_cli(subparser)` function building the argparse tree
3. The system discovers it at startup via `discover_plugin_cli_commands()`
4. Commands appear under `hermes <provider-name> <subcommand>`

**Active-provider gating:** CLI commands only appear when your provider is the active `memory.provider` in config.

## Constraints

**Single Provider Rule:** Only one external memory provider can be active at a time. Attempting to register a second triggers a MemoryManager warning, preventing tool schema bloat and backend conflicts.
