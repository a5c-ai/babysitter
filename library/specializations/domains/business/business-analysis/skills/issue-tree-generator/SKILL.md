---
name: issue-tree-generator
description: Generate and validate issue trees for structured problem solving with MECE validation
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: business-analysis
  domain: business
  id: SK-011
  category: Problem Solving
---

# Issue Tree Generator

## Overview

The Issue Tree Generator skill provides specialized capabilities for creating and validating issue trees used in structured problem solving. This skill enables hypothesis-driven analysis through proper decomposition of complex problems, MECE validation, hypothesis tracking, and synthesis of findings.

## Capabilities

### Issue Tree Creation
- Create issue trees from problem statements
- Decompose complex problems into sub-issues
- Generate multiple levels of decomposition
- Apply standard issue tree frameworks

### MECE Structure Validation
- Validate MECE structure (Mutually Exclusive, Collectively Exhaustive)
- Identify overlapping branches
- Detect missing branches
- Score MECE compliance

### Hypothesis Tree Generation
- Generate hypothesis trees from issue trees
- Convert issues into testable hypotheses
- Create null and alternative hypotheses
- Link hypotheses to data requirements

### Hypothesis Testing Tracking
- Track hypothesis testing progress
- Record test results and evidence
- Update hypothesis status (proved/disproved/inconclusive)
- Calculate testing completion percentage

### Evidence Linking
- Link evidence to hypotheses
- Document evidence sources
- Rate evidence strength
- Track evidence gaps

### Synthesis Generation
- Generate synthesis from proved/disproved hypotheses
- Build argument chains from evidence
- Create recommendation frameworks
- Develop "so what" statements

### Visual Tree Export
- Export to visual tree diagrams
- Generate Markdown tree structures
- Create hierarchical outlines
- Support multiple visualization formats

## Usage

### Create Issue Tree
```
Create an issue tree for this problem:
[Problem statement]

Decompose to at least 3 levels with MECE validation.
```

### Validate MECE
```
Validate the MECE structure of this issue tree:
[Issue tree structure]

Identify overlaps and gaps.
```

### Generate Hypotheses
```
Generate hypotheses from this issue tree:
[Issue tree structure]

Create testable hypotheses with data requirements.
```

### Synthesize Findings
```
Synthesize findings from these hypothesis test results:
[Hypothesis results with evidence]

Build recommendations from proved hypotheses.
```

## Process Integration

This skill integrates with the following business analysis processes:
- hypothesis-driven-analysis.js - Core hypothesis work
- consulting-engagement-planning.js - Problem structuring
- process-gap-analysis.js - Root cause decomposition
- business-case-development.js - Business problem analysis

## Dependencies

- Tree data structures
- MECE validation algorithms
- Visualization libraries
- Synthesis templates

## Issue Tree Reference

### Issue Tree Structure
```
Problem Statement
├── Issue 1
│   ├── Sub-issue 1.1
│   │   ├── Sub-sub-issue 1.1.1
│   │   └── Sub-sub-issue 1.1.2
│   └── Sub-issue 1.2
├── Issue 2
│   ├── Sub-issue 2.1
│   └── Sub-issue 2.2
└── Issue 3
    ├── Sub-issue 3.1
    └── Sub-issue 3.2
```

### Standard Decomposition Frameworks

#### Revenue Growth Tree
```
How to grow revenue?
├── Increase volume
│   ├── Acquire new customers
│   └── Increase purchase frequency
└── Increase price
    ├── Raise unit prices
    └── Improve mix to premium
```

#### Profitability Tree
```
How to improve profitability?
├── Increase revenue
│   ├── Volume
│   └── Price
└── Decrease costs
    ├── Fixed costs
    └── Variable costs
```

#### Market Entry Tree
```
Should we enter market X?
├── Is the market attractive?
│   ├── Size and growth
│   └── Competitive dynamics
├── Can we win?
│   ├── Our capabilities
│   └── Competitive advantage
└── Is it worth it?
    ├── Financial returns
    └── Strategic fit
```

### Hypothesis Status Tracking
| Status | Definition |
|--------|------------|
| Untested | Hypothesis identified, not yet tested |
| In Progress | Data collection/analysis underway |
| Proved | Evidence supports hypothesis |
| Disproved | Evidence refutes hypothesis |
| Inconclusive | Insufficient evidence either way |

### Evidence Strength Ratings
| Rating | Description |
|--------|-------------|
| Strong | Multiple reliable sources, quantitative data |
| Moderate | Some reliable sources, mixed data |
| Weak | Limited sources, primarily qualitative |
| Anecdotal | Single source, opinion-based |

### MECE Validation Checklist
- [ ] Each branch addresses a distinct aspect
- [ ] No overlap in definitions between branches
- [ ] All possibilities are covered
- [ ] Branches are at consistent level of detail
- [ ] Same logic applies at each level

### Synthesis Framework
1. **What we found**: Key findings from analysis
2. **So what**: Implications of findings
3. **Now what**: Recommended actions
