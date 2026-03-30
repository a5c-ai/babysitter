---
name: external-tool-coordination
description: Coordinate external AI tool integration (OpenAI Codex, Google Gemini) for cross-model adversarial review and delegated implementation.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, WebFetch, WebSearch, Agent, AskUserQuestion
---

# External Tool Coordination

## Overview

When configured via `.metaswarm/external-tools.yaml`, coordinate external AI tools for delegated implementation and cross-model adversarial review.

## When to Use

- When external AI tools are configured and available
- For cross-model adversarial review (writer reviewed by different model)
- When delegating implementation to cheaper external models
- For escalation chains across tools

## Capabilities

- **Delegated Implementation** - Send work units to external AI tools for implementation
- **Cross-Model Review** - Implementation by Model A, adversarial review by Model B
- **Escalation Chains** - Tool A -> Tool B -> Claude -> human
- **Cost Optimization** - Route simpler tasks to cheaper models

## Configuration

Requires `.metaswarm/external-tools.yaml`:
```yaml
tools:
  - name: codex
    type: openai
    capabilities: [implement, review]
  - name: gemini
    type: google
    capabilities: [implement, review]
escalation:
  chain: [codex, gemini, claude, human]
```

## Agents Used

- `agents/swarm-coordinator/` - Multi-tool orchestration

## Tool Use

Invoke as part of: `methodologies/metaswarm/metaswarm-swarm-coordinator`
