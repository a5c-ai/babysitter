# PR Shepherding Skill

PR lifecycle management adapted from [Metaswarm](https://github.com/dsifry/metaswarm) by David Sifry.

## Purpose

Monitor PR from creation through merge with CI monitoring, comment handling, and merge readiness verification.

## Process Flow

1. Monitor CI pipeline
2. Handle review comments
3. Resolve threads
4. Verify merge readiness (gtg check)

## Integration

- **Input from:** Completed orchestrated execution
- **Output to:** Merged PR
- **Process file:** `../../metaswarm-pr-shepherd.js`
