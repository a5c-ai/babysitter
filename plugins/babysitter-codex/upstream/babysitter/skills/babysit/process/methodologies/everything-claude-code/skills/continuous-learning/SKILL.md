---
name: continuous-learning
description: Pattern extraction, confidence-scored evaluation, skill creation, organization, versioning, and cross-project export pipeline.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Continuous Learning

## Overview

Continuous learning pipeline adapted from the Everything Claude Code methodology. Automatically extracts patterns from development sessions, evaluates them with confidence scoring, and converts high-quality patterns into reusable skills.

## Learning Pipeline

### 1. Pattern Extraction
- Analyze code changes and implementation approaches
- Identify recurring patterns and conventions
- Extract architectural decisions with rationale
- Capture error resolution strategies
- Record tool usage patterns
- Assign initial confidence scores (0-100)

### 2. Pattern Evaluation
- Score generalizability (0-100): cross-project applicability
- Score reliability (0-100): validation frequency
- Score impact (0-100): outcome improvement
- Composite: generalizability * 0.3 + reliability * 0.4 + impact * 0.3
- Filter below confidence threshold (default: 75)
- Merge similar patterns

### 3. Skill Creation
- Convert high-confidence patterns to SKILL.md format
- Write clear instructions with phases
- Include when-to-use and when-not-to-use sections
- Add usage examples and agent references
- Follow kebab-case naming convention

### 4. Organization
- Categorize: language-specific, domain, business, meta
- Resolve naming conflicts
- Update indexes and manifests
- Create dependency graphs

### 5. Version and Export
- Assign semantic versions by maturity
- Create portable export bundles
- Include usage examples and test cases
- Generate import instructions

## Strategic Compaction
- Analyze context token usage
- Identify low-value context for compression
- Archive completed phases to memory files
- Calculate token savings per suggestion

## When to Use

- End of development sessions
- After significant code reviews
- After debugging sessions
- Periodically during long sessions

## Agents Used

- `continuous-learning` (custom agent for this skill)
- `context-engineering` (compaction analysis)
