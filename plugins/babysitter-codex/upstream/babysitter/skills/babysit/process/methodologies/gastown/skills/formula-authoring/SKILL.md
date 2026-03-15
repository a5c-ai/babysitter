---
name: formula-authoring
description: Author TOML-based Formula workflow templates that become Protomolecules and active Molecules in Gas Town's durable workflow system.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, WebFetch, WebSearch, Agent, AskUserQuestion
---

# Formula Authoring

## Overview

Create and manage TOML-based Formula templates that define repeatable multi-step workflows. Formulas are cooked into Protomolecules (frozen, ready to instantiate) and then activated as Molecules (durable, checkpoint-able workflows).

## When to Use

- Defining repeatable workflow templates
- Creating multi-step processes with variable binding
- Building workflows that must survive restarts
- When NDI (Nondeterministic Idempotence) is needed

## Process

1. **Define** formula steps and variables in TOML format
2. **Validate** formula structure and dependencies
3. **Cook** into protomolecule (resolve variables, freeze)
4. **Test** by instantiating a trial molecule
5. **Register** in the formula library for reuse

## Formula Lifecycle

```
Formula (TOML template) -> Protomolecule (frozen) -> Molecule (active, durable)
```

## Key Concepts

- **Formula**: TOML-based workflow template with variables
- **Protomolecule**: Frozen template ready to instantiate
- **Molecule**: Active durable workflow surviving restarts
- **NDI**: Nondeterministic Idempotence - useful outcomes from unreliable processes

## Tool Use

Invoke via babysitter process: `methodologies/gastown/gastown-molecule`
