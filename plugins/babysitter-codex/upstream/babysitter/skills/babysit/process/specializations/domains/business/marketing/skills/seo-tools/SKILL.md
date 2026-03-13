---
name: seo-tools
description: Integration with major SEO platforms and tools
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
  category: Digital Marketing
  skill-id: SK-007
  dependencies:
    - Semrush API
    - Ahrefs API
    - GSC API
    - Moz API
---

# SEO Tools Platform Skill

## Overview

The SEO Tools Platform skill provides integration with major SEO platforms for comprehensive search engine optimization. This skill enables keyword research, technical SEO auditing, rank tracking, and competitive SEO analysis.

## Capabilities

### Keyword Research
- Semrush keyword research
- Keyword difficulty analysis
- Search volume tracking
- SERP feature analysis
- Long-tail keyword discovery

### Technical SEO
- Screaming Frog crawl analysis
- Core Web Vitals monitoring
- Technical SEO auditing
- Site structure analysis
- Mobile optimization

### Link Analysis
- Ahrefs backlink analysis
- Moz domain authority tracking
- Link opportunity identification
- Toxic link detection
- Competitor link profiles

### Performance Tracking
- Rank tracking and monitoring
- Google Search Console integration
- Organic traffic analysis
- SERP feature tracking
- Position change alerts

## Usage

### SEO Dashboard
```javascript
const seoDashboard = {
  domain: 'example.com',
  platforms: {
    keywords: 'Semrush',
    links: 'Ahrefs',
    tracking: 'Semrush',
    technical: 'Screaming Frog',
    console: 'Google Search Console'
  },
  metrics: {
    organicTraffic: { current: 125000, change: '+8%' },
    domainAuthority: { current: 65, change: '+2' },
    keywordsRanking: { current: 2500, change: '+150' },
    backlinks: { current: 45000, change: '+3000' },
    coreWebVitals: { lcp: 'good', fid: 'good', cls: 'needs-improvement' }
  },
  keywordPerformance: {
    top10: 350,
    top20: 650,
    top50: 1500,
    tracking: 5000
  },
  priorities: [
    { type: 'technical', issue: 'CLS optimization', impact: 'high' },
    { type: 'content', issue: 'Thin content pages', impact: 'medium' },
    { type: 'links', issue: 'Build authority links', impact: 'high' }
  ]
};
```

## Process Integration

| Process | Integration Points |
|---------|-------------------|
| seo-strategy-implementation.js | Full SEO workflow |
| content-strategy-development.js | SEO alignment |
| content-performance-optimization.js | SEO optimization |

## Best Practices

1. **Technical Foundation**: Fix technical issues first
2. **User Intent**: Optimize for user intent, not just keywords
3. **Quality Content**: Create content that serves users
4. **Earn Links**: Focus on earning quality backlinks
5. **Measure and Iterate**: Track results and adjust

## Metrics and KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| Organic Traffic | Monthly organic visitors | Growing |
| Keyword Rankings | Keywords in top 10 | Increasing |
| Domain Authority | Site authority score | Improving |
| Core Web Vitals | Performance metrics | All good |

## Related Skills

- SK-012: Content Optimization (content SEO)
- SK-002: Competitive Intelligence (competitive SEO)
- SK-011: Content Management (content publishing)
