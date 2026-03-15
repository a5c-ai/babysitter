---
name: term-sheet-generator
description: Generates term sheets from templates with standard and custom provisions
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
  skill-id: vc-skill-027
---

# Term Sheet Generator

## Overview

The Term Sheet Generator skill creates term sheets from templates incorporating standard and custom provisions. It enables rapid term sheet production while ensuring consistency with fund standards and market norms.

## Capabilities

### Template Management
- Maintain standard term sheet templates
- Support stage-specific templates (seed, Series A, growth)
- Enable custom clause libraries
- Version control template updates

### Term Sheet Generation
- Generate term sheets from parameters
- Auto-populate economic terms
- Include appropriate governance provisions
- Add deal-specific custom terms

### Economic Term Configuration
- Configure pre-money valuation and round size
- Set liquidation preferences and participation
- Define anti-dilution provisions
- Specify dividend rights

### Governance Term Configuration
- Define board composition
- Set protective provisions
- Configure information rights
- Specify drag-along and tag-along rights

## Usage

### Generate Standard Term Sheet
```
Input: Deal parameters, template selection
Process: Populate template, apply standards
Output: Draft term sheet document
```

### Configure Economic Terms
```
Input: Valuation, investment size, preferences
Process: Configure economic provisions
Output: Economic term summary
```

### Add Custom Provisions
```
Input: Base term sheet, custom requirements
Process: Insert custom clauses
Output: Customized term sheet
```

### Generate Comparison View
```
Input: Proposed terms, alternatives
Process: Create side-by-side comparison
Output: Term comparison matrix
```

## Standard Term Categories

| Category | Key Terms |
|----------|-----------|
| Economic | Price, preferences, participation, anti-dilution |
| Control | Board seats, protective provisions, voting |
| Information | Reporting, inspection, observer rights |
| Exit | Drag-along, tag-along, ROFR, co-sale |
| Other | Founder vesting, ESOP, no-shop |

## Integration Points

- **Term Sheet Drafting Process**: Core generation skill
- **Term Comparator**: Compare generated vs. alternatives
- **Term Sheet Negotiator (Agent)**: Support negotiations
- **Definitive Document Negotiation**: Feed into docs

## Template Library

| Template | Use Case |
|----------|----------|
| Seed Financing | Pre-seed and seed rounds |
| Series A | Institutional first round |
| Growth Round | Series B and later |
| Bridge Financing | Bridge notes and extensions |
| SAFE | Simple Agreement for Future Equity |

## Best Practices

1. Start from fund-standard templates
2. Clearly mark non-standard terms
3. Use plain English where possible
4. Include term explanations for founders
5. Maintain audit trail of changes
