---
name: ap-style-writing
description: AP style compliance, grammar checking, and PR writing assistance
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - WebFetch
metadata:
  specialization: public-relations
  domain: business
  category: Content Creation
  skill-id: SK-011
  dependencies:
    - AP Stylebook API
    - Grammarly Business API
---

# AP Style and Writing Skill

## Overview

The AP Style and Writing skill provides AP style compliance, grammar checking, and PR writing assistance capabilities. This skill enables professional-grade PR content creation that meets journalism standards and maintains brand consistency.

## Capabilities

### Style Compliance
- AP Stylebook integration
- Real-time style checking
- Industry-specific style rules
- Company style guide integration
- Style exception management

### Grammar and Quality
- Grammar and readability analysis
- Sentence structure optimization
- Passive voice detection
- Jargon and complexity flagging
- Tone consistency checking

### Press Release Writing
- Press release template library
- Headline optimization
- Lead paragraph structure
- Quote formatting validation
- Boilerplate management

### Brand Consistency
- Brand voice consistency checking
- Key message integration
- Approved terminology enforcement
- Competitor name handling
- Product name consistency

### Compliance and Risk
- Legal/compliance flag detection
- Disclaimer requirement checking
- SEC disclosure compliance
- Trademark and copyright handling
- Fact-checking reminders

## Usage

### Style Check Configuration
```javascript
const styleCheckConfig = {
  baseStyle: 'AP-Stylebook-2026',
  customRules: {
    companyName: {
      correct: 'Company X',
      incorrect: ['CompanyX', 'Company-X', 'company x']
    },
    productNames: {
      'ProductOne': { trademark: true, firstUseTM: true },
      'ProductTwo': { trademark: false }
    },
    executiveTitles: {
      pattern: 'lowercase-after-name',
      examples: 'Jane Doe, chief executive officer'
    },
    numbers: 'spell-out-under-10',
    dates: 'month-day-year'
  },
  voiceGuidelines: {
    tone: 'professional-but-accessible',
    perspective: 'third-person',
    passiveVoiceLimit: 10,
    jargonLevel: 'minimize'
  },
  complianceRules: {
    forwardLooking: { required: true, template: 'standard-disclaimer' },
    financialDisclosure: { secCompliant: true },
    legalReview: { triggers: ['lawsuit', 'litigation', 'settlement'] }
  }
};
```

### Content Review
```javascript
const contentReview = {
  document: 'press-release-draft.md',
  results: {
    styleIssues: [
      { line: 5, issue: 'Numbers: "8" should be "eight"', severity: 'style' },
      { line: 12, issue: 'Date format: Use "Feb. 15, 2026"', severity: 'style' },
      { line: 18, issue: 'Company name: Use "Company X" not "Company-X"', severity: 'brand' }
    ],
    grammarIssues: [
      { line: 8, issue: 'Passive voice: Consider active construction', severity: 'suggestion' },
      { line: 22, issue: 'Run-on sentence: Consider splitting', severity: 'warning' }
    ],
    readability: {
      fleschKincaid: 10.2,
      target: 8.0,
      recommendation: 'Simplify for broader audience'
    },
    compliance: [
      { issue: 'Forward-looking statement detected', action: 'Add safe harbor disclaimer' }
    ],
    brandConsistency: {
      keyMessages: { present: 2, expected: 3 },
      toneScore: 85,
      voiceConsistency: 'good'
    }
  },
  summary: {
    totalIssues: 7,
    critical: 0,
    warnings: 3,
    suggestions: 4,
    overallScore: 82
  }
};
```

## Process Integration

This skill integrates with the following PR processes:

| Process | Integration Points |
|---------|-------------------|
| press-release-development.js | Writing and editing |
| corporate-messaging-architecture.js | Message consistency |
| csr-communications.js | Report writing |
| internal-communications-strategy.js | Internal content |

## Best Practices

1. **Style First**: Apply AP style consistently throughout
2. **Headline Power**: Spend extra time on headline optimization
3. **Lead Strong**: Front-load key information in first paragraph
4. **Quote Quality**: Ensure quotes add value and sound natural
5. **Readability Focus**: Write for your audience's level
6. **Review Process**: Always use multiple review passes

## Metrics and KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| Style Compliance | AP style adherence | >95% |
| Readability Score | Flesch-Kincaid grade | Audience-appropriate |
| Brand Consistency | Message and voice alignment | >90% |
| Error Rate | Errors per document | <1 per page |
| Review Efficiency | Time to publication-ready | Improving |

## Related Skills

- SK-003: Media Database (journalist preferences)
- SK-004: Press Release Distribution (publication)
- SK-007: Internal Comms Platform (internal content)
