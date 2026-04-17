# @a5c-ai/babysitter-harness

Optional CLI package for Babysitter harness runtime commands.

## Installation

```bash
npm install -g @a5c-ai/babysitter-harness
```

## Usage

This package provides the `babysitter-harness` command:

```bash
babysitter-harness --help
babysitter-harness call --harness claude-code --prompt "implement feature X" --workspace .
babysitter session:init --session-id demo --state-dir .a5c --run-id run-123
babysitter-harness start-server --transport stdio
babysitter-harness discover --json
babysitter-harness invoke claude-code --prompt "implement feature X" --workspace .
babysitter-harness tui --workspace .
```

Use the main `babysitter` CLI for harness installation and session-state commands:

```bash
babysitter harness:install claude-code
babysitter harness:install-plugin claude-code
babysitter session:state --session-id demo --state-dir .a5c
```
