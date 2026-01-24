---
name: proof-structure-analyzer
description: Analyze and restructure mathematical proofs for clarity and completeness
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Task
metadata:
  version: "1.0"
  category: theorem-proving
  domain: mathematics
  backlog-id: SK-MATH-005
  tools:
    - Natural language parsing
    - Formal logic representation
  processes:
    - proof-writing-assistance
    - theorem-proof-verification
---

# Proof Structure Analyzer Skill

## Purpose

Provides analysis and restructuring of mathematical proofs to improve clarity, identify gaps, and ensure completeness.

## Capabilities

- **Strategy Identification**: Identify proof strategies (induction, contradiction, etc.)
- **Dependency Graph**: Construct dependency graphs between steps
- **Gap Detection**: Detect gaps in reasoning chains
- **Outline Generation**: Generate proof outlines
- **Lemma Extraction**: Suggest lemma extractions
- **Clarity Assessment**: Assess proof clarity

## Usage Guidelines

1. **Proof Analysis**
   - Parse proof structure
   - Identify main strategy
   - Map step dependencies

2. **Gap Identification**
   - Check logical completeness
   - Identify implicit assumptions
   - Flag unclear steps

3. **Restructuring**
   - Suggest clearer organization
   - Extract reusable lemmas
   - Improve step ordering

4. **Best Practices**
   - Maintain logical flow
   - Document all assumptions
   - Keep steps verifiable
