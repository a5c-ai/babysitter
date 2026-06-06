# Hermes Agent Quickstart

> Source: https://hermes-agent.nousresearch.com/docs/getting-started/quickstart

## Overview

Hermes Agent is an AI agent that operates through a command-line interface, supporting multiple LLM providers and featuring tool access, messaging platform integration, and skill automation.

## Installation

**Desktop (macOS/Windows):** Download from https://hermes-agent.nousresearch.com/desktop

**Command-line only:**
- Linux/macOS/WSL2/Android: `curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash`
- Windows PowerShell: `iex (irm https://hermes-agent.nousresearch.com/install.ps1)`

After installation, reload your shell: `source ~/.bashrc` or `source ~/.zshrc`

## Provider Selection

Run `hermes model` for interactive setup. Key requirements: "a model with at least **64,000 tokens** of context."

Major supported providers include:
- Nous Portal (subscription, OAuth)
- OpenAI/Anthropic/Google
- OpenRouter, DeepSeek, xAI
- Ollama, LM Studio (local)
- AWS Bedrock, Azure Foundry
- Hugging Face, and 30+ others

Quick start: `hermes setup --portal` for Nous Portal with zero-config setup.

**Configuration storage:**
- Secrets -> `~/.hermes/.env`
- Non-secret settings -> `~/.hermes/config.yaml`

## First Chat

```bash
hermes              # Classic CLI
hermes --tui        # Modern TUI interface
```

Verify: The agent responds with your chosen model and can use tools (terminal, file read, web search).

## Core Commands

| Command | Purpose |
|---------|---------|
| `hermes` | Start chatting |
| `hermes --continue` | Resume last session |
| `hermes model` | Switch providers/models |
| `hermes doctor` | Diagnose issues |
| `hermes gateway setup` | Connect messaging platforms |
| `hermes skills browse` | Discover reusable workflows |

## Key Features

**Slash commands:** Type `/` for autocomplete (`/help`, `/tools`, `/model`, `/personality`)

**Terminal access:** Agent can execute commands and show results

**Multi-line input:** Alt+Enter, Ctrl+J, or Shift+Enter

**Interruption:** New message during task execution switches focus; Ctrl+C also works

## Advanced Setup (After Base Chat Works)

- **Messaging bots:** `hermes gateway setup` for Telegram, Discord, Slack, WhatsApp, Signal, Email
- **Sandboxing:** `hermes config set terminal.backend docker`
- **Voice:** Install extras, then `/voice on` with Ctrl+B to record
- **Skills:** `hermes skills install openai/skills/k8s` then `/k8s [task]`
- **MCP servers:** Configure via `~/.hermes/config.yaml`

## Troubleshooting

Common issues:
- Empty replies -> Run `hermes model` to verify provider auth
- Session won't resume -> Check `hermes sessions list`
- Gateway unresponsive -> Re-run `hermes gateway setup`

Recovery sequence: `hermes doctor` -> `hermes model` -> `hermes setup` -> `hermes sessions list`
