# System Overview

→ [Documentation Index](README.md) | Next: [Current State Analysis](current-state.md)

## Purpose

This document describes the current Babysitter system and the bounded scope of V6. It is not a promise of a future fully decomposed platform. It is a grounding document for what exists now, what V6 is trying to improve, and what remains intentionally out of scope.

## Current System Shape

The repository currently works as a monorepo with a strong operational center:

- `packages/sdk` contains the core orchestration model, storage, task system, replay, CLI infrastructure, hooks, harness abstractions, profiles, plugin management, and process-library support.
- `packages/babysitter` exposes the primary CLI package.
- `packages/babysitter-agent` provides the agent runtime layer and operational orchestration support.
- `plugins/*` packages encode real harness-specific integration, packaging, and manifest constraints.

This means V6 begins from a working but tightly coupled system, not from a clean-slate layered platform.

## What The System Must Continue To Do

Any V6 change must preserve the repository's core operational capabilities:

- multi-harness orchestration,
- event-sourced run execution and replay,
- plugin discovery, installation, and packaging,
- session and harness integration,
- process-library and workflow execution,
- CLI-driven developer and automation workflows.

## V6 Scope In System Terms

V6 is a maturity program around this existing system. Its near-term goals are:

- document the real boundaries that already exist,
- reduce ambiguity around candidate seams,
- make packaging and validation failures easier to catch,
- create a decision framework for future extraction rather than assuming extraction is always correct.

## Explicit Non-Scope

The current V6 stage does not require:

- conversion of the system into many new top-level packages,
- a fully formalized runtime/platform/application split,
- new distributed coordination infrastructure as a baseline expectation,
- broad new governance or security subsystems described as if already committed.

## External Integration Reality

The system integrates with external model providers, local CLIs, development environments, and filesystem-backed operational workflows. V6 must respect those realities. Claims about isolation, performance, and deployment flexibility are only mature when they are tied to implementation and verification in that environment.

## Architectural Reading Rule

Use the rest of the V6 documents with this framing:

- current repo reality first,
- small validated change second,
- broader future architecture only as deferred exploration.

---

**Related Documents**: [V6 Vision](v6-vision.md) | [V6 Architecture Specification](v6-architecture-specification.md) | [Package Specifications](package-specs.md)
