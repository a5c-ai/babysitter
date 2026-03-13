---
name: eval-harness
description: Evaluation harness for testing agent and skill quality through structured benchmarks, regression tests, and quality scoring.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Eval Harness

## Overview

Evaluation harness methodology adapted from the Everything Claude Code project. Provides structured frameworks for benchmarking agent performance, testing skill quality, and running regression suites.

## Evaluation Types

### 1. Agent Performance Benchmark
- Define test cases with known-correct outputs
- Run agent against each test case
- Score: accuracy, completeness, relevance
- Compare against baseline performance
- Track performance over time

### 2. Skill Quality Testing
- Verify skill instructions produce expected outcomes
- Test edge cases and boundary conditions
- Measure consistency across multiple runs
- Check for harmful or incorrect outputs
- Validate against ground truth

### 3. Regression Suite
- Collection of previously-passing test cases
- Run after any agent/skill modification
- Flag regressions with before/after comparison
- Maintain pass rate threshold (>= 95%)

### 4. Process Verification
- End-to-end process execution with known inputs
- Verify each phase produces expected outputs
- Check task ordering and dependency satisfaction
- Measure total execution time

## Quality Scoring

### Accuracy Score (0-100)
- Correctness of output vs expected
- Partial credit for partially correct outputs
- Penalty for hallucinated or fabricated content

### Completeness Score (0-100)
- Coverage of required output elements
- Missing sections flagged and scored
- Bonus for useful additional context

### Consistency Score (0-100)
- Run same input 3 times
- Compare outputs for semantic similarity
- Flag inconsistencies

### Composite Score
- (accuracy * 0.4 + completeness * 0.3 + consistency * 0.3)
- Threshold: 80 to pass

## When to Use

- After creating new agents or skills
- After modifying existing agents or skills
- Periodic quality audits
- Before promoting skills to production

## Agents Used

- Used by process-level evaluation orchestrators
- No specific agent dependency (evaluates other agents)
