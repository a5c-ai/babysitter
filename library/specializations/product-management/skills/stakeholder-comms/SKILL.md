---
name: Stakeholder Communication
description: Generate stakeholder-specific communications and presentations for product updates
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
---

# Stakeholder Communication Skill

## Overview

Specialized skill for generating stakeholder-specific communications and presentations. Enables product teams to create targeted communications that resonate with different audiences and maintain alignment.

## Capabilities

### Executive Communications
- Generate executive summaries
- Create board-level presentations
- Build investor update templates
- Create OKR progress reports
- Generate strategic initiative updates

### Sales and Customer Communications
- Build sales-focused feature briefs
- Create customer communications
- Generate release notes
- Build feature announcement templates
- Create customer success updates

### Internal Communications
- Generate internal launch announcements
- Build FAQ documents
- Create status update templates
- Generate cross-functional updates
- Build team alignment documents

### Presentation Artifacts
- Create presentation outlines
- Generate talking points
- Build visual data summaries
- Create demo scripts
- Generate Q&A preparation docs

## Target Processes

This skill integrates with the following processes:
- `stakeholder-alignment.js` - All stakeholder communications
- `product-council-review.js` - Review presentations
- `product-launch-gtm.js` - Launch communications
- `quarterly-roadmap.js` - Roadmap presentations

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "communicationType": {
      "type": "string",
      "enum": ["executive-summary", "board-update", "sales-brief", "customer-announcement", "internal-update", "status-report", "faq"],
      "description": "Type of communication to generate"
    },
    "audience": {
      "type": "string",
      "enum": ["executive", "board", "sales", "customer", "engineering", "all-hands"],
      "description": "Target audience"
    },
    "content": {
      "type": "object",
      "properties": {
        "topic": { "type": "string" },
        "keyPoints": { "type": "array", "items": { "type": "string" } },
        "data": { "type": "object" },
        "context": { "type": "string" }
      }
    },
    "tone": {
      "type": "string",
      "enum": ["formal", "professional", "casual", "urgent"],
      "default": "professional"
    },
    "format": {
      "type": "string",
      "enum": ["document", "presentation", "email", "slack"],
      "default": "document"
    }
  },
  "required": ["communicationType", "audience", "content"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "communication": {
      "type": "object",
      "properties": {
        "title": { "type": "string" },
        "summary": { "type": "string" },
        "body": { "type": "string" },
        "keyTakeaways": { "type": "array", "items": { "type": "string" } },
        "callToAction": { "type": "string" }
      }
    },
    "presentation": {
      "type": "object",
      "properties": {
        "slides": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "title": { "type": "string" },
              "content": { "type": "string" },
              "speakerNotes": { "type": "string" }
            }
          }
        },
        "talkingPoints": { "type": "array", "items": { "type": "string" } }
      }
    },
    "faq": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "question": { "type": "string" },
          "answer": { "type": "string" },
          "audience": { "type": "string" }
        }
      }
    },
    "metadata": {
      "type": "object",
      "properties": {
        "recommendedChannels": { "type": "array", "items": { "type": "string" } },
        "timing": { "type": "string" },
        "followUp": { "type": "array", "items": { "type": "string" } }
      }
    }
  }
}
```

## Usage Example

```javascript
const communication = await executeSkill('stakeholder-comms', {
  communicationType: 'executive-summary',
  audience: 'executive',
  content: {
    topic: 'Q1 Product Review',
    keyPoints: [
      'Launched 3 major features',
      'NPS improved by 15 points',
      'On track for ARR target'
    ],
    data: {
      featuresLaunched: 3,
      npsChange: 15,
      arrProgress: 0.85
    }
  },
  tone: 'professional',
  format: 'presentation'
});
```

## Dependencies

- Communication templates
- Presentation formats
