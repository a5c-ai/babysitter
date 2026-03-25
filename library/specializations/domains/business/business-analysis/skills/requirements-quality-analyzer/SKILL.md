---
name: requirements-quality-analyzer
description: Specialized skill for analyzing and scoring requirements quality against BABOK and IEEE 29148 standards
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: business-analysis
  domain: business
  id: SK-001
  category: Requirements Engineering
---

# Requirements Quality Analyzer

## Overview

The Requirements Quality Analyzer skill provides specialized capabilities for analyzing and scoring requirements quality against industry standards including BABOK (Business Analysis Body of Knowledge) and IEEE 29148 (Requirements Engineering). This skill enables automated validation, quality scoring, and improvement recommendations for requirements documentation.

## Capabilities

### INVEST Criteria Validation
- Validate requirements against INVEST criteria (Independent, Negotiable, Valuable, Estimable, Small, Testable)
- Score each criterion on a standardized scale
- Generate specific feedback for non-compliant requirements

### SMART Criteria Assessment
- Assess requirements for SMART criteria compliance (Specific, Measurable, Achievable, Relevant, Time-bound)
- Identify gaps in requirement specificity
- Recommend improvements for vague or incomplete requirements

### Language Quality Analysis
- Detect ambiguous language patterns (e.g., "may", "should", "appropriate")
- Identify passive voice usage that obscures accountability
- Flag jargon and undefined acronyms
- Check for consistent terminology usage

### Acceptance Criteria Validation
- Identify incomplete or missing acceptance criteria
- Validate Given-When-Then format compliance
- Check for testability of acceptance criteria
- Ensure acceptance criteria align with requirement intent

### Quality Scoring
- Calculate completeness scores based on required fields
- Assess consistency across related requirements
- Evaluate testability based on measurable outcomes
- Generate composite quality scores

### Duplicate and Conflict Detection
- Flag duplicate or near-duplicate requirements
- Identify conflicting requirements within the same scope
- Detect overlapping requirements across features
- Highlight dependency conflicts

### Improvement Recommendations
- Generate prioritized improvement recommendations
- Provide rewrite suggestions for low-quality requirements
- Create quality improvement action plans
- Track quality improvement over time

## Usage

### Basic Quality Analysis
```
Analyze the following requirements for quality:
[Requirements list]

Apply BABOK and IEEE 29148 standards to score each requirement.
```

### INVEST Validation
```
Validate these user stories against INVEST criteria:
[User stories]

Provide a detailed score for each criterion and improvement suggestions.
```

### Comprehensive Quality Report
```
Generate a comprehensive quality report for this BRD:
[BRD content]

Include quality scores, issues identified, and prioritized recommendations.
```

## Process Integration

This skill integrates with the following business analysis processes:
- requirements-elicitation-workshop.js - Quality validation during elicitation
- brd-creation.js - Quality assurance for BRD content
- user-story-development.js - INVEST validation for user stories
- requirements-traceability.js - Quality tracking across requirement lifecycle

## Dependencies

- NLP capabilities for ambiguity detection
- BABOK templates and standards reference
- IEEE 29148 requirements engineering standards
- Quality scoring algorithms

## Quality Standards Reference

### BABOK Knowledge Areas
- Business Analysis Planning and Monitoring
- Elicitation and Collaboration
- Requirements Life Cycle Management
- Strategy Analysis
- Requirements Analysis and Design Definition
- Solution Evaluation

### IEEE 29148 Requirements Characteristics
- Necessary
- Implementation-free
- Unambiguous
- Consistent
- Complete
- Singular
- Feasible
- Traceable
- Verifiable
