# Recommended Folder Structure

The hexagon is the center; all I/O lives in adapters outside it. Ports are interfaces; adapters implement them.

```
project-root
│
├── /app (The Hexagon - Pure Business Logic)
│   ├── /inbound_ports (Interfaces/definitions for callers)
│   │   └── ServiceInterface (e.g., ForCalculatingTaxes)
│   ├── /outbound_ports (Interfaces the app defines for external needs)
│   │   └── RepositoryInterface (e.g., ForGettingTaxRates)
│   └── /domain_logic (Implementation of the business rules)
│
├── /adapters (Technology implementations - Outside the Hexagon)
│   ├── /inbound (Inbound adapters — call into the app)
│   │   ├── WebUIAdapter
│   │   └── CLIAdapter
│   └── /outbound (Outbound adapters — the app calls these)
│       ├── SQLDatabaseAdapter
│       └── NotificationAdapter (e.g., Email/Pager)
│
├── /tests (The "Test Moat" - isolated from production code)
│   ├── /fakes (In-memory fakes and test-only adapters)
│   │   └── FakeRepository
│   └── TestHarness/Configurator (Wiring for test environments)
│
└── Configurator (The "Wiring Diagram" to initialize production)
```

## Structure Principles

**Isolation of change.** Internal entities in `domain_logic/` can evolve without forcing immediate public contract changes. Ports and DTOs act as a stable buffer between internals and external consumers.

**Clear boundaries.** The hexagon exposes only `inbound_ports` and `outbound_ports`. All technology lives in `adapters/` (inbound or outbound). In multi-hexagon systems, cross-context collaboration must flow through each context's public ports, not its domain logic.

**Inbound vs outbound.** **Inbound adapters** (e.g. WebUI, CLI) call into the app via inbound ports. **Outbound adapters** (e.g. SQL, Email) implement outbound ports that the app calls. Both are outside the hexagon.

**`tests/fakes`** holds in-memory fakes and test-only adapter implementations. The TestHarness/Configurator wires the system with these for fast acceptance and component tests.

**`tests/acceptance/`** (or equivalent at top level) wires the entire system through the Configurator with in-memory adapters. They are the outer loop — the starting point for every feature.

**`tests/component/{bounded-context}/`** mirrors the source Bounded Contexts. Each gets its own test suite that drives its internal design.

**`tests/unit/`** should stay thin. If this folder is growing fast, it's a smell — you're likely defaulting to unit tests when component or acceptance tests would suffice.

**Contract tests** verify each real outbound adapter against its in-memory fake. These run in CI, not locally.

**In-memory fakes** (in `tests/fakes` or equivalent) are the first real implementation and define proven adapter behavior used by the Configurator in the fast test harness.

---

## Private vs Public Inside a Hexagon

Each hexagon should separate private internals from public contracts:

- **Private (`domain_logic/`)** — Entities and business rules. These are smart objects and invariants internal to the bounded context.
- **Public (`inbound_ports/`, `outbound_ports/`)** — Contracts that other actors can depend on:
  - **Inbound ports** — Interfaces for callers (e.g. `ForCalculatingTaxes`); what web/CLI adapters call.
  - **Outbound ports** — Interfaces the app defines for external needs (e.g. `ForGettingTaxRates`); what the hexagon needs from persistence, notifications, etc.
  - DTOs live at the boundary (e.g. in ports or a shared `dtos` module) for boundary-safe data shapes.
- **Application/orchestration** — Lives in `domain_logic/` and coordinates entities and ports.

This split makes the boundary obvious: entities evolve internally; contracts evolve deliberately.

## Naming Convention for Ports and Adapters

- **Ports:** Name by capability — **`For[Something]`** (e.g. `ForCalculatingTaxes`, `ForGettingTaxRates`). The name describes what the port is for, not the technology.
- **Adapters:** Name by technology or role — **`[Something]Adapter`** (e.g. `WebUIAdapter`, `SQLDatabaseAdapter`, `NotificationAdapter`). The name identifies the implementation.

## Cross-Hexagon Dependency Rule

If one Bounded Context needs data or behavior from another Bounded Context:

- Depend on the other hexagon's **public ports** (inbound_ports/outbound_ports) and DTOs
- Never import the other hexagon's `domain_logic/` internals

If `ordering/` imports `inventory/domain_logic/stock_entity.py`, the boundary is broken. `ordering/` should only talk to `inventory` through its public contracts (ports).

## The Strategic Role of Adapters

Adapters serve three purposes:

- **Hide external specifics** — The domain remains agnostic of vendors, protocols, and storage engines.
- **Expose domain-specific APIs** — Speak the system's semantic language, not generic I/O. A `BlockPersistence` adapter exposes `WriteBlock` and `ReadBlock`, hiding file system details like paths, sharding, or ext4 specifics. This is not a generic `DataAccessObject` — it is a domain concept.
- **Enable in-memory testing** — Swap real I/O for fast fakes. This is the key to the sub-second loop.

## Adapters Are Test Seams

Every adapter boundary is a **test seam** — a point where you can substitute the real implementation with an in-memory fake. This is not accidental. The architectural decision to place adapters at the boundary is simultaneously a testing decision. You don't need to design separate "test hooks" into your system; the hexagonal structure gives you seams for free. If you find yourself needing to reach inside a component to stub something out, your adapter boundaries are in the wrong place.

In multi-hexagon systems, this includes **Inter-Hexagon Bridge Adapters**. A bridge adapter translates one Bounded Context request/response into another Bounded Context public contract and lives in adapters, outside both hexagons.
