---
title: Agent Mux Reference
description: Normative API and behavior reference for @a5c-ai/agent-mux, ordered by how users encounter the package.
last_updated: 2026-04-27
category: landing
---

# Agent Mux Reference

This directory is the canonical contract for current `@a5c-ai/agent-mux` behavior.

## Audience

- Package consumers who need the current API surface
- Maintainers reviewing a behavior change against the normative docs
- Integrators checking capability, session, and invocation rules

## Recommended Reading Order

1. Core types and client
2. Run options and profiles
3. Run handle and interaction
4. Agent events
5. Adapter system
6. Capabilities and models
7. Session manager
8. Config and auth
9. Plugin manager
10. CLI reference
11. Process lifecycle and platform
12. Built-in adapters
13. Invocation modes
14. Harness mock
15. Hooks

Adapter-specific notes live under `agents/` and should be treated as reference supplements, not separate product sections.
