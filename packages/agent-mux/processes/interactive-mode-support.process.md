# Interactive Mode Support Process

This process is focused on `todos.md:40`: making interactive mode genuinely supported, including ANSI/plaintext parsing when a harness cannot emit structured JSON during interactive sessions.

High-level flow:

1. Read the exact TODO line as the spec source of truth.
2. Audit the live runtime call path from CLI/UI/gateway/core/adapters into harness execution and capability discovery.
3. Author or extend tests first so the missing behavior is pinned down before implementation.
4. Implement the runtime-path fixes across the affected adapters/core/CLI semantics.
5. Run deterministic gates: targeted Vitest suites plus a full build.
6. Run lightweight smoke checks against the built CLI path.
7. Capture the actual diff and run an adversarial review against the spec.
8. Loop implementation and review until approved or the retry budget is exhausted.

Quality bars:

- Capability discovery must be honest about interactive structured transport.
- Interactive mode must work even when the harness only provides ANSI/plaintext interaction.
- Non-interactive behavior must not regress.
- Verification must be deterministic before approval.
