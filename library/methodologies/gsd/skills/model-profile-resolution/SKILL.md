---
name: model-profile-resolution
description: Resolve model profile (quality/balanced/budget) at orchestration start and map agents to specific models. Enables cost/quality tradeoffs by selecting appropriate AI models for each agent role.
allowed-tools: Read Glob
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: gsd-core
  backlog-id: SK-GSD-009
---

# model-profile-resolution

You are **model-profile-resolution** - the skill that resolves which AI model each GSD agent should use based on the active profile. GSD supports three profiles (quality, balanced, budget) that map each agent role to a specific model, enabling cost/quality tradeoffs.

## Overview

The original GSD system provides three model profiles that control which AI model is used for each agent:

- **quality**: Best available models for all agents. Maximum accuracy and capability. Higher cost.
- **balanced**: Mix of high and mid-tier models. Good quality at moderate cost. Default profile.
- **budget**: Cheapest viable models for all agents. Acceptable quality at minimum cost.

The active profile is stored in `.planning/config.json` under the `profile` field, or can be overridden with the `--profile` flag.

## Capabilities

### 1. Read Active Profile

Load the current profile from configuration:

```json
// .planning/config.json
{
  "profile": "balanced",
  ...
}
```

If no profile is set, default to `balanced`.

### 2. Profile Definitions

Each profile maps agent roles to specific models:

```yaml
quality:
  orchestrator: claude-opus-4-6
  gsd-planner: claude-opus-4-6
  gsd-executor: claude-opus-4-6
  gsd-verifier: claude-opus-4-6
  gsd-plan-checker: claude-opus-4-6
  gsd-phase-researcher: claude-opus-4-6
  gsd-project-researcher: claude-opus-4-6
  gsd-research-synthesizer: claude-opus-4-6
  gsd-roadmapper: claude-opus-4-6
  gsd-codebase-mapper: claude-opus-4-6
  gsd-debugger: claude-opus-4-6
  gsd-integration-checker: claude-opus-4-6

balanced:
  orchestrator: claude-opus-4-6
  gsd-planner: claude-sonnet-4
  gsd-executor: claude-sonnet-4
  gsd-verifier: claude-sonnet-4
  gsd-plan-checker: claude-sonnet-4
  gsd-phase-researcher: claude-sonnet-4
  gsd-project-researcher: claude-sonnet-4
  gsd-research-synthesizer: claude-sonnet-4
  gsd-roadmapper: claude-sonnet-4
  gsd-codebase-mapper: claude-sonnet-4
  gsd-debugger: claude-sonnet-4
  gsd-integration-checker: claude-sonnet-4

budget:
  orchestrator: claude-sonnet-4
  gsd-planner: claude-haiku-4
  gsd-executor: claude-haiku-4
  gsd-verifier: claude-haiku-4
  gsd-plan-checker: claude-haiku-4
  gsd-phase-researcher: claude-sonnet-4
  gsd-project-researcher: claude-haiku-4
  gsd-research-synthesizer: claude-haiku-4
  gsd-roadmapper: claude-haiku-4
  gsd-codebase-mapper: claude-haiku-4
  gsd-debugger: claude-sonnet-4
  gsd-integration-checker: claude-haiku-4
```

Note: Budget profile uses Sonnet for research and debugging where quality matters most.

### 3. Per-Agent Model Mapping

Resolve the model for a specific agent:

```
resolve(agent: "gsd-executor", profile: "balanced")
-> { model: "claude-sonnet-4", profile: "balanced" }

resolve(agent: "gsd-planner", profile: "quality")
-> { model: "claude-opus-4-6", profile: "quality" }
```

### 4. Profile Switching

Switch profiles at runtime:

```json
// Before
{ "profile": "balanced" }

// After set-profile quality
{ "profile": "quality" }
```

Profile switches take effect on the next agent spawn. Already-running agents are not affected.

### 5. Model Capability Validation

Ensure selected model supports required agent features:

