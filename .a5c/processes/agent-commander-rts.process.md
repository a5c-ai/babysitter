# agent-commander-rts — process overview

Builds **A5C Commander** (`apps/commander`): an RTS-game-style web console for orchestrating AI
agent fleets. Units = agent sessions, objectives = tasks, with full game HUD (top resource bar,
minimap, selection panel, contextual command card, event ticker, alert banner, inspector).
Backend is a deterministic seeded mock whose contracts mirror `@a5c-ai/comm-adapter` events,
`@a5c-ai/adapters-gateway` protocol v1, and kradle resources — swap-ready for the real gateway.
A microagent interface generates contextual commands and friendly procedural SVG icons.

Anchor document: `apps/commander/SPEC.md` — read at runtime (`cat`) and interpolated verbatim
into every agent prompt (drift-resistant composition).

## Phases

| # | Phase | Work | Gate (deterministic shell) |
|---|-------|------|----------------------------|
| 1 | scaffold | Vite+React 19+TS strict+Tailwind v4+Zustand skeleton, playwright config, test hooks | `npm install && tsc --noEmit && vite build` |
| 2 | author-e2e | Frozen Playwright specs authored from SPEC only (AC1–AC14), before any implementation | `playwright install && tsc && playwright test --list` |
| 3 | contracts-and-sim | Mirrored contracts, CommanderBackend, seeded tick simulation + determinism unit tests | `tsc && vitest run` |
| 4 | core-game-ui | Map viewport, unit sprites, task nodes, camera, selection, full input grammar, store | `tsc && vitest && vite build` |
| 5 | hud | TopBar, Minimap, SelectionPanel, CommandCard, EventTicker, AlertBanner, Inspector, SteerModal | `tsc && vitest && vite build` |
| 6 | microagent | Rule-based contextual commands + deterministic friendly SVG icon generator + tests | `tsc && vitest && vite build` |
| 7 | e2e-convergence | Loop: run frozen e2e suite, agent fixes app (≤5 rounds) | `playwright test` |
| 8 | design-polish | Loop: art-director agent screenshots+scores (rubric, threshold 85), polish agent applies (≤3) | full regression gate |
| 9 | final | README/integration guide, full gate, commit | `tsc && vitest && build && playwright test` |

Every implementation phase runs a gate→fix convergence loop (≤4 fix attempts) and commits+pushes
on completion. No breakpoints: scope was fully delegated; gates are objective.

Failure semantics: exhausted gate loops throw → RUN_FAILED (honest stop, repairable).
