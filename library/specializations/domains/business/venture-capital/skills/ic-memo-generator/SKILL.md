---
name: ic-memo-generator
description: Generates investment committee memos from due diligence artifacts
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - WebFetch
metadata:
  specialization: venture-capital
  domain: business
  skill-id: vc-skill-031
---

# IC Memo Generator

## Overview

The IC Memo Generator skill creates Investment Committee memos by synthesizing due diligence findings, analysis, and recommendations into a comprehensive decision document. It ensures consistent, thorough IC presentations.

## Capabilities

### Memo Generation
- Generate memos from DD artifacts
- Apply fund-standard memo templates
- Include all required sections
- Support varying detail levels

### DD Synthesis
- Synthesize commercial DD findings
- Incorporate financial analysis
- Summarize technical assessment
- Include legal and management evaluation

### Investment Thesis Articulation
- Articulate investment thesis clearly
- Document key risks and mitigants
- Present return expectations
- Include recommendation and terms

### Supporting Materials
- Generate appendix materials
- Include key data exhibits
- Attach DD backup documents
- Create executive summary version

## Usage

### Generate Full IC Memo
```
Input: DD artifacts, deal parameters
Process: Synthesize into memo format
Output: Complete IC memo document
```

### Create Executive Summary
```
Input: Full memo or DD findings
Process: Distill to key points
Output: One-page executive summary
```

### Update Existing Memo
```
Input: Prior memo, new information
Process: Update and highlight changes
Output: Updated memo with change tracking
```

### Generate Follow-Up Memo
```
Input: IC feedback, additional work
Process: Address IC questions
Output: Follow-up memo document
```

## Memo Sections

| Section | Content |
|---------|---------|
| Executive Summary | Deal overview, recommendation |
| Company Overview | Business, market, team |
| Investment Thesis | Why invest, key drivers |
| Market Analysis | TAM, competition, trends |
| Financial Analysis | Metrics, projections, valuation |
| Risk Assessment | Key risks, mitigants |
| Terms and Structure | Proposed deal terms |
| Recommendation | Investment decision request |

## Integration Points

- **Investment Committee Process**: Core memo skill
- **All DD Processes**: Synthesize findings
- **Deal Scoring Engine**: Include scores
- **IC Presenter (Agent)**: Support presentation

## Memo Quality Criteria

| Criteria | Description |
|----------|-------------|
| Completeness | All required sections addressed |
| Accuracy | Data verified and sourced |
| Clarity | Clear writing and logic |
| Balance | Fair treatment of risks |
| Actionability | Clear recommendation |

## Best Practices

1. Follow fund memo standards consistently
2. Lead with the investment thesis
3. Be honest about risks and uncertainties
4. Support claims with data
5. Anticipate IC questions
