# Hermes Agent - GitHub README

> Source: https://github.com/NousResearch/hermes-agent

## Overview

Hermes Agent is an autonomous AI system developed by Nous Research that operates across multiple platforms. It features a built-in learning mechanism, persistent memory systems, and the ability to function on various infrastructure setups -- from modest $5 VPS deployments to GPU clusters and serverless environments.

## Core Features

**Self-Improving Architecture**
The agent creates and refines skills autonomously, maintains conversational history with full-text search capabilities, and develops user profiles that persist across sessions.

**Multi-Platform Access**
"Telegram, Discord, Slack, WhatsApp, Signal, and CLI -- all from a single gateway process." The system supports voice transcription and maintains conversation continuity across platforms.

**Terminal Interface**
A comprehensive TUI offering multiline editing, command autocomplete, conversation history, interrupt functionality, and streaming tool output.

**Flexible Model Support**
Compatible with numerous providers including Nous Portal, OpenRouter (200+ models), NovitaAI, NVIDIA NIM, OpenAI, and custom endpoints. Model switching occurs without code modifications.

**Scheduled Automation**
Built-in cron scheduler enabling natural-language task automation for recurring operations like daily reports or weekly audits.

**Distributed Execution**
Capability to spawn isolated subagents for parallel workstreams and collapse multi-step Python scripts into zero-context-cost operations.

## Installation

**Linux/macOS/WSL2/Termux:**
```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
```

**Windows (PowerShell):**
```powershell
iex (irm https://hermes-agent.nousresearch.com/install.ps1)
```

The Windows installer provides bundled Git Bash (MinGit), Python 3.11, Node.js, ripgrep, and ffmpeg without requiring administrator privileges.

## Quick Start Commands

- `hermes` -- Launch interactive CLI
- `hermes model` -- Select LLM provider
- `hermes tools` -- Configure enabled tools
- `hermes gateway` -- Start messaging platform bridge
- `hermes setup` -- Full configuration wizard
- `hermes update` -- Update to latest version

## Messaging & CLI Reference

| Action | CLI | Messaging |
|--------|-----|-----------|
| Start conversation | `hermes` | Setup gateway, then message bot |
| New conversation | `/new` or `/reset` | `/new` or `/reset` |
| Change model | `/model [provider:model]` | `/model [provider:model]` |
| Retry/undo | `/retry`, `/undo` | `/retry`, `/undo` |
| Interrupt work | `Ctrl+C` | `/stop` or new message |

## Technical Stack

**Languages:** Python (83.6%), TypeScript (12.6%), JavaScript (1.0%)

**Key Components:**
- Agent loop with tool-calling architecture
- FTS5 session search with LLM summarization
- Memory system compatible with Honcho user modeling
- Skills standard aligned with agentskills.io
- MCP (Model Context Protocol) integration support
- Terminal backends: local, Docker, SSH, Singularity, Modal, Daytona

## Migration & Compatibility

OpenClaw users can automatically import configurations via `hermes claw migrate`, transferring SOUL.md personas, memories, skills, command allowlists, and API keys.

## Development

**Quick contributor setup:**
```bash
git clone https://github.com/NousResearch/hermes-agent.git
cd hermes-agent
./setup-hermes.sh
```

## Community & Resources

- Discord server for community discussion
- Skills Hub at agentskills.io for procedural memory sharing
- GitHub issues for bug reports
- Comprehensive documentation at hermes-agent.nousresearch.com/docs

## Licensing

MIT License -- Open source and freely distributable.
