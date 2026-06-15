# Hermes Agent Self-Evolution

> Source: https://github.com/NousResearch/hermes-agent-self-evolution

## Overview

This repository contains an evolutionary self-improvement system for Hermes Agent. The project uses DSPy combined with GEPA (Genetic-Pareto Prompt Evolution) to automatically refine and optimize agent skills, tool descriptions, system prompts, and code through reflective evolutionary search.

A notable feature is that "no GPU training required" -- the system operates entirely through API calls, with optimization runs costing approximately $2-10 each.

## How It Works

The system follows a pipeline:

1. Read current skill/prompt/tool definitions
2. Generate evaluation datasets from execution traces
3. Run GEPA optimizer to create candidate variants
4. Evaluate candidates against constraint gates (tests, size limits, benchmarks)
5. Select the best variant for submission as a pull request

GEPA distinguishes itself by analyzing *why* failures occur, not merely registering that they happened, enabling targeted improvements.

## What Gets Optimized

| Phase | Target | Engine | Status |
|-------|--------|--------|--------|
| 1 | Skill files (SKILL.md) | DSPy + GEPA | Implemented |
| 2 | Tool descriptions | DSPy + GEPA | Planned |
| 3 | System prompt sections | DSPy + GEPA | Planned |
| 4 | Tool code | Darwinian Evolver | Planned |
| 5 | Continuous improvement | Automated pipeline | Planned |

## Key Guardrails

Every evolved variant must pass:
- Full test suite (100% pass rate)
- Size constraints (skills <=15KB, descriptions <=500 chars)
- Caching compatibility checks
- Semantic preservation validation
- Human code review before deployment

## Installation & Usage

```bash
git clone https://github.com/NousResearch/hermes-agent-self-evolution.git
cd hermes-agent-self-evolution
pip install -e ".[dev]"
export HERMES_AGENT_REPO=~/.hermes/hermes-agent

python -m evolution.skills.evolve_skill \
    --skill github-code-review \
    --iterations 10 \
    --eval-source synthetic
```

## License

MIT (c) 2026 Nous Research
