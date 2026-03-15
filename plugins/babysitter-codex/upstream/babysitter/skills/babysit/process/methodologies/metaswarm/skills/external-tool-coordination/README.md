# External Tool Coordination Skill

External AI tool integration adapted from [Metaswarm](https://github.com/dsifry/metaswarm) by David Sifry.

## Purpose

Coordinate external AI tools for delegated implementation and cross-model adversarial review.

## Process Flow

1. Detect configured external tools
2. Route work units based on capability and cost
3. Enable cross-model adversarial review
4. Manage escalation chains

## Integration

- **Input from:** Swarm coordinator assignments
- **Output to:** Execution loop (delegated implementation)
- **Process file:** Part of `../../metaswarm-swarm-coordinator.js`
