# User Research Synthesis Skill

## Overview

The User Research Synthesis skill transforms raw qualitative research data into structured, actionable product insights. It provides systematic methods for analyzing interview transcripts, identifying patterns, and generating evidence-based recommendations.

## Purpose

Qualitative user research generates rich data but requires careful synthesis to extract value. This skill enables:

- **Systematic Analysis**: Apply consistent coding and theming methodologies
- **Evidence-Based Insights**: Generate insights backed by multiple data points
- **Persona Development**: Create research-informed user personas
- **Actionable Outputs**: Produce recommendations that drive product decisions

## Use Cases

### 1. Interview Synthesis
Analyze multiple user interviews to identify common patterns, pain points, and opportunities.

### 2. Voice of Customer Analysis
Synthesize feedback from support tickets, surveys, and user interviews into unified insights.

### 3. JTBD Discovery
Extract Jobs-to-be-Done from research data to inform feature prioritization.

### 4. Persona Validation
Update or create personas based on fresh research findings.

## Processes That Use This Skill

- **Jobs-to-be-Done Analysis** (`jtbd-analysis.js`)
- **User Story Mapping** (`user-story-mapping.js`)
- **Product-Market Fit Assessment** (`product-market-fit.js`)
- **Feature Definition and PRD** (`feature-definition-prd.js`)

## Input Requirements

### Supported Data Types

| Data Type | Format | Content |
|-----------|--------|---------|
| Interview Transcripts | .txt, .md, .docx | Verbatim interview recordings |
| Survey Responses | .csv, .xlsx | Open-ended response data |
| Support Tickets | .csv, .json | Customer issue descriptions |
| Feedback Logs | .json, .csv | In-app feedback submissions |

### Minimum Data Requirements

- At least 5 data points for emerging themes
- At least 8-10 interviews for reliable patterns
- 3+ sources for high-confidence insights

## Output Formats

### Insight Document
```markdown
## Insight: Users struggle with initial setup

**Confidence**: High (12 supporting observations)
**Theme**: Onboarding Experience

### Evidence
- "I had no idea where to start" - P001
- "The setup wizard was confusing" - P003
- "Took me three tries to configure" - P007

### Recommendation
Implement guided setup wizard with progress indicators
```

### Affinity Diagram
```markdown
# First-Time Experience
## Onboarding
- Setup confusion (P001, P003, P007)
- Missing documentation (P002, P005)
## Learning Curve
- Feature discovery (P004, P008)
- Terminology confusion (P006, P009)
```

### Persona Attributes
```json
{
  "persona": "Power User",
  "demographics": {
    "experience_level": "advanced",
    "usage_frequency": "daily"
  },
  "behaviors": ["batch_processing", "keyboard_shortcuts"],
  "goals": ["efficiency", "automation"],
  "frustrations": ["slow_performance", "limited_export"],
  "quotes": ["I need to process hundreds of items quickly"]
}
```

## Workflow

### Phase 1: Data Preparation
1. Collect all research materials
2. Standardize formats
3. Remove PII / anonymize participants
4. Create tracking spreadsheet

### Phase 2: Initial Coding
1. Read through each transcript
2. Apply open codes to significant statements
3. Track codes in master list
4. Note metadata (participant, timestamp)

### Phase 3: Theme Development
1. Group related codes into clusters
2. Name emerging themes
3. Create theme hierarchy
4. Validate with additional data

### Phase 4: Insight Generation
1. Write insight statements
2. Attach supporting evidence
3. Assess confidence levels
4. Generate recommendations

### Phase 5: Documentation
1. Create synthesis report
2. Build affinity diagrams
3. Update persona documentation
4. Archive raw data references

## Integration with Other Skills

- **persona-development**: Generate detailed personas from synthesis
- **survey-design**: Inform follow-up survey questions
- **customer-feedback-aggregation**: Combine with quantitative feedback
- **user-story-generator**: Create stories from identified needs

## Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `minEvidenceCount` | 3 | Minimum observations for insight |
| `confidenceThreshold` | 0.6 | Minimum confidence to include |
| `outputFormat` | markdown | Report format (markdown, json) |
| `includeQuotes` | true | Include verbatim quotes |
| `anonymize` | true | Use participant IDs not names |

## Best Practices

### 1. Maintain Research Integrity
- Preserve original participant language
- Don't cherry-pick supporting evidence
- Document contradicting findings

### 2. Ensure Traceability
- Link every insight to source data
- Use consistent participant identifiers
- Maintain audit trail of coding decisions

### 3. Validate Findings
- Seek confirmation across multiple sources
- Test insights against quantitative data
- Review with research team

### 4. Make Actionable
- Write clear, specific insight statements
- Include concrete recommendations
- Prioritize by impact and evidence strength

## Troubleshooting

### Common Issues

1. **Insufficient Data**: Need more interviews for reliable themes
2. **Contradicting Evidence**: Document both sides, note conditions
3. **Bias in Interpretation**: Use peer review, check assumptions
4. **Theme Overlap**: Consider merging or creating hierarchy

### Quality Checklist

- [ ] All transcripts coded consistently
- [ ] Themes have 3+ supporting observations
- [ ] Insights include actionable recommendations
- [ ] Contradicting evidence documented
- [ ] Participant anonymity maintained

## References

- [UX Researcher Designer Skill](https://github.com/alirezarezvani/claude-skills)
- [Consumer Insights Synthesizer Subagent](https://github.com/ChrisRoyse/610ClaudeSubagents)
- [User Journey Strategist Subagent](https://github.com/ChrisRoyse/610ClaudeSubagents)
- [Impersonaid Persona Testing](https://github.com/theletterf/impersonaid)
- Process: `jtbd-analysis.js`, `user-story-mapping.js`
