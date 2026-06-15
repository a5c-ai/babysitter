# Hermes Agent Architecture

> Source: https://hermes-agent.nousresearch.com/docs/developer-guide/architecture

## System Overview

The architecture consists of three entry points (CLI, Gateway, ACP) that feed into the core `AIAgent`, which orchestrates:

- **Prompt Builder**: System prompt assembly
- **Provider Resolution**: API mode and credentials selection
- **Tool Dispatch**: Schema collection and tool execution

These components interact with session storage (SQLite with FTS5) and tool backends spanning terminal, browser, web, MCP, and file operations.

## Directory Structure

The codebase organizes around:

- `run_agent.py` -- Core conversation loop
- `cli.py` -- Interactive terminal UI
- `model_tools.py` -- Tool discovery and dispatch
- `agent/` -- Agent internals (prompt building, context compression, caching)
- `hermes_cli/` -- CLI subcommands and setup
- `tools/` -- 70+ tool implementations across 28 toolsets
- `gateway/` -- 20 messaging platform adapters
- `acp_adapter/` -- IDE integration (VS Code, Zed, JetBrains)
- `plugins/` -- Memory providers and context engines

## Data Flow

**CLI Session**: User input -> HermesCLI -> AIAgent -> prompt builder -> provider resolution -> API call -> tool dispatch (if needed) -> response display and session save

**Gateway Message**: Platform event -> adapter -> authorization -> session resolution -> AIAgent -> response delivery

**Cron Job**: Scheduler tick -> load jobs -> fresh AIAgent with skill context -> execute -> platform delivery

## Major Subsystems

**Agent Loop**: Synchronous orchestration handling provider selection, prompt construction, tool execution, retries, and persistence.

**Prompt System**: Assembles ordered tiers (identity -> context -> volatile), applies Anthropic cache breakpoints, and summarizes conversation turns when context exceeds thresholds.

**Provider Resolution**: Maps provider-model pairs to API credentials across 18+ providers with OAuth and alias resolution.

**Tool System**: Central registry auto-discovering 70+ tools at import time with terminal backends supporting local, Docker, SSH, Daytona, Modal, and Singularity.

**Session Persistence**: SQLite storage with lineage tracking, platform isolation, and contention handling.

**Messaging Gateway**: Long-running process with 20 platform adapters, unified routing, authorization, slash commands, hooks, and cron integration.

**Plugin System**: Three discovery sources (user, project, pip) registering tools, hooks, and commands. Specialized plugins for memory providers and context engines (single-select only).

**Cron**: First-class agent tasks storing in JSON with multiple schedule formats, skill attachment, and multi-platform delivery.

**ACP Integration**: Editor-native agent over stdio/JSON-RPC for IDE environments.

**Trajectories**: ShareGPT-format generation from agent sessions for training data.

## Design Principles

| Principle | Implementation |
|-----------|-----------------|
| Prompt stability | System prompt unchanged mid-conversation; cache-breaking only on explicit actions |
| Observable execution | Every tool call visible via callbacks with progress updates |
| Interruptible | API calls and tool execution cancellable by user input or signals |
| Platform-agnostic core | Single AIAgent class across CLI, gateway, ACP, batch, and API |
| Loose coupling | Optional subsystems use registry patterns and conditional gating |
| Profile isolation | Each profile gets dedicated HERMES_HOME, config, memory, and sessions |

## File Dependency Chain

Tool registration occurs at import time: `tools/registry.py` (zero dependencies) <- `tools/*.py` (auto-register) <- `model_tools.py` <- entry points. This enables automatic tool discovery without manual imports.
