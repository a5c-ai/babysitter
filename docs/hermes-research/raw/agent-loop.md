# Agent Loop Internals

> Source: https://hermes-agent.nousresearch.com/docs/developer-guide/agent-loop

## Core Responsibilities

The `AIAgent` class in `run_agent.py` (~4,400 lines) orchestrates the agent's core operations:

- Assembling system prompts and tool schemas via `prompt_builder.py`
- Selecting the appropriate provider/API mode
- Making interruptible model calls with cancellation support
- Executing tool calls sequentially or concurrently
- Maintaining conversation history in OpenAI message format
- Handling compression, retries, and fallback model switching
- Tracking iteration budgets across parent and child agents
- Flushing persistent memory before context loss

## Two Entry Points

```python
# Simple interface -- returns final response string
response = agent.chat("Fix the bug in main.py")

# Full interface -- returns dict with messages, metadata, usage stats
result = agent.run_conversation(
    user_message="Fix the bug in main.py",
    system_message=None,           # auto-built if omitted
    conversation_history=None,      # auto-loaded from session if omitted
    task_id="task_abc123")
```

`chat()` wraps `run_conversation()` and extracts the `final_response` field.

## API Modes

Three execution modes resolve from provider selection, explicit arguments, and base URL heuristics:

| API Mode | Used For | Client Type |
|----------|----------|-------------|
| `chat_completions` | OpenAI-compatible endpoints | `openai.OpenAI` |
| `codex_responses` | OpenAI Codex/Responses API | `openai.OpenAI` |
| `anthropic_messages` | Native Anthropic API | `anthropic.Anthropic` |

**Resolution order:**
1. Explicit `api_mode` constructor arg (highest priority)
2. Provider-specific detection
3. Base URL heuristics
4. Default: `chat_completions`

## Turn Lifecycle

Each iteration follows this sequence:

```
1. Generate task_id if not provided
2. Append user message to conversation history
3. Build or reuse cached system prompt
4. Check if preflight compression needed (>50% context)
5. Build API messages from conversation history
6. Inject ephemeral prompt layers (budget warnings, context pressure)
7. Apply prompt caching markers if on Anthropic
8. Make interruptible API call
9. Parse response:
   - Tool calls: execute, append results, loop back to step 5
   - Text response: persist session, flush memory, return
```

### Message Format

All messages use OpenAI-compatible format internally:

```json
{"role": "system", "content": "..."}
{"role": "user", "content": "..."}
{"role": "assistant", "content": "...", "tool_calls": [...]}
{"role": "tool", "tool_call_id": "...", "content": "..."}
```

Reasoning content is stored in `assistant_msg["reasoning"]` and displayed via callbacks.

### Message Alternation Rules

- After system message: `User -> Assistant -> User -> Assistant -> ...`
- During tool calling: `Assistant (with tool_calls) -> Tool -> Tool -> ... -> Assistant`
- Never two consecutive assistant messages
- Never two consecutive user messages
- Only `tool` role can have consecutive entries (parallel results)

## Interruptible API Calls

API requests run in background threads while monitoring interrupt events:

```
Main Thread          API Thread
  |-- wait on:     -> HTTP POST
  |  - response      to provider
  |  - interrupt
  |  - timeout
```

When interrupted:
- The API thread is abandoned
- Agent processes new input or shuts down cleanly
- No partial response injected into history

## Tool Execution

### Sequential vs Concurrent

- **Single tool call**: executed directly in main thread
- **Multiple tool calls**: executed via `ThreadPoolExecutor`
  - Interactive tools (e.g., `clarify`) force sequential execution
  - Results reinserted in original tool call order

### Execution Flow

```
For each tool_call:
  1. Resolve handler from tools/registry.py
  2. Fire pre_tool_call plugin hook
  3. Check if dangerous command
     - If dangerous: invoke approval_callback
  4. Execute handler with args + task_id
  5. Fire post_tool_call plugin hook
  6. Append tool result to history
```

### Agent-Level Tools

These are intercepted before reaching `handle_function_call()`:

| Tool | Why Intercepted |
|------|-----------------|
| `todo` | Reads/writes agent-local task state |
| `memory` | Writes to persistent memory files |
| `session_search` | Queries session history via agent DB |
| `delegate_task` | Spawns subagents with isolated context |

## Callback Surfaces

| Callback | Fired When | Used By |
|----------|-----------|---------|
| `tool_progress_callback` | Before/after tool execution | CLI spinner, gateway |
| `thinking_callback` | Model starts/stops thinking | CLI indicator |
| `reasoning_callback` | Model returns reasoning | CLI display, gateway |
| `clarify_callback` | `clarify` tool called | CLI prompt, gateway |
| `step_callback` | After complete agent turn | Gateway, ACP |
| `stream_delta_callback` | Each streaming token | CLI streaming display |
| `tool_gen_callback` | Tool call parsed from stream | CLI tool preview |
| `status_callback` | State changes | ACP updates |

## Budget and Fallback Behavior

### Iteration Budget

- Default: 90 iterations (configurable via `agent.max_turns`)
- Each agent gets independent budget; subagents capped at `delegation.max_iterations` (default 50)
- At 100%, agent stops and returns work summary

### Fallback Model

When primary model fails (rate limit, server error, auth error):
1. Check `fallback_providers` list
2. Try each fallback in order
3. Continue conversation with new provider on success
4. Attempt credential refresh on 401/403 before failing over

Auxiliary tasks have independent fallback chains via `auxiliary.*` config.

## Compression and Persistence

### When Compression Triggers

- **Preflight**: Before API call if conversation exceeds 50% of context window
- **Gateway auto-compression**: If exceeds 85% (more aggressive, runs between turns)

### During Compression

1. Memory flushed to disk first
2. Middle conversation turns summarized
3. Last N messages preserved intact (`compression.protect_last_n` default: 20)
4. Tool call/result pairs kept together
5. New session lineage ID generated

### Session Persistence

After each turn:
- Messages saved to session store (SQLite via `hermes_state.py`)
- Memory changes flushed to `MEMORY.md` / `USER.md`
- Session resumable via `/resume` or `hermes chat --resume`

## Key Source Files

| File | Purpose |
|------|---------|
| `run_agent.py` | AIAgent class -- complete agent loop |
| `agent/prompt_builder.py` | System prompt assembly |
| `agent/context_engine.py` | ContextEngine ABC -- pluggable context management |
| `agent/context_compressor.py` | Default engine -- lossy summarization |
| `agent/prompt_caching.py` | Anthropic prompt caching markers |
| `agent/auxiliary_client.py` | Auxiliary LLM client for side tasks |
| `model_tools.py` | Tool schema collection, dispatch |