```
Validate gsd-executor needs:
  [PASS] Code generation: all models support
  [PASS] Tool use: all models support
  [PASS] Long context: all models support 200k
  [PASS] Structured output: all models support

Validate gsd-debugger needs:
  [PASS] Code analysis: all models support
  [PASS] Reasoning: opus-4-6 > sonnet-4 > haiku-4
  [WARN] Complex debugging may benefit from quality profile
```

### 6. Cost Estimation

Estimate cost per profile for a workflow:

```
Workflow: execute-phase (Phase 72, 2 plans, 7 tasks)
  Agent spawns: 2 executor + 1 verifier = 3 agents
  Estimated tokens per agent: ~50,000 input + ~20,000 output

  quality (opus-4-6 for all):
    Input:  3 * 50k * $0.015/1k = $2.25
    Output: 3 * 20k * $0.075/1k = $4.50
    Total: ~$6.75

  balanced (sonnet-4 for agents):
    Input:  3 * 50k * $0.003/1k = $0.45
    Output: 3 * 20k * $0.015/1k = $0.90
    Total: ~$1.35

  budget (haiku-4 for agents):
    Input:  3 * 50k * $0.00025/1k = $0.04
    Output: 3 * 20k * $0.00125/1k = $0.08
    Total: ~$0.12
```

Note: Cost estimates are approximate and based on typical token usage patterns.

## Tool Use Instructions

### Resolving Profile
1. Use `Read` to load `.planning/config.json`
2. Extract `profile` field (default to `balanced` if not set)
3. Return profile name

### Mapping Agent to Model
1. Resolve active profile
2. Look up agent name in profile mapping
3. Return model identifier
4. If agent not in mapping, use profile default

### Switching Profile
1. Use `Read` to load current config
2. Validate new profile name (quality/balanced/budget)
3. Update `profile` field
4. Write updated config (handled by gsd-tools or direct edit)

### Cost Estimation
1. Accept workflow description (agent types and counts)
2. Map agents to models via active profile
3. Estimate token usage per agent
4. Calculate cost based on model pricing
5. Return cost breakdown

## Process Integration

- All agent-spawning processes call this skill at initialization:
  - `new-project.js` - Resolve models for 4+ parallel researchers
  - `plan-phase.js` - Resolve model for planner, plan-checker
  - `execute-phase.js` - Resolve model for executor, verifier
  - `quick.js` - Resolve model for planner, executor
  - `debug.js` - Resolve model for debugger
  - `map-codebase.js` - Resolve model for 4 parallel mappers
  - `iterative-convergence.js` - Resolve model per iteration

## Output Format

```json
{
  "operation": "resolve|switch|validate|estimate",
  "status": "success|error",
  "profile": "balanced",
  "mapping": {
    "agent": "gsd-executor",
    "model": "claude-sonnet-4"
  },
  "costEstimate": {
    "profile": "balanced",
    "agentCount": 3,
    "estimatedCost": "$1.35",
    "breakdown": {
      "input": "$0.45",
      "output": "$0.90"
    }
  }
}
```

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `profile` | `balanced` | Active model profile |
| `customMappings` | `{}` | Override specific agent-model mappings |
| `costWarningThreshold` | `10.00` | Warn if estimated workflow cost exceeds this |

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `Unknown profile` | Profile name not quality/balanced/budget | Use one of the three valid profiles |
| `Unknown agent` | Agent name not in profile mapping | Use profile default model |
| `Config not found` | .planning/config.json missing | Use default profile (balanced) |
| `Model deprecated` | Mapped model no longer available | Update profile mapping to current model |

## Constraints

- Only three built-in profiles: quality, balanced, budget
- Profile changes take effect on next agent spawn only
- Cost estimates are approximate (actual costs depend on token usage)
- Custom agent-model overrides in config take precedence over profile defaults
- Model availability depends on the runtime environment (Claude Code, OpenCode, etc.)
- Budget profile still uses capable models for critical tasks (research, debugging)
