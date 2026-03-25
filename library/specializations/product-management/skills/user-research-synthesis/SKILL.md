---
name: user-research-synthesis
description: Specialized skill for synthesizing qualitative user research into actionable insights. Analyzes interview transcripts, extracts patterns and themes, identifies pain points, creates affinity diagrams, and generates persona attributes from research data.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob
---

# User Research Synthesis Skill

Synthesize qualitative user research data into actionable product insights with thematic analysis and evidence-based recommendations.

## Overview

This skill provides comprehensive capabilities for transforming raw user research data into structured insights. It supports interview transcript analysis, survey response synthesis, support ticket mining, and cross-source research aggregation.

## Capabilities

### Transcript Analysis
- Analyze interview transcripts for patterns and themes
- Extract key quotes and supporting evidence
- Identify user pain points, needs, and goals
- Tag and categorize research findings
- Calculate insight confidence levels based on evidence

### Thematic Analysis
- Create affinity diagrams from research data
- Build thematic maps showing relationships
- Identify emerging patterns across participants
- Cluster related findings into themes
- Prioritize themes by frequency and impact

### Persona Development
- Generate persona attributes from research data
- Identify user segments and archetypes
- Map behaviors, motivations, and frustrations
- Create Jobs-to-be-Done statements per persona
- Validate personas against quantitative data

### Research Aggregation
- Synthesize research across multiple sources
- Combine surveys, interviews, and support tickets
- Track sentiment trends over time
- Calculate statistical confidence in findings
- Generate research repository documentation

## Prerequisites

### Required Tools
- Text processing and NLP capabilities
- Spreadsheet or structured data handling
- Document generation for reports

### Input Data Formats
```
Supported formats:
- Interview transcripts (.txt, .md, .docx)
- Survey exports (.csv, .xlsx)
- Support ticket exports (.csv, .json)
- User feedback logs (.json, .csv)
```

## Usage Patterns

### Interview Transcript Analysis
```markdown
## Analysis Framework

### Step 1: Initial Coding
For each transcript:
1. Read through completely for context
2. Highlight significant statements
3. Apply initial codes (open coding)
4. Note participant metadata

### Step 2: Pattern Recognition
Across transcripts:
1. Group similar codes
2. Identify recurring themes
3. Note frequency of mentions
4. Track contradicting evidence

### Step 3: Insight Generation
For each theme:
1. Define the insight clearly
2. List supporting evidence (3+ quotes)
3. Assess confidence level
4. Note actionable implications
```

### Structured Coding Template
```json
{
  "transcript_id": "INT-001",
  "participant": {
    "id": "P001",
    "segment": "power_user",
    "tenure": "2_years"
  },
  "findings": [
    {
      "code": "onboarding_friction",
      "theme": "First-time experience",
      "quote": "I had no idea where to start...",
      "timestamp": "00:12:34",
      "sentiment": "negative",
      "intensity": "high"
    }
  ],
  "summary": {
    "key_pain_points": [],
    "unmet_needs": [],
    "positive_experiences": [],
    "feature_requests": []
  }
}
```

### Affinity Diagram Generation
```markdown
## Affinity Diagram Process

### 1. Capture Observations
- One observation per note
- Include source attribution
- Maintain original language

### 2. Group Bottom-Up
- Cluster similar observations
- Name each cluster
- Create hierarchy of clusters

### 3. Output Format

# Theme: [Theme Name]
## Subtheme: [Subtheme Name]
- Observation 1 (P001, INT-001)
- Observation 2 (P003, INT-003)
- Observation 3 (P007, INT-007)

### Evidence Strength
- Strong: 5+ supporting observations
- Moderate: 3-4 supporting observations
- Emerging: 2 supporting observations
```

