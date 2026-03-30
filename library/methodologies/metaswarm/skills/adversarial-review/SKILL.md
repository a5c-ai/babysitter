---
name: adversarial-review
description: Fresh adversarial code review with binary PASS/FAIL verdicts, evidence citations, and anchoring bias prevention via fresh reviewer spawning.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, WebFetch, WebSearch, Agent, AskUserQuestion
---

# Adversarial Review

## Overview

Independent adversarial code review checking spec compliance. Uses binary PASS/FAIL verdicts (not subjective feedback) with required file:line evidence citations.

## When to Use

- After quality gates pass in the execution loop
- For final comprehensive cross-unit review
- When verifying spec compliance of any implementation

## Key Differences from Collaborative Review

| Aspect | Collaborative | Adversarial |
|--------|--------------|-------------|
| Goal | Help improve code | Verify spec compliance |
| Verdict | Suggestions | Binary PASS/FAIL |
| Evidence | Optional | Required (file:line) |
| Reviewer | Can be reused | Must be fresh |
| Context | Shared | Independent |

## Fresh Reviewer Rule

On re-review after FAIL, a NEW reviewer instance spawns with no memory of the previous review. This prevents anchoring bias where a reviewer fixates on previously identified issues.

## Anti-Patterns

- Reusing reviewers after FAIL
- Passing previous findings to new reviewers
- Providing subjective or advisory feedback
- Accepting partial compliance as PASS

## Tool Use

Invoke as part of: `methodologies/metaswarm/metaswarm-execution-loop` (Phase 3)
