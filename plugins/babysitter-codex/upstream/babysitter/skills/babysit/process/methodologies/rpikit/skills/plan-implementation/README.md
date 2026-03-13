# Plan Implementation Skill

Disciplined plan execution adapted from [RPIKit](https://github.com/bostonaholic/rpikit) by Matthew Boston.

## Purpose

Execute approved plans step-by-step with verification, checkpoints, and mandatory reviews.

## Process Flow

1. Load and validate approved plan
2. Optional worktree isolation
3. Step-by-step execution with verification
4. Phase checkpoints with human approval
5. Code review and security review
6. Completion summary

## Integration

- **Input from:** `plan-writing` skill (approved plan document)
- **Output to:** Completed implementation with review results
- **Process file:** `../../rpikit-implement.js`
