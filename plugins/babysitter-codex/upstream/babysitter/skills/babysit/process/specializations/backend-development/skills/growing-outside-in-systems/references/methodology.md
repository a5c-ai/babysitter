# Outside-In TDD Methodology: Full Reference

These illustrate the principles. Consider what fits your context.

## Contents

- Why Outside-In over Regular TDD
- Foundational Concepts
- Source Material
- The Walking Skeleton
- The Emergent Design Workflow in Detail
- The "What" vs. The "How"
- Reconciling Upfront Contracts with Emergence
- The Sub-Second Feedback Loop
- Anti-Patterns

---

## Why Outside-In over Regular TDD

Regular (inside-out) TDD starts from units and mocks collaborators. This creates two compounding problems:

1. **Tests couple to implementation details.** Mocks verify call sequences — which method was called, with which arguments, in which order. Every structural refactor breaks tests even when behavior is unchanged. The test suite becomes a liability, not an asset.

2. **Mocks lie about correctness.** A mock verifies that your code *calls* a collaborator in a specific way. It says nothing about whether the collaborator actually behaves correctly under those calls. You can have a fully green mock-based suite and a broken system.

Outside-In ATDD solves both:

- **Tests specify behavior, not implementation.** Acceptance tests describe what the system does at its boundary. Refactor internals — rename, extract, restructure — as aggressively as you want. Tests only break when observable behavior breaks.
- **In-memory fakes have real behavior.** A fake repository backed by a map actually stores and retrieves data. It can be shared across tests, reused across suites, and verified against the real adapter via contract tests. It outlives every refactor.
- **Refactor-friendly by design.** The acceptance test is the contract. A passing suite means the system behaves correctly, regardless of internal structure. This is what makes continuous refactoring sustainable.
- **Tests as living specifications.** Written at the right scope, acceptance tests read as feature descriptions. A new team member can understand what the system does by reading the test suite — without opening the implementation.

---

## Foundational Concepts

**Outside-In TDD (Double-Loop TDD):** Every feature starts with a failing acceptance test that describes the desired behavior from the outside. Implementation proceeds inward, driven by what the outer test demands.

**Hexagonal Architecture (Ports & Adapters):** The domain is the center. All external concerns (database, network, UI, file system) connect through adapter interfaces at the boundary. The domain never depends on infrastructure.

**Emergent Design:** Interfaces, abstractions, and architectural patterns emerge from working code and passing tests — not from upfront design sessions.

## Source Material

This methodology draws from:
- *Growing Object-Oriented Software, Guided by Tests* (Freeman & Pryce) — the double-loop TDD approach, walking skeleton, and outside-in workflow
- Alistair Cockburn's Hexagonal Architecture — ports and adapters, domain isolation
- The testing matrix approach — categorizing tests by speed and scope rather than a simple pyramid
- https://www.shaiyallin.com/post/big-design-up-front-or-emergent-design-hexagonal-architecture-gives-us-both

## The Walking Skeleton

A walking skeleton is the first deliverable in a new project. It is a minimal end-to-end implementation that connects the main system boundaries.

**Purpose:** Pay the integration cost upfront. Resolve plumbing (database connectivity, network protocols, deployment pipeline) before the system is complex. Deferring integration means paying that debt later "with interest."

**What it is NOT:** A feature. It is a "glorified Hello World" — proof that components can communicate.

**When it's done:** The skeleton is upright when a request can traverse the full system boundary (e.g., API call → domain → persistence → response), even if the response is trivial.

**After the skeleton:** Pivot from mechanics (can the system talk?) to semantics (what should it say?). This is where the emergent design workflow begins.

## The Emergent Design Workflow in Detail

### Step 1: Inline Implementation

Write the simplest possible code that makes the test pass. Put logic directly in the business code. Use local variables, arrays, maps.

**Why inline first:**
- Forces you to understand the actual requirement before abstracting
- Prevents premature generalization
- Keeps the feedback loop tight — no wiring, no indirection

### Step 2: In-Memory Refactoring

Once the test passes and the behavior is verified, extract the data handling into a dedicated in-memory implementation. This is typically a class or module backed by simple data structures.

**Why in-memory:**
- Tests remain sub-second
- The IDE can re-run all relevant tests instantly
- You're refactoring with a green bar — safe to restructure

