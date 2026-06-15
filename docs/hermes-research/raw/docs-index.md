# Hermes Agent Documentation - Main Index

> Source: https://hermes-agent.nousresearch.com/docs/

## Overview

Hermes Agent is an autonomous AI agent developed by Nous Research featuring a self-improving architecture. The platform emphasizes "a closed learning loop" with agent-curated memory, skill creation, and cross-session learning capabilities.

## Core Installation Methods

**Desktop Installation:** Download from hermes-agent.nousresearch.com/desktop for Windows/macOS

**CLI-Only Options:**
- Linux/macOS/WSL2/Android (Termux): `curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash`
- Windows (PowerShell): `iex (irm https://hermes-agent.nousresearch.com/install.ps1)`

Initial setup: `hermes setup --portal`

## Key Technical Features

- **Execution Environments:** Runs on local systems, Docker, SSH, Daytona, Singularity, Modal
- **Messaging Platforms:** 20+ integration options including Telegram, Discord, Slack, WhatsApp, Teams, Email, SMS
- **Memory System:** Persistent storage with FTS5 full-text search and LLM summarization
- **Skills Framework:** Autonomous skill creation and improvement; compatible with agentskills.io standards
- **MCP Support:** Integration with Model Context Protocol servers
- **Web Tools:** Search, extraction, browsing, vision processing, image generation, TTS
- **Subagents:** Spawnable isolated agents for parallel processing
- **Voice Mode:** Real-time interaction via CLI, Telegram, Discord

## Documentation Quick Links

Installation | Quickstart | Learning Path | Configuration | Messaging Gateway | Tools | Memory | Skills | MCP Integration | Voice Mode | Personality/SOUL.md | Context Files | Security | Architecture | FAQ

## Machine-Readable Resources

- `/llms.txt` -- 17 KB curated documentation index
- `/llms-full.txt` -- Complete documentation (~1.8 MB)
