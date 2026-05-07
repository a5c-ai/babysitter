---
title: Testing and Validation Framework
description: Current proof surfaces, validation commands, and documentation QA gates for V6 work.
last_updated: 2026-04-26
---

# Testing and Validation Framework

→ [Documentation Index](./README.md) | Previous: [Security Architecture](./security-architecture.md) | Next: [Performance Considerations](./performance-docs.md)

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
| Architecture boundaries | `npm run test:architecture` | Enforces the `@a5c-ai/babysitter-agent` seam contract and repo package-family dependency rules for the current orchestration, dispatch, support, consumer, and distribution surfaces |
| Plugin packaging checks | `npm run validate:ci --prefix plugins/<plugin>` for first-class plugins | Packaged-install and integration validation for the listed plugin packages |
| Metadata checks | `npm run verify:metadata` | Repository/package metadata consistency checks only |
| Docs quality | `npm run docs:qa` | Markdown/style lint, command-sample validation, repo freshness reporting, evidence freshness, and Docusaurus broken-link/build validation for the staged docs corpus |
| CI wiring | `.github/workflows/ci.yml`, `.github/workflows/release.yml`, `.github/workflows/staging-publish.yml`, `.github/workflows/docs-site.yml` | The commands above are run in automation where those workflows explicitly invoke them |

## What The Current Surface Does Not Prove

The current automated surface does **not** provide a dedicated repository-wide gate for:

- interface contract compliance across all package seams,
- runtime/platform/application validation as distinct required lanes,
- continuous architectural compliance beyond the build, test, packaging, and metadata checks already named above.

Those ideas may still be good future targets, but they are not current guarantees. V6 documents should therefore avoid describing them as implemented enforcement.

## Current Position On Layered Validation Language

V6 may still use runtime, platform, and application language as architectural framing, but that framing is not the same thing as an implemented test matrix. Today the proof surface is package- and workflow-oriented, not a dedicated per-layer gate system.

The nearest concrete validations available now are:

- SDK/package tests for the current runtime and CLI surface,
- `npm run test:architecture` for the current seam contract and documented package-family dependency boundaries,
- hooks-mux and agent-mux build/test commands for the current integration seams,
- plugin `validate:ci` checks for packaged plugin behavior,
- docs QA and metadata checks for publication hygiene.

Docker-based E2E coverage is being reset from scratch and should not be treated as an available or required repository gate until a new strategy lands. The proposed replacement strategy now lives in [Testing Strategy](../testing/).

## Current Slice: Architecture-Gate Validation

Architecture-boundary testing now exists as an explicit repository slice.

| Slice item | Owner | Required commands | Status |
| --- | --- | --- | --- |
| Architecture boundary gate | SDK maintainers | `npm run test:architecture` | Implemented |
| Interface contract gate | SDK maintainers | Add and wire `npm run test:contracts` | Deferred, not implemented today |
| CI promotion of architecture gates | CI maintainers | Run `npm run test:architecture` in `.github/workflows/ci.yml`, `release.yml`, and `staging-publish.yml` | Implemented |
| Documentation claim promotion | V6 documentation owners | Cite the implemented command and workflow gates where architecture claims depend on them | Implemented for the current architecture gate slice |

Today `npm run test:architecture` proves two current claims only:

- the accepted `@a5c-ai/babysitter-agent` seam contract still matches the owned top-level runtime domains and public exports,
- repo package dependencies still follow the documented direction of the orchestration core, dispatch layer, support systems, downstream consumers, and first-class distribution bundles.

It does not yet prove broad interface-contract compliance or a full runtime/platform/application matrix.

---

**Related Documents**: [Security Architecture](security-architecture.md) | [Package Specifications](package-specs.md) | [Performance Considerations](performance-docs.md)
