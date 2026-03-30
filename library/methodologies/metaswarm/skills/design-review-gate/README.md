# Design Review Gate Skill

Parallel 6-agent design review adapted from [Metaswarm](https://github.com/dsifry/metaswarm) by David Sifry.

## Purpose

Ensure unanimous approval from 6 specialist agents before implementation begins.

## Process Flow

1. Launch 6 parallel specialist reviews
2. Require unanimous approval
3. Iterate up to 3 times on failures
4. Escalate to human after max iterations

## Integration

- **Input from:** Implementation plan and work units
- **Output to:** Orchestrated execution
- **Process file:** `../../metaswarm-design-review.js`
