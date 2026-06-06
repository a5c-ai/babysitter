# Hermes Agent Development Guide (AGENTS.md)

> Source: https://github.com/NousResearch/hermes-agent/blob/main/AGENTS.md

## Overview
This comprehensive development guide instructs AI assistants and developers on working with the hermes-agent codebase. The document emphasizes: **"Never give up on the right solution."**

## Key Architecture Components

**Core Agent System:**
The `AIAgent` class in `run_agent.py` implements the main conversation loop with approximately 60 initialization parameters. The agent processes tool calls iteratively until reaching maximum iterations or budget limits, following OpenAI's message format conventions.

**CLI & Terminal Interface:**
- Classic CLI uses Rich panels and prompt_toolkit with animated spinner feedback
- TUI (terminal UI) is a Node.js Ink-based React frontend communicating via JSON-RPC with a Python backend
- Dashboard embeds the real TUI through PTY bridging rather than reimplementing chat surfaces

**Plugin System:**
Two distinct plugin architectures serve different purposes: general plugins for tools/hooks/lifecycle events, and specialized discovery systems for memory providers, model backends, context engines, and image generators.

## Critical Development Rules

**Profile Safety:** All code must use `get_hermes_home()` for state paths and `display_hermes_home()` for user messages. Hardcoding `~/.hermes` breaks multi-instance support.

**Dependency Pinning:** All PyPI packages require upper bounds: `">=floor,<next_major"`. Git URLs must specify commit SHAs. This policy emerged after supply-chain compromises.

**Tool Creation:** New core tools require registration in both `tools/your_tool.py` and `toolsets.py`. Auto-discovery handles schema collection, but toolset inclusion is a deliberate manual step.

**Configuration:** Settings live in `config.yaml` (non-secrets), API keys in `.env` only. Three separate config loaders exist (CLI, tools, gateway) -- use the correct one.

## Testing Standards

Testing must use `scripts/run_tests.sh` rather than calling pytest directly. The wrapper enforces environment parity with CI: unset credentials, UTC timezone, C.UTF-8 locale, and subprocess-per-test isolation via an in-tree plugin.

**Prohibited test patterns:** Change-detector tests that fail on routine updates (catalog snapshots, version numbers, enumeration counts) add no behavioral value and waste engineering time.

## Skill Authoring Requirements

All skills require strict standards:
- Descriptions capped at 60 characters, one sentence
- Tool references must name native Hermes tools or explicit MCP servers
- Platform gating audited against actual imports
- Author credits real human contributors first
- Tests use only stdlib + pytest + unittest.mock

## Notable Systems

**Curation:** Background system tracking skill usage and auto-archiving stale agent-created skills to `~/.hermes/skills/.archive/` (never destructive).

**Cron:** Durable SQLite scheduler supporting duration phrases, "every" patterns, cron expressions, and one-shot ISO timestamps. Hard 3-minute interrupt prevents runaway loops.

**Kanban:** SQLite-backed collaborative work queue supporting multiple profiles with task assignment, dependency linking, and stale-claim reclamation.

**Prompt Caching:** Must remain valid throughout conversations -- no mid-conversation context alterations except during compression.
