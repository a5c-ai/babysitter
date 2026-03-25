---
name: Survey Design
description: Design and analyze surveys for product validation and user research
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
---

# Survey Design Skill

## Overview

Specialized skill for designing and analyzing surveys for product validation. Enables product teams to gather structured feedback through well-designed surveys and interpret results with statistical rigor.

## Capabilities

### Survey Design
- Design PMF surveys (Sean Ellis test)
- Create NPS survey implementations
- Build feature validation surveys
- Generate survey question banks
- Design onboarding feedback surveys
- Create churn exit surveys

### Question Engineering
- Write unbiased survey questions
- Design appropriate response scales
- Create skip logic and branching
- Optimize question order
- Balance survey length vs completion

### Analysis
- Analyze survey response data
- Calculate statistical confidence in results
- Segment analysis by user attributes
- Identify response patterns and themes
- Generate actionable insights from data

## Target Processes

This skill integrates with the following processes:
- `product-market-fit.js` - PMF survey design and analysis
- `beta-program.js` - Beta participant surveys
- `customer-advisory-board.js` - CAB feedback collection
- `jtbd-analysis.js` - Jobs-based survey questions

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "surveyType": {
      "type": "string",
      "enum": ["pmf", "nps", "csat", "feature-validation", "exit", "onboarding", "custom"],
      "description": "Type of survey to design"
    },
    "objective": {
      "type": "string",
      "description": "Primary objective of the survey"
    },
    "targetAudience": {
      "type": "string",
      "description": "Target survey respondents"
    },
    "hypotheses": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Hypotheses to validate through survey"
    },
    "maxQuestions": {
      "type": "number",
      "default": 10,
      "description": "Maximum number of questions"
    },
    "responseData": {
      "type": "array",
      "description": "Survey response data for analysis (if analyzing existing survey)"
    }
  },
  "required": ["surveyType", "objective"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "survey": {
      "type": "object",
      "properties": {
        "title": { "type": "string" },
        "introduction": { "type": "string" },
        "questions": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": { "type": "string" },
              "type": { "type": "string" },
              "text": { "type": "string" },
              "options": { "type": "array", "items": { "type": "string" } },
              "required": { "type": "boolean" },
              "logic": { "type": "object" }
            }
          }
        },
        "estimatedTime": { "type": "string" }
      }
    },
    "analysisFramework": {
      "type": "object",
      "properties": {
        "keyMetrics": { "type": "array", "items": { "type": "string" } },
        "segmentationCriteria": { "type": "array", "items": { "type": "string" } },
        "successThresholds": { "type": "object" }
      }
    },
    "analysis": {
      "type": "object",
      "description": "Analysis results if response data was provided",
      "properties": {
        "responseRate": { "type": "number" },
        "keyFindings": { "type": "array", "items": { "type": "string" } },
        "segmentInsights": { "type": "object" },
        "statisticalConfidence": { "type": "object" },
        "recommendations": { "type": "array", "items": { "type": "string" } }
      }
    }
  }
}
```

## Usage Example

```javascript
const survey = await executeSkill('survey-design', {
  surveyType: 'pmf',
  objective: 'Measure product-market fit for new analytics feature',
  targetAudience: 'Active users who have used analytics at least 3 times',
  hypotheses: [
    'Users find the analytics feature valuable for their workflow',
    'Users would be disappointed if the feature was removed'
  ],
  maxQuestions: 8
});
```

## Dependencies

- Survey platform integrations
- Statistical analysis libraries
