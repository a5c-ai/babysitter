---
name: content-optimization
description: AI-powered content optimization and SEO writing assistance
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - WebFetch
metadata:
  specialization: marketing
  domain: business
  category: Content Marketing
  skill-id: SK-012
  dependencies:
    - Clearscope API
    - Surfer SEO API
    - MarketMuse API
---

# Content Optimization Skill

## Overview

The Content Optimization skill provides AI-powered content optimization and SEO writing assistance. This skill enables data-driven content creation that ranks well in search while delivering value to readers.

## Capabilities

### Content Analysis
- Clearscope content analysis
- Surfer SEO optimization
- MarketMuse content planning
- Keyword density analysis
- Readability scoring

### Content Planning
- Content brief generation
- Topic cluster planning
- Content gap identification
- SERP intent analysis
- Competitive content analysis

### Optimization
- Real-time optimization scoring
- Term recommendations
- Header structure optimization
- Internal linking suggestions
- Featured snippet optimization

### Quality Assurance
- Readability scoring
- Grammar and style checking
- Brand voice consistency
- Fact-checking reminders
- Plagiarism detection

## Usage

### Content Brief
```javascript
const contentBrief = {
  tool: 'Clearscope',
  targetKeyword: 'marketing automation best practices',
  analysis: {
    searchVolume: 2400,
    difficulty: 58,
    intent: 'informational',
    serpFeatures: ['featured-snippet', 'people-also-ask', 'related-searches']
  },
  recommendations: {
    wordCount: { min: 2000, optimal: 2500 },
    headerStructure: [
      'H1: What is Marketing Automation?',
      'H2: Benefits of Marketing Automation',
      'H2: Marketing Automation Best Practices',
      'H3: Lead Scoring',
      'H3: Email Nurturing',
      'H3: Workflow Design'
    ],
    mustIncludeTerms: [
      'lead nurturing',
      'email automation',
      'workflow',
      'CRM integration',
      'analytics'
    ],
    questions: [
      'What are the benefits of marketing automation?',
      'How do you implement marketing automation?',
      'What are common marketing automation mistakes?'
    ]
  },
  competitors: [
    { url: 'competitor-article-1.com', score: 85, wordCount: 2800 },
    { url: 'competitor-article-2.com', score: 82, wordCount: 2200 }
  ],
  targetScore: 85
};
```

## Process Integration

| Process | Integration Points |
|---------|-------------------|
| content-strategy-development.js | Content planning |
| content-performance-optimization.js | Content updates |
| seo-strategy-implementation.js | SEO optimization |

## Best Practices

1. **User Intent First**: Optimize for user needs, not just keywords
2. **Quality Balance**: Balance SEO with readability
3. **Continuous Updates**: Refresh content regularly
4. **Competitive Analysis**: Understand what ranks
5. **Measure Results**: Track organic performance

## Metrics and KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| Content Score | Optimization tool score | >80 |
| Organic Rankings | Keyword positions | Top 10 |
| Organic Traffic | Visits from search | Growing |
| Time on Page | Engagement metric | Above average |

## Related Skills

- SK-007: SEO Tools (technical SEO)
- SK-011: Content Management (publishing)
- SK-001: Market Research Platform (audience research)
