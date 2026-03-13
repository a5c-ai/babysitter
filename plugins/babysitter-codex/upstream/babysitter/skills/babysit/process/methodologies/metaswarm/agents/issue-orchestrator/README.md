# Issue Orchestrator Agent

Master coordinator agent adapted from [Metaswarm](https://github.com/dsifry/metaswarm) by David Sifry.

## Role

Manages the complete lifecycle of a single issue from research through merged PR, coordinating all specialist agents and enforcing quality gates.

## Used By

- `metaswarm-orchestrator` process (primary orchestration)
- `metaswarm-execution-loop` process (per-work-unit execution)
- `orchestrated-execution` skill
