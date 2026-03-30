# Adversarial Review Skill

Fresh adversarial code review adapted from [Metaswarm](https://github.com/dsifry/metaswarm) by David Sifry.

## Purpose

Independent spec compliance verification with binary PASS/FAIL verdicts and evidence citations.

## Process Flow

1. Spawn fresh reviewer (no previous context)
2. Check each DoD item for compliance
3. Cite file:line evidence for all findings
4. Deliver binary PASS/FAIL verdict

## Integration

- **Input from:** Quality gate validation (must pass first)
- **Output to:** Commit phase (on PASS) or retry (on FAIL)
- **Process file:** Part of `../../metaswarm-execution-loop.js`
