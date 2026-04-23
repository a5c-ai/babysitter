# @a5c-ai/babysitter-agent

Optional CLI package for Babysitter agent runtime commands.

## Installation

```bash
npm install -g @a5c-ai/babysitter-agent
```

## Usage

This package provides the `babysitter-agent` command:

```bash
babysitter-agent --help
babysitter-agent call --harness claude-code --prompt "implement feature X" --workspace .
babysitter session:init --session-id demo --state-dir .a5c --run-id run-123
babysitter-agent start-server --transport stdio
babysitter-agent discover --json
babysitter-agent invoke claude-code --prompt "implement feature X" --workspace .
babysitter-agent tui --workspace .
```

Use the main `babysitter` CLI for harness installation and session-state commands:

```bash
babysitter harness:install claude-code
babysitter harness:install-plugin claude-code
babysitter session:state --session-id demo --state-dir .a5c
```
