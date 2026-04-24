# Testing and Validation Framework

→ [Documentation Index](README.md) | Previous: [Security Architecture](security-architecture.md) | Next: [Performance Considerations](performance-docs.md)

## Purpose

This document records the current proving surface for V6-related testing and validation claims. It is intentionally narrower than earlier drafts. A claim is normative only when the repository exposes a command or workflow that exercises it today.

## Current Automated Validation Surface

The current repository provides these concrete validation commands and workflow gates:

| Surface | Commands / workflow | What it proves today |
| --- | --- | --- |
| SDK correctness | `npm run lint --workspace=@a5c-ai/babysitter-sdk`, `npm run build:sdk`, `npm run test:sdk` | TypeScript linting, buildability, and SDK test coverage for the current package surface |
| Hooks mux | `npm run build:hooks-mux`, `npm run test:hooks-mux` | Build and test coverage for the current hooks-mux packages |
| Agent mux | `npm run build:agent-mux`, `npm run test:agent-mux` | Build and test coverage for the current agent-mux packages |
| Agent plugins mux | `npm run build --workspace=@a5c-ai/agent-plugins-mux`, `npm run test --workspace=@a5c-ai/agent-plugins-mux` | Build and test coverage for the current compiler package |
| Breakpoints mux | `npm run build --workspace=@a5c-ai/breakpoints-mux`, `npm run typecheck --workspace=@a5c-ai/breakpoints-mux`, `npm run test --workspace=@a5c-ai/breakpoints-mux` | Build, typecheck, and test coverage for the current breakpoints workspace |
| Plugin packaging checks | `npm run validate:ci --prefix plugins/<plugin>` for first-class plugins | Packaged-install and integration validation for the listed plugin packages |
| Metadata checks | `npm run verify:metadata` | Repository/package metadata consistency checks only |
| Docs build | `npm run docs:build` | Docusaurus buildability for the docs site |
| CI wiring | `.github/workflows/ci.yml`, `.github/workflows/docs-site.yml` | The commands above are run in automation where those workflows explicitly invoke them |

## What The Current Surface Does Not Prove

The current automated surface does **not** provide a dedicated repository-wide gate for:

- architectural layer-boundary enforcement,
- interface contract compliance across all package seams,
- runtime/platform/application validation as distinct required lanes,
- continuous architectural compliance beyond the build, test, packaging, and metadata checks already named above.

Those ideas may still be good future targets, but they are not current guarantees. V6 documents should therefore avoid describing them as implemented enforcement.

## Current Position On Layered Validation Language

V6 may still use runtime, platform, and application language as architectural framing, but that framing is not the same thing as an implemented test matrix. Today the proof surface is package- and workflow-oriented, not a dedicated per-layer gate system.

The nearest concrete validations available now are:

- SDK/package tests for the current runtime and CLI surface,
- hooks-mux and agent-mux build/test commands for the current integration seams,
- plugin `validate:ci` checks for packaged plugin behavior,
- docs and metadata checks for publication hygiene.

An available but not currently required command such as `npm run test:e2e:docker` should be treated as optional coverage unless a roadmap slice explicitly promotes it into a required gate.

## Deferred Future Slice: Architecture-Gate Validation

Architecture-boundary testing and contract validation are deferred until they are implemented as an explicit slice.

| Slice item | Owner | Required commands | Status |
| --- | --- | --- | --- |
| Architecture boundary gate | SDK maintainers | Add and wire `npm run test:architecture` | Deferred, not implemented today |
| Interface contract gate | SDK maintainers | Add and wire `npm run test:contracts` | Deferred, not implemented today |
| CI promotion of architecture gates | CI maintainers | Add the new commands to `.github/workflows/ci.yml` | Deferred, not implemented today |
| Documentation claim promotion | V6 documentation owners | Update V6 docs only after the new commands exist and run in CI | Deferred, not implemented today |

Until that slice lands, the V6 testing story should cite only the commands and workflows in the current automated validation surface.

---

**Related Documents**: [Security Architecture](security-architecture.md) | [Package Specifications](package-specs.md) | [Performance Considerations](performance-docs.md)
