# Plan Review Gate Skill

Adversarial plan review adapted from [Metaswarm](https://github.com/dsifry/metaswarm) by David Sifry.

## Purpose

Validate implementation plans through 3 independent adversarial reviewers before user presentation.

## Process Flow

1. Feasibility review (can it be built?)
2. Completeness review (is anything missing?)
3. Scope & alignment review (does it match the issue?)

## Integration

- **Input from:** Architect agent's implementation plan
- **Output to:** Design review gate
- **Process file:** Part of `../../metaswarm-orchestrator.js`
