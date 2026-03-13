# Growing Outside-In Systems Skill

## Overview

The `growing-outside-in-systems` skill drives feature development using **Outside-In TDD** combined with **Hexagonal Architecture**. Design emerges through disciplined Red-Green-Refactor cycles — starting with a failing acceptance test at the system boundary and working inward. Infrastructure is deferred until the domain API is proven through in-memory fakes.

This skill is language-agnostic and applies to any backend codebase: Go, Rust, Python, TypeScript, Java, C#, and others.

## Quick Start

No environment prerequisites — this skill guides a methodology, not a toolchain.

### Invoke the skill

```
/skill growing-outside-in-systems
```

The skill activates on keywords: `TDD`, `outside-in`, `hexagonal`, `ports and adapters`, `acceptance test`, `component test`, `walking skeleton`, `in-memory fakes`, `emergent design`, `sub-second feedback`.

### Start a feature

1. Write a failing acceptance test at the service/system boundary
2. Drop into the inner Red-Green-Refactor loop
3. Follow the emergent design sequence: Inline → In-Memory → Interface → Deferred I/O
4. Implement real adapters last, verified by contract tests

## Usage

### Driving a new feature

```
I need to add user authentication. Let's use outside-in TDD.
```

The skill will guide you to:
- Write an acceptance test that defines "done" at the service boundary
- Implement inline logic to pass the test
- Extract an in-memory adapter, then the interface
- Defer the real database adapter until the API is proven

### Structuring a new service

```
Help me set up a hexagonal architecture for this payments service.
```

The skill will provide folder structure, naming conventions for ports and adapters, and guidance on the Composition Root (Configurator) for wiring production vs. test environments.

### Reviewing test strategy

```
Our tests are too slow and break on every refactor. How do we fix this?
```

The skill will apply the Testing Matrix to diagnose the issue and recommend the right test scope.

## Capabilities

| Capability | Description |
|------------|-------------|
| **Two Loops** | Outer acceptance test loop + inner Red-Green-Refactor loop — guides the full feature workflow |
| **Emergent Design** | Inline → In-Memory → Interface → Deferred I/O sequence, non-negotiable |
| **Testing Matrix** | Fast/Slow × Large/Small scope — acceptance, component, unit, contract, E2E placement |
| **Hexagonal Architecture** | Dependency rule, I/O classification, port/adapter naming, cross-hexagon rules |
| **In-Memory Fakes** | Real implementations backed by simple data structures; contract tests verify equivalence |
| **Walking Skeleton** | Minimal end-to-end implementation to pay integration cost upfront on new projects |

## References

| File | Contents |
|------|----------|
| [references/glossary.md](references/glossary.md) | Canonical terms: Bounded Context, Ports, Adapters, Composition Root, test types |
| [references/testing-strategy.md](references/testing-strategy.md) | Full testing matrix, acceptance/component test rules, contract test pattern |
| [references/folder-structure.md](references/folder-structure.md) | Folder layout, private/public hexagon split, cross-hexagon rules, adapter patterns, test seams |
| [references/methodology.md](references/methodology.md) | Walking skeleton, emergent design deep-dive, anti-patterns, listen to the tests |

## Sources

- [Growing Object-Oriented Software, Guided by Tests](http://www.growing-object-oriented-software.com/) — Steve Freeman & Nat Pryce (2009)
- [Big Design Up-Front or Emergent Design? Hexagonal Architecture Gives Us Both](https://www.shaiyallin.com/post/big-design-up-front-or-emergent-design-hexagonal-architecture-gives-us-both) — Shai Yallin (2020)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/) — Alistair Cockburn (2005)
- [Contract Test](https://martinfowler.com/bliki/ContractTest.html) — Martin Fowler
- [Component Test](https://martinfowler.com/bliki/ComponentTest.html) — Martin Fowler
- [Bounded Context](https://martinfowler.com/bliki/BoundedContext.html) — Martin Fowler

---

**Backlog ID:** SK-GOIS-001
**Category:** Backend Development
**Status:** Active
