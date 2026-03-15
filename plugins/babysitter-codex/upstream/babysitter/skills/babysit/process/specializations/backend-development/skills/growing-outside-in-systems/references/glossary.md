# Canonical Terms

Use these names consistently throughout conversation and code:

- **Bounded Context (Hexagon):** Primary modular unit. After first mention, use **Bounded Context**.
- **Domain Layer:** Private business rules, entities, and value objects inside a Bounded Context.
- **Application Layer:** Private orchestration/use-case logic inside a Bounded Context.
- **Ports:** Public interfaces of a Bounded Context (`inbound` and `outbound`).
- **DTOs:** Public data contracts used at boundaries.
- **Adapters:** External implementations of Ports.
- **Inter-Hexagon Bridge Adapter:** Adapter that translates one Bounded Context public contract to another.
- **Composition Root (Configurator):** Startup dependency wiring for production and tests; the "wiring diagram" that initializes the system.
- **Acceptance Test:** End-to-end behavior at the service/system boundary (in-process, with in-memory adapters).
- **Component Test:** Behavior inside one Bounded Context.
- **Contract Test:** Verifies a real adapter matches fake/port behavior.
