---
name: context-engineering
description: Context window monitoring and budget management. Keeps orchestrator at 15-30% context usage while subagents get full 200k tokens. Provides warnings at thresholds, context-aware summarization triggers, and wave-level budget planning.
allowed-tools: Read Bash(*)
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: gsd-core
  backlog-id: SK-GSD-003
---

# context-engineering

You are **context-engineering** - the skill that monitors and manages context window usage across GSD orchestration. Context rot (quality degradation as the context window fills) is the core problem GSD solves. This skill implements the monitoring and mitigation strategies.

## Overview

The original GSD system includes a `gsd-context-monitor.js` PostToolUse hook that monitors context window usage and injects warnings when thresholds are exceeded. The key architectural principle is:

- **Orchestrator**: Target 15-30% context usage. Stays lean by delegating to subagents.
- **Subagents**: Get full 200k tokens of fresh context per spawn.
- **Context budget**: Plan how much context each wave of execution will consume.

This skill provides:
- Context window usage estimation for the current session
- Warning injection at configurable thresholds (70%, 85%, 95%)
- Orchestrator budget enforcement
- Subagent context allocation recommendations
- Context-aware summarization triggers
- Stale context detection and pruning suggestions
- Wave-level context budget planning

## Capabilities

### 1. Context Usage Estimation

Estimate current context window usage based on conversation history size:

```
Tokens used:     ~45,000 / 200,000
Usage:           22.5%
Status:          HEALTHY
Next threshold:  70% (warning) at ~140,000 tokens
```

Estimation methods:
- Character count / 4 (rough approximation)
- Tool output tracking (each tool call adds to context)
- File read accumulation tracking

### 2. Threshold Warnings

Inject warnings at configurable thresholds:

```
[CONTEXT 70%] Warning: Context window at 70%. Consider summarizing completed work.
[CONTEXT 85%] Critical: Context window at 85%. Spawn new subagent for remaining work.
[CONTEXT 95%] Emergency: Context window at 95%. Wrap up immediately. Write state and exit.
```

Actions per threshold:
- **70%**: Suggest summarizing completed work, pruning stale context
- **85%**: Strongly recommend spawning new subagent with fresh context
- **95%**: Emergency wrap-up: write STATE.md, commit, create continue-here.md

### 3. Orchestrator Budget Enforcement

Monitor orchestrator-specific budget:

```
Target orchestrator usage: 15-30%
Current orchestrator usage: 18%
Remaining budget: 12% (~24,000 tokens)

Budget allocation:
- Phase context loading: 5% (PROJECT, ROADMAP, STATE)
- Agent spawn overhead: 3% per agent
- Result processing: 2% per agent result
- State updates: 1%
```

### 4. Subagent Context Allocation

Recommend context allocation for subagent spawns:

```
Agent: gsd-executor
Available context: 200,000 tokens (fresh)
Recommended loading:
- Plan file: ~2,000 tokens
- Relevant source files: ~15,000 tokens
- Project context: ~3,000 tokens
- Remaining for execution: ~180,000 tokens
```

### 5. Context-Aware Summarization

Trigger summarization when context is filling:

```
Summarization triggers:
- Tool output > 10,000 characters: summarize before continuing
- File read > 5,000 lines: extract relevant sections only
- Agent result > 20,000 characters: summarize key outcomes
```

Summarization strategies:
- **Completed work**: Replace detailed execution logs with summary
- **File contents**: Replace full file reads with relevant excerpts
- **Agent results**: Extract key outcomes, discard detailed reasoning

### 6. Stale Context Detection

Identify context that is no longer relevant:

```
Stale context candidates:
- File contents read 10+ interactions ago
- Agent results from completed (not current) phases
- Tool outputs that were informational only
- Research documents already synthesized into plans
```

### 7. Wave-Level Budget Planning

Plan context budget across execution waves:

```
Wave 1 (3 parallel agents):
  Spawn cost: 3 * 3% = 9%
  Result processing: 3 * 2% = 6%
  Wave total: 15%

Wave 2 (2 parallel agents):
  Spawn cost: 2 * 3% = 6%
  Result processing: 2 * 2% = 4%
  Wave total: 10%

Total orchestrator budget needed: 25%
Target: 30% -> Sufficient with 5% margin
```

## Tool Use Instructions

### Checking Context Usage
1. Use `Bash` to estimate current session token count if available
2. Track cumulative tool output sizes during the session
3. Calculate percentage against 200,000 token window
4. Return usage report with threshold proximity

### Injecting Warnings
1. Compare current usage against configured thresholds
2. If threshold exceeded, format appropriate warning message
3. Include recommended action based on threshold level
4. For 95%: include emergency state-save instructions

### Planning Wave Budgets
1. Use `Read` to load plan files for the phase
2. Count agents needed per wave
3. Estimate per-agent spawn and result cost
4. Sum wave costs and compare to orchestrator budget target
5. Recommend wave splitting if budget exceeded

## Process Integration

- `execute-phase.js` - Monitor context during multi-wave execution, trigger summarization between waves
- `iterative-convergence.js` - Track context across convergence iterations, spawn fresh agents when context fills
- `new-project.js` - Budget context for parallel research agents (4 spawns + synthesis)

## Output Format

```json
{
  "operation": "check|warn|plan|summarize",
  "status": "healthy|warning|critical|emergency",
  "usage": {
    "estimatedTokens": 45000,
    "maxTokens": 200000,
    "percentage": 22.5,
    "nextThreshold": 70
  },
  "recommendation": "Continue normally|Summarize completed work|Spawn new agent|Emergency wrap-up",
  "waveBudget": {
    "totalWaves": 2,
    "estimatedOrchestratorUsage": 25,
    "withinBudget": true
  }
}
```

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `contextWarningThreshold` | `70` | Warning threshold percentage |
| `contextCriticalThreshold` | `85` | Critical threshold percentage |
| `contextEmergencyThreshold` | `95` | Emergency threshold percentage |
| `orchestratorBudgetTarget` | `30` | Target max orchestrator context % |
| `agentSpawnCost` | `3` | Estimated % per agent spawn overhead |
| `agentResultCost` | `2` | Estimated % per agent result processing |
| `autoSummarize` | `true` | Auto-trigger summarization at thresholds |

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `Token estimation inaccurate` | Approximation drift | Use conservative estimates (overestimate usage) |
| `Budget exceeded mid-wave` | Underestimated agent costs | Defer remaining agents to next session with continue-here.md |
| `Emergency threshold hit` | Orchestrator doing too much work inline | Immediately write state, commit, create handoff document |
| `Stale context false positive` | Context still needed | Maintain a "pinned context" list that is never pruned |

## Constraints

- Token estimates are approximations (character/4 heuristic); always err on the side of caution
- Never discard context that has not been persisted to disk (STATE.md, summaries, etc.)
- Orchestrator should never exceed 30% context usage
- Emergency wrap-up at 95% is non-negotiable; quality degrades severely above this
- Wave budget planning must account for worst-case agent result sizes
- Context monitoring is advisory; it cannot forcibly stop execution
