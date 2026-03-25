# CC10X Router Agent

The router agent is the mandatory single entry point for all CC10X development tasks. It detects user intent from the request text and dispatches to one of four workflows: BUILD, DEBUG, REVIEW, or PLAN.

## Intent Detection Priority

1. **ERROR/DEBUG** (highest): error, bug, fix, broken, troubleshoot, debug
2. **PLAN**: plan, design, architect, roadmap, strategy
3. **REVIEW**: review, audit, check, analyze, assess
4. **BUILD** (default): everything else

## Agent Chains by Workflow

- **BUILD**: component-builder -> [code-reviewer || silent-failure-hunter] -> integration-verifier
- **DEBUG**: bug-investigator -> code-reviewer -> integration-verifier
- **REVIEW**: code-reviewer (single, multi-dimensional)
- **PLAN**: planner (single, with github-researcher)

## Memory Management

Loads three files from `.claude/cc10x/` before routing and updates them after workflow completion.

## Invocation

Used by process: `methodologies/cc10x/cc10x-router`
