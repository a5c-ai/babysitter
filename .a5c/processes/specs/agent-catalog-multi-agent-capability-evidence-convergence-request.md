# Agent Catalog Multi-Agent Capability Evidence Convergence Request

Focused follow-up request after the Claude-only evidence pass.

## Request

```text
still missing online evidences for the claude.yaml which claims inherent capabilities.

do a babysitter process, this part was not thorough enough - not shell kind tasks in the new process
make sure not only to cover only claude code, but also codex, gemini cli,  omp, opencode, cursor and copilot.
```

## Constraints

- Use the YAML graph under `packages/agent-catalog/graph` as the source of truth.
- Keep evidence split into focused shards instead of growing the biggest YAML files.
- The new Babysitter process must not define any `shell` kind tasks.
- Cover official or first-party public evidence for external agents when available.
- Prefer direct vendor documentation over broad marketing pages.
- If a capability lacks direct official documentation, keep the repo evidence and reduce overclaiming instead of inventing stronger proof.
- Update both capability support rows and provenance edges so each capability row points only to the claims that actually support it.
- Cover Codex, Gemini CLI, GitHub Copilot, Cursor, OpenCode, and OMP in addition to the already-improved Claude coverage.
- Prove the catalog still exports evidence and passes its build, tests, and version checks.
