# Testing Strategy: The Testing Matrix

These illustrate the principles. Consider what fits your context.

## The Testing Matrix

The traditional testing pyramid is too simplistic for distributed systems. Categorize tests across two dimensions: **Speed** (Fast vs. Slow) and **Scope** (Small vs. Large).

### Fast + Small Scope: Unit Tests
- Pure logic, CPU-bound, sub-millisecond execution
- No I/O, no side effects
- Test individual functions and algorithms

### Fast + Large Scope: Acceptance & Component Tests (PRIMARY FOCUS)
- **Acceptance Tests**: Service-level scope. Exercise all components integrated via in-memory adapters. This is where features are proven.
- **Component Tests**: Bounded context scope. Drive the design of specific internal modules (e.g., a consensus algorithm, a pricing engine).
- Both use in-memory fakes — no disk, no network, no database.
- Sub-second execution is mandatory.

### Slow + Small Scope: Contract Tests
- Verify that the "real" adapter (actual disk I/O, network, database) behaves exactly like the in-memory fake.
- Run sparingly — only after the in-memory logic is solid.
- They are the bridge between the fast in-memory world and production I/O.
- If a contract test fails, the real adapter has a bug. The domain logic is already proven correct by the fast tests.

### Slow + Large Scope: E2E Tests
- Full production-like environment (Docker, TCP, real I/O).
- Minimize these. They are I/O intensive, flaky, and slow.
- Use only for smoke testing critical production paths.
- A reliance on slow tests leads to less frequent testing and higher regression risk.

## The Daily Loop

The core development team operates in the Fast + Large quadrant. Acceptance and component tests are the daily driver. They provide:
- Instant feedback on whether a feature works
- Confidence to refactor aggressively
- Coverage of component integration without I/O overhead

Contract tests and E2E tests run in CI or on-demand, not in the tight development loop.

## Contract Test Pattern

A contract test verifies behavioral equivalence between the fake and the real adapter:

1. Define a shared test suite that exercises the adapter interface
2. Run it against the in-memory fake (fast, always passes if domain logic is correct)
3. Run the same suite against the real adapter (slower, may reveal I/O-specific bugs)
4. Both must produce identical results

If the real adapter diverges from the fake, the contract test catches it. This keeps the fast test suite trustworthy.

## Acceptance and Component Tests Are the Rule. Unit Tests Are the Exception.

The primary testing instruments are **acceptance tests** and **component tests** — both fast, both large-scoped, both exercising real integration through in-memory adapters.

**Acceptance tests** are scoped at the **service/system boundary**. They wire together all relevant Bounded Contexts using in-memory adapters and exercise behavior end-to-end within the process. They are the starting point for every feature and the last safety net before slow tests. Write them so they read as **specifications** — a reader should understand what the system does by reading the acceptance tests, without looking at the implementation.

**Component tests** are scoped at the **Bounded Context level**. They drive the design of one internal module (e.g., a consensus algorithm, a payment processor, an order pipeline). They test the integration of objects within that Bounded Context, again using in-memory adapters at the boundary.

**Unit tests** are the exception, not the rule. Use them only when a piece of logic is genuinely complex, algorithmic, or combinatorial — where isolating it from the rest of the system makes the test significantly clearer or faster. Do not default to unit tests. If the behavior can be covered by an acceptance or component test at acceptable speed, prefer that.

The goal: **test the integration of real objects through real code paths**, not isolated units behind mocks.