### Insight Documentation
```markdown
## Insight Template

### Insight ID: INS-001
**Statement**: [Clear, actionable insight statement]

**Theme**: [Parent theme]
**Confidence**: [High/Medium/Low]
**Evidence Count**: [Number of supporting data points]

### Supporting Evidence
| Source | Quote | Participant |
|--------|-------|-------------|
| INT-001 | "..." | P001 |
| INT-003 | "..." | P003 |
| SUR-045 | "..." | R045 |

### Implications
- Product: [Product implications]
- Design: [Design implications]
- Engineering: [Technical considerations]

### Recommendations
1. [Specific recommendation]
2. [Specific recommendation]

### Contradicting Evidence
- [Note any contradicting findings]
```

## Integration with Babysitter SDK

### Task Definition Example
```javascript
const researchSynthesisTask = defineTask({
  name: 'research-synthesis',
  description: 'Synthesize user research into actionable insights',

  inputs: {
    transcriptPaths: { type: 'array', required: true },
    researchQuestion: { type: 'string', required: true },
    outputFormat: { type: 'string', default: 'markdown' },
    minEvidenceThreshold: { type: 'number', default: 3 }
  },

  outputs: {
    themes: { type: 'array' },
    insights: { type: 'array' },
    personas: { type: 'array' },
    recommendations: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: 'Synthesize user research findings',
      skill: {
        name: 'user-research-synthesis',
        context: {
          operation: 'full_synthesis',
          transcriptPaths: inputs.transcriptPaths,
          researchQuestion: inputs.researchQuestion,
          outputFormat: inputs.outputFormat,
          minEvidenceThreshold: inputs.minEvidenceThreshold
        }
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
      }
    };
  }
});
```

## Analysis Frameworks

### Jobs-to-be-Done (JTBD) Extraction
```markdown
## JTBD Statement Format

When [situation/context],
I want to [motivation/goal],
So I can [expected outcome].

### Extraction Process
1. Identify triggering situations in transcripts
2. Extract stated and unstated motivations
3. Map to desired outcomes
4. Categorize: Functional, Emotional, Social jobs
```

### Pain Point Severity Matrix

| Severity | Frequency | Impact | Priority |
|----------|-----------|--------|----------|
| Critical | 80%+ users | Blocks core task | P0 |
| High | 50-80% users | Significant friction | P1 |
| Medium | 25-50% users | Noticeable issue | P2 |
| Low | <25% users | Minor annoyance | P3 |

## Output Formats

### Research Summary Report
```markdown
# Research Synthesis Report

## Executive Summary
[2-3 sentence overview]

## Research Methodology
- **Method**: [Interviews/Surveys/etc.]
- **Participants**: [N participants]
- **Duration**: [Date range]
- **Research Questions**: [Key questions]

## Key Themes
### Theme 1: [Name]
[Description and evidence]

### Theme 2: [Name]
[Description and evidence]

## Top Insights
1. **Insight**: [Statement]
   - Evidence: [Count]
   - Confidence: [Level]
   - Recommendation: [Action]

## Persona Implications
[How findings affect personas]

## Recommended Actions
1. [Action item]
2. [Action item]

## Appendix
- Full coding scheme
- Participant demographics
- Raw data references
```

## Best Practices

1. **Maintain Participant Anonymity**: Use consistent IDs, not names
2. **Preserve Original Language**: Quote users verbatim when possible
3. **Triangulate Sources**: Seek confirmation across multiple sources
4. **Note Outliers**: Document contradicting evidence, don't dismiss
5. **Quantify Where Possible**: Count frequency of themes
6. **Separate Observation from Interpretation**: Clearly distinguish facts from analysis

## References

- [UX Researcher Designer Claude Skill](https://github.com/alirezarezvani/claude-skills)
- [Consumer Insights Synthesizer](https://github.com/ChrisRoyse/610ClaudeSubagents)
- [Impersonaid - Persona Testing Tool](https://github.com/theletterf/impersonaid)
- [Customer Interview Analyzer](https://github.com/alirezarezvani/claude-skills)
