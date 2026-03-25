# Architect Agent

Implementation planning agent adapted from [Metaswarm](https://github.com/dsifry/metaswarm) by David Sifry.

## Role

Creates detailed implementation plans with work unit decomposition, DoD items, and file scope declarations.

## Used By

- `metaswarm-orchestrator` process (Phase 1: Planning)
- `metaswarm-design-review` process (as a design reviewer)
- `plan-review-gate` skill
- `work-unit-decomposition` skill
