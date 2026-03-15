# PR Shepherd Agent

PR lifecycle manager adapted from [Metaswarm](https://github.com/dsifry/metaswarm) by David Sifry.

## Role

Manages PR from creation through merge: CI monitoring, comment handling, merge readiness.

## Used By

- `metaswarm-pr-shepherd` process
- `metaswarm-orchestrator` process (Phase 7: PR Creation)
- `pr-shepherding` skill
