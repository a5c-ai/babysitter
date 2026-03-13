# Work Unit Decomposition Skill

Work unit decomposition adapted from [Metaswarm](https://github.com/dsifry/metaswarm) by David Sifry.

## Purpose

Decompose plans into discrete work units with DoD items, file scope, and dependency mapping.

## Process Flow

1. Analyze approved implementation plan
2. Identify natural work unit boundaries
3. Enumerate DoD items per unit
4. Declare file scopes and dependencies
5. Flag human checkpoints

## Integration

- **Input from:** Plan review gate approval
- **Output to:** Orchestrated execution loop
- **Process file:** Part of `../../metaswarm-orchestrator.js`
