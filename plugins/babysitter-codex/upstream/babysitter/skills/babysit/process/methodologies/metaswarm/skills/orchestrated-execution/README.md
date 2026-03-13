# Orchestrated Execution Skill

4-phase execution loop adapted from [Metaswarm](https://github.com/dsifry/metaswarm) by David Sifry.

## Purpose

Execute work units through Implement -> Validate -> Adversarial Review -> Commit with blocking quality gates.

## Process Flow

1. TDD implementation within declared file scope
2. Independent quality gate validation (tsc, eslint, vitest)
3. Fresh adversarial review (binary PASS/FAIL)
4. Scoped commit with DoD verification

## Integration

- **Input from:** Plan review gate approval
- **Output to:** Final comprehensive review
- **Process file:** `../../metaswarm-execution-loop.js`
