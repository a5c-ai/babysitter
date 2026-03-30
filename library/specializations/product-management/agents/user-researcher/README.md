# User Research Expert Agent

## Overview

The User Research Expert agent is an autonomous research agent specialized in qualitative and quantitative user research. It handles study design, data collection, synthesis, and insight generation to inform product decisions with deep user understanding.

## Purpose

Understanding users is fundamental to building great products. This agent brings research expertise to:

- **Rigorous Methodology**: Apply appropriate research methods
- **Systematic Synthesis**: Transform raw data into structured insights
- **Actionable Outputs**: Connect research to product decisions
- **Persona Management**: Keep user models current and evidence-based

## Capabilities

| Capability | Description |
|------------|-------------|
| Research Design | Create interview guides, survey instruments |
| Interview Analysis | Code and theme qualitative data |
| JTBD Research | Extract jobs, pains, gains from interviews |
| Usability Testing | Design and analyze usability studies |
| Persona Development | Create and update evidence-based personas |
| Research Synthesis | Generate insights from multiple sources |

## Required Skills

This agent requires the following skills to function:

1. **user-research-synthesis**: Synthesize qualitative research data
2. **survey-design**: Create quantitative survey instruments
3. **persona-development**: Develop and maintain user personas

## Processes That Use This Agent

- **JTBD Analysis** (`jtbd-analysis.js`)
- **User Story Mapping** (`user-story-mapping.js`)
- **Product-Market Fit Assessment** (`product-market-fit.js`)
- **Beta Program Management** (`beta-program.js`)

## Workflow

### Phase 1: Research Planning

```
Input: Research objectives, constraints
Output: Research plan

Steps:
1. Clarify research questions
2. Select appropriate methodology
3. Define participant criteria
4. Create study materials
5. Plan timeline and logistics
```

### Phase 2: Data Collection

```
Input: Study materials, participants
Output: Raw research data

Steps:
1. Recruit participants
2. Conduct sessions
3. Record and transcribe
4. Collect artifacts
```

### Phase 3: Analysis

```
Input: Raw data (transcripts, notes)
Output: Coded data, themes

Steps:
1. Initial coding pass
2. Group into themes
3. Calculate frequency
4. Validate patterns
```

### Phase 4: Synthesis

```
Input: Coded themes
Output: Insights and recommendations

Steps:
1. Write insight statements
2. Attach evidence
3. Assess confidence
4. Generate recommendations
```

### Phase 5: Communication

```
Input: Insights
Output: Research deliverables

Steps:
1. Create research report
2. Update personas
3. Present to stakeholders
4. Track adoption
```

## Input Specification

```json
{
  "task": "research_synthesis",
  "research": {
    "type": "interview_study",
    "transcripts": [
      {"id": "P001", "path": "transcript1.md"},
      {"id": "P002", "path": "transcript2.md"}
    ],
    "researchQuestion": "Why do users abandon onboarding?",
    "participantCount": 12
  },
  "config": {
    "minEvidenceThreshold": 3,
    "confidenceLevels": ["high", "medium", "low"],
    "outputFormat": "report",
    "updatePersonas": true
  }
}
```

## Output Specification

```json
{
  "synthesis": {
    "themes": [
      {
        "name": "Complexity Overwhelm",
        "description": "Users feel overwhelmed by setup complexity",
        "frequency": 10,
        "confidence": "high",
        "evidence": [
          {"quote": "Too many options", "participant": "P001"}
        ]
      }
    ],
    "insights": [
      {
        "id": "INS-001",
        "statement": "Users need guided onboarding",
        "confidence": "high",
        "evidenceCount": 10,
        "recommendation": "Implement step-by-step wizard"
      }
    ]
  },
  "personas": {
    "updates": [
      {"persona": "New User", "change": "Add frustration: setup complexity"}
    ]
  },
  "recommendations": [
    {"action": "Simplify onboarding to 3 steps", "priority": "P0"}
  ],
  "metadata": {
    "participants": 12,
    "themes": 5,
    "insights": 8
  }
}
```

## Research Methodologies

### Qualitative Methods

| Method | Use Case | Participants |
|--------|----------|--------------|
| User Interviews | Exploratory understanding | 8-12 |
| JTBD Interviews | Discover jobs and needs | 10-15 |
| Usability Testing | Evaluate designs | 5-8 |
| Contextual Inquiry | Observe real use | 5-10 |
| Focus Groups | Group perspectives | 6-10 per group |

### Quantitative Methods

| Method | Use Case | Participants |
|--------|----------|--------------|
| Surveys | Measure at scale | 100+ |
| A/B Testing | Compare variants | Statistical power |
| Card Sorting | Information architecture | 15-30 |
| Tree Testing | Navigation evaluation | 50+ |

## Confidence Levels

| Level | Criteria |
|-------|----------|
| High | 5+ participants, consistent across segments |
| Medium | 3-4 participants, some variation |
| Low | 1-2 participants, or contradicting evidence |

## Integration

### With Other Agents

```
user-researcher ──> prioritization-expert
       │                    │
       └── user insights    └── prioritized backlog

user-researcher ──> data-pm
       │                │
       └── qualitative  └── quant correlation
```

### With Skills

```
user-researcher
    ├── user-research-synthesis (analysis)
    ├── survey-design (surveys)
    └── persona-development (personas)
```

## Usage Example

### In Babysitter Process

```javascript
// jtbd-analysis.js

const synthesisResult = await ctx.task(researchSynthesisTask, {
  transcripts: interviewTranscripts,
  researchQuestion: 'What jobs are users hiring our product to do?',
  minEvidence: 3
});

// Use insights
for (const insight of synthesisResult.insights) {
  if (insight.confidence === 'high') {
    ctx.log('info', `High-confidence insight: ${insight.statement}`);
  }
}
```

### Direct Agent Call

```javascript
const task = defineTask({
  name: 'onboarding-research',

  async run(inputs, taskCtx) {
    return {
      kind: 'agent',
      title: 'Onboarding Research Synthesis',
      agent: {
        name: 'user-researcher',
        prompt: {
          role: 'Senior User Researcher',
          task: 'Synthesize onboarding research and generate insights',
          context: {
            transcripts: inputs.transcripts,
            question: 'Why do users abandon during onboarding?'
          },
          instructions: [
            'Analyze all interview transcripts',
            'Code for themes related to abandonment',
            'Identify root causes',
            'Generate actionable recommendations',
            'Update New User persona if needed'
          ]
        }
      }
    };
  }
});
```

## Best Practices

1. **Define Clear Questions**: Know what you're trying to learn
2. **Recruit Representative Users**: Match target audience
3. **Stay Neutral**: Don't lead participants
4. **Saturate Data**: Continue until themes repeat
5. **Triangulate Sources**: Combine multiple data types
6. **Document Evidence**: Link insights to quotes
7. **Communicate Confidence**: Be clear about certainty levels

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Small sample | Few participants | Lower confidence, recommend follow-up |
| Biased sample | Non-representative | Document limits, broaden recruitment |
| Contradictions | Real variance | Segment analysis, present nuance |

## Related Resources

- Skills: `user-research-synthesis/SKILL.md`
- Skills: `survey-design/SKILL.md`
- Skills: `persona-development/SKILL.md`
- Processes: `jtbd-analysis.js`, `user-story-mapping.js`, `product-market-fit.js`
- References: [UX Researcher Designer](https://github.com/alirezarezvani/claude-skills), [Impersonaid](https://github.com/theletterf/impersonaid)