### Step 3: Interface Extraction

Now that you have a concrete in-memory implementation, define the adapter interface based on what actually emerged. The interface reflects real usage patterns, not theoretical guesses.

**Why extract after:**
- The interface is shaped by actual requirements
- No speculative methods that never get called
- The domain API speaks the system's semantic language

### Step 4: Deferred I/O

Only now implement the real adapter (database, file system, network). The interface is stable. The behavior is proven. The real adapter just needs to satisfy the same contract as the in-memory fake.

**Why defer:**
- The API is mature — fewer changes to the real implementation
- Contract tests verify behavioral equivalence between fake and real
- I/O decisions are better informed by actual usage patterns

## The "What" vs. The "How"

A key architectural distinction: separate the Domain API (the "what") from the Mechanical Implementation (the "how").

Example: A `BlockPersistence` adapter defines `WriteBlock(block)` — that's the "what." Whether we're sharding across volumes or navigating ext4 file system paths — that's the "how." The "how" is a deferred implementation detail.

## Reconciling Upfront Contracts with Emergence

When external contracts exist (e.g., Protocol Buffers, OpenAPI specs), do not let the contract dictate the internal design prematurely.

Approach:
1. Use TDD to drive and validate the design with clean internal interfaces first
2. Once the internal API is stable and proven, adapt it to the external contract
3. The external contract becomes coupled to the reference implementation — if the spec changes, the code breaks immediately

This solves the "stale spec" problem. The protocol and code stay in sync because they are directly coupled after the design has emerged.

## The Sub-Second Feedback Loop

The ultimate objective: eliminate friction between a developer's thought and the validation of that thought.

If the feedback loop exceeds a few seconds:
- Developers stop running tests frequently
- Refactoring becomes risky (no instant validation)
- Technical debt accumulates
- The system decays

Architecture decisions serve this goal. Every choice — in-memory fakes, hexagonal boundaries, deferred I/O — exists to keep the loop fast.

## Anti-Patterns

- **Interfaces upfront** — Defining interfaces before behavior exists. Let them emerge from step 3 of the workflow.
- **Database-first design** — Starting with a schema or ORM. The domain drives the model, not the storage layer.
- **Mocking adapters** — Using mock frameworks for domain tests. Write in-memory fakes with real behavior.
- **Premature real I/O** — Implementing DB/network before API is proven. Defer until in-memory version is stable.
- **Skipping the acceptance test** — Jumping to unit tests without an outer failing test. Every feature starts with an acceptance test.
- **Defaulting to unit tests** — Testing isolated units when integration coverage suffices. Prefer acceptance/component tests; unit test only complex logic.
- **Big-bang integration** — Deferring all integration to the end. The walking skeleton pays integration cost upfront.
- **Over-relying on E2E tests** — Slow tests erode discipline. Fast in-memory tests are the daily driver.
- **Generic data access layers** — Template-style indirections that don't speak the domain language. Each adapter exposes a domain-specific API.
- **N-tier thinking** — Organizing by technical layer instead of domain affinity. Organize by Bounded Context, with adapters at the boundary.
- **Domain types in adapter layer** — Pure types placed in adapters because they "feel" infrastructure-related (API config, message schemas), causing ports and use cases to import outward. Apply the I/O rule: if it has no I/O dependencies, it belongs inside the hexagon regardless of what external concept it represents.

## Listen to the Tests

When a test is hard to write, it is telling you something about your design — not about your testing skills. Difficulty in testing is a **design signal**.

Common signals and what they mean:

- **Hard to set up** — The component has too many dependencies. Consider splitting it or rethinking the adapter boundaries.
- **Hard to assert on** — The component doesn't expose its results clearly. Its API may be hiding or tangling the information the caller needs.
- **Fragile, breaks on refactor** — You're testing implementation details, not behavior. Step back to a higher-scoped test (component or acceptance) and delete the brittle one.
- **Slow** — You're hitting real I/O somewhere. Find the missing adapter boundary and introduce an in-memory fake.

Do not fight the tests. Do not add complexity to make a bad test pass. Reshape the code until the test is easy to write. The tests are your first client — if they struggle with your API, production callers will too.
