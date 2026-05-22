# agent-mux Implementation Process

## Overview

Iterative, spec-driven TDD implementation of `@a5c-ai/agent-mux` across 10 phases plus project scaffolding. Each phase follows a 3-part cycle: plan, implement+test, refactor+integrate. Adversarial reviews score implementation against specs with a 99% convergence target.

## Phases

| # | Phase | Specs | Description |
|---|-------|-------|-------------|
| 0 | Project Scaffolding | 01 | Monorepo setup, TypeScript config, test framework |
| 1 | Foundation | 01 | Core types, errors, client skeleton |
| 2 | Run Engine | 02 | RunOptions, validation, profiles |
| 3 | Run Handle & Events | 03, 04 | RunHandle, 67 AgentEvent types, streaming |
| 4 | Adapter System | 05, 06 | BaseAdapter, registry, capabilities, models |
| 5 | Sessions & Config | 07, 08 | SessionManager, ConfigManager, AuthManager |
| 6 | Plugin Manager | 09 | Plugin install/list/remove, registries |
| 7 | Process Lifecycle | 11 | ProcessTracker, signals, PTY, cross-platform |
| 8 | Built-in Adapters | 12, 06 | All 10 adapters (claude through hermes) |
| 9 | CLI Binary | 10 | amux CLI commands |
| 10 | Final Integration | All 12 | Full system test, polish, tech debt cleanup |

## Per-Phase Cycle

Each phase executes:

1. **Plan** — Define acceptance criteria from specs, file structure, TDD test plan
2. **Implement + Test** — TDD loop (up to 5 iterations):
   - Write tests first
   - Implement code
   - Shell gates: `tsc --noEmit` + `vitest run`
   - Adversarial review scoring (specParity 35%, testCoverage 25%, codeQuality 20%, integration 20%)
   - Converge to 99%
3. **Refactor + Integrate** — Fix tech debts, clean integration, cross-module tests

## Quality Gates

- **Deterministic** (shell): TypeScript compilation, vitest test suite, ESLint
- **Subjective** (agent): Adversarial spec-parity review, integration assessment
- **Checkpoints**: User approval every 3 phases + final approval

## Convergence Model

Each phase iterates up to 5 times through implement→verify→review until the adversarial score reaches 99%. Integration tests run every 2 phases.
