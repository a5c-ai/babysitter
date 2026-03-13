---
name: growing-outside-in-systems
description: >
  Drive feature development using Outside-In TDD with Hexagonal Architecture.
  Design emerges through inline code, in-memory fakes, interface extraction, and deferred I/O.
  Use when building features, writing tests, or structuring backend services.
  Triggers on: TDD, outside-in, hexagonal, ports and adapters, emergent design,
  acceptance test, component test, walking skeleton, in-memory fakes,
  component, contract test, adapter, fast tests, sub-second feedback.
  Language-agnostic (Go, Rust, Python, TypeScript, Java, C#).
allowed-tools: Read Glob Grep WebFetch
metadata:
  author: giladw
  version: "1.0.0"
  category: backend-development
  backlog-id: SK-GOIS-001
---

STARTER_CHARACTER = 🔴🟢

# Outside-In TDD with Hexagonal Architecture

Build features by driving design from the outside in. Every feature starts with a failing acceptance test. Design emerges through disciplined Red-Green-Refactor cycles. Infrastructure is deferred until the domain API is proven.

Unlike inside-out TDD with mocks, this approach tests behavior at the boundary — not implementation details — making the suite refactor-friendly by design. See [methodology.md](references/methodology.md#why-outside-in-over-regular-tdd).

For canonical terms used throughout, see [references/glossary.md](references/glossary.md).

---

## The Two Loops

**Outer loop (Acceptance test):** Write a failing test scoped at the service/system boundary. This test exercises integration across Bounded Contexts using in-memory adapters. It defines "done."

**Inner loop (Red-Green-Refactor):** Cycles inside a Bounded Context to make the outer test pass. Drop into this loop only to implement what the acceptance test demands.

Every feature starts from the outside in. The acceptance test drives the process.

---

## Test Priorities

Acceptance and component tests are the primary instruments. Unit tests are the exception.

- **Acceptance tests** — service/system boundary, in-process, in-memory adapters; read as specifications
- **Component tests** — single Bounded Context; drives internal module design via in-memory adapters
- **Unit tests** — exception only: well isolated ,genuinely complex, algorithmic, or combinatorial logic

See [testing-strategy.md](references/testing-strategy.md) for full definitions, the testing matrix, and contract test patterns.

---

## The Testing Matrix

| | Fast | Slow |
|---|---|---|
| **Large Scope** | Acceptance & Component — daily driver | E2E — minimize |
| **Small Scope** | Unit — use sparingly | Contract — CI only |

**Sub-second feedback is non-negotiable.** If tests take seconds, the team stops refactoring and the system decays.

---

## Emergent Design Workflow

Follow this sequence strictly within each Bounded Context:

1. **Inline** — implement logic naively inside business code; use local variables, lists, maps; no abstractions
2. **In-Memory adapter** — once behavior is verified, extract logic into a dedicated in-memory adapter implementation
3. **Interface** — extract the adapter interface from what actually emerged (not theoretical guesses)
   - *Checkpoint:* all types in the interface must live inside the hexagon
   - *I/O Checkpoint:* if no I/O and not out-of-process → keep inside hexagon; do not create a port
4. **Deferred I/O** — implement the real adapter (database, network, file system) only after the API is mature
5. **Refactor the inline code inside the hexagon**

**The sequence is non-negotiable.** Each step collects evidence about what the adapter actually needs. See [methodology.md](references/methodology.md) for detailed rationale and the walking skeleton.

---

## Hexagonal Architecture

The Domain Layer is the center. All I/O lives behind adapter interfaces at the boundary.

**Dependency Rule:** `Infrastructure(adapters) → Application(ports) → Domain` (outer depends on inner, never reverse)

**I/O Classification Rule:** if it does not do I/O and does not run out-of-process → belongs inside the hexagon; otherwise → adapter.

**Port-referenced types must live inside the hexagon.** If a port signature references a type in the adapter layer, the hexagon depends outward — a violation.

**Naming:**
- Ports: `For[Something]` (e.g., `ForCalculatingTaxes`, `ForGettingTaxRates`)
- Adapters: `[Something]Adapter` (e.g., `WebUIAdapter`, `SQLDatabaseAdapter`)

See [folder-structure.md](references/folder-structure.md) for full folder structure, private/public hexagon split, cross-hexagon dependency rule, adapter design patterns, and test seams.

---

## In-Memory Fakes, Not Mocks

Use in-memory fakes for all adapter boundaries. Never mocks or stubs for domain-level testing.

Fakes are real implementations backed by simple data structures (maps, lists). They have actual behavior. Mocks only verify call sequences — they couple tests to implementation details and break on every refactor.

Contract tests verify the real adapter matches the fake's behavior. See [testing-strategy.md](references/testing-strategy.md).

---

## Walking Skeleton

For new projects or major new components: build a minimal end-to-end implementation first to pay integration cost upfront. Once upright, pivot to the emergent design workflow. See [methodology.md](references/methodology.md).

---

## Composition Root (Configurator)

Wires all adapter interfaces at startup. Used in two contexts:

- **Production:** real adapter implementations (database, network, file system)
- **Tests:** in-memory adapter implementations → fast, deterministic test harness

The same business logic runs in both contexts — only the adapters differ.

---

## Feature Implementation Order

1. **Write a failing acceptance test** — defines "done"
2. **Drop into the inner loop** — Red-Green-Refactor
3. **Follow the emergent design sequence** — Inline → In-Memory → Interface → Deferred I/O
4. **Add component tests if needed** — when a Bounded Context grows complex
5. **Add unit tests only when justified** — complex algorithms, combinatorial logic
6. **Implement real adapters last** — verify with contract tests against in-memory fakes

---

## Listen to the Tests

Difficulty writing a test is a design signal, not a skill problem:

- **Hard to set up** → too many dependencies; split or rethink adapter boundaries
- **Hard to assert on** → API is hiding or tangling information callers need
- **Fragile, breaks on refactor** → testing implementation details; step up to component/acceptance test
- **Slow** → hitting real I/O; find the missing adapter boundary

Do not fight the tests. Reshape the code until the test is easy to write.

---

## Reference Documentation

- [glossary.md](references/glossary.md) — canonical terms
- [folder-structure.md](references/folder-structure.md) — folder structure, private/public hexagon, cross-hexagon rules, adapter patterns, test seams
- [testing-strategy.md](references/testing-strategy.md) — full testing matrix, acceptance/component test rules, contract test pattern
- [methodology.md](references/methodology.md) — why outside-in over regular TDD, walking skeleton, emergent design deep-dive, listen to the tests, anti-patterns

## Sources

- [Growing Object-Oriented Software, Guided by Tests](http://www.growing-object-oriented-software.com/) — Steve Freeman & Nat Pryce (2009)
- [Big Design Up-Front or Emergent Design? Hexagonal Architecture Gives Us Both](https://www.shaiyallin.com/post/big-design-up-front-or-emergent-design-hexagonal-architecture-gives-us-both) — Shai Yallin (2020)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/) — Alistair Cockburn (2005)
- [Contract Test](https://martinfowler.com/bliki/ContractTest.html) — Martin Fowler
- [Component Test](https://martinfowler.com/bliki/ComponentTest.html) — Martin Fowler
- [Bounded Context](https://martinfowler.com/bliki/BoundedContext.html) — Martin Fowler
