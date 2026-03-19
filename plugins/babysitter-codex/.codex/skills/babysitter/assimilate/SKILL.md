---
name: babysitter:assimilate
description: Assimilate an external methodology, harness, or specification into babysitter process definitions.
argument-hint: "Target to assimilate (repo URL, harness name, or spec path)"
---

# babysitter:assimilate

Convert external sources into well-defined babysitter process definitions with accompanying `skills/` and `agents/` directories.

## Assimilation Workflows

Determine which workflow to use based on the target:

### Methodology Assimilation (repo URL or methodology name)

Learns an external methodology from its repo and converts procedural instructions, commands, and manual flows into babysitter processes with refactored skills and agents.

1. Clone or fetch the target repo
2. Analyze the methodology's structure, commands, and workflows
3. Map manual steps to babysitter task definitions
4. Generate process .js files, SKILL.md files, and AGENT.md files
5. Store output in `.a5c/processes/`

### Harness Integration (harness name)

Integrates babysitter SDK with a specific AI coding harness. Available targets:
- `codex` — OpenAI Codex CLI
- `opencode` — OpenCode (Bun-based)
- `gemini-cli` — Google Gemini CLI
- `openclaw` — OpenClaw daemon
- `antigravity` — Google Antigravity
- `generic` — Generic AI harness

### Specification Assimilation (spec path)

Adapts the methodology-assimilation workflow for specification documents (RFC, API spec, design doc).

## Output

For each assimilation, generate:
```
.a5c/processes/
├── <name>.js           # Process definition
├── <name>-inputs.json  # Default inputs
├── skills/             # Extracted skills
│   └── <skill>/SKILL.md
└── agents/             # Extracted agents
    └── <agent>/AGENT.md
```

## Usage

```
babysitter assimilate https://github.com/org/methodology-repo
babysitter assimilate harness codex
babysitter assimilate ./specs/api-design.md
```
