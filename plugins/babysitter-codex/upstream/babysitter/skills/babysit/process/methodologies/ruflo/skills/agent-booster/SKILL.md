---
name: agent-booster
description: WASM-based instant code transforms for simple tasks, achieving 352x speedup over LLM inference with zero cost.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, WebFetch, WebSearch, Agent, AskUserQuestion
---

# Agent Booster

## Overview

WASM-compiled code transformation engine for simple, well-defined tasks. Bypasses LLM inference entirely for pattern-matched transforms, achieving sub-millisecond execution at zero cost.

## When to Use

- Simple, deterministic code transforms
- High-frequency repetitive modifications
- When latency is critical (<1ms requirement)
- Cost-sensitive batch operations

## Supported Transforms

| Transform | Description | Example |
|-----------|-------------|---------|
| `var-to-const` | Modernize variable declarations | `var x = 1` -> `const x = 1` |
| `add-types` | Insert TypeScript annotations | `function f(x)` -> `function f(x: string)` |
| `add-error-handling` | Wrap in try/catch | Bare calls -> try/catch blocks |
| `async-await` | Convert Promise chains | `.then().catch()` -> `async/await` |
| `extract-function` | Extract code blocks | Inline code -> named function |
| `inline-variable` | Inline single-use variables | Remove intermediate vars |
| `add-jsdoc` | Generate documentation | Bare functions -> JSDoc comments |

## Performance

- Execution: <1ms per transform
- Cost: $0 (no LLM invocation)
- Speedup: 352x compared to LLM inference
- Confidence threshold: >90% pattern match required

## Agents Used

- `agents/coder/` - Fallback for unmatched patterns

## Tool Use

Invoke via babysitter process: `methodologies/ruflo/ruflo-task-routing`
