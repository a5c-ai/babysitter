# Documentation Analytics Skill

Measure and optimize documentation effectiveness with analytics integration, search insights, and content performance metrics.

## Overview

This skill provides expertise in documentation analytics, helping teams understand how users interact with their documentation, identify content gaps, and make data-driven improvements to the documentation experience.

## When to Use

- Setting up documentation analytics
- Analyzing documentation usage patterns
- Identifying content gaps from search data
- Measuring documentation ROI
- Optimizing user journeys

## Quick Start

### Basic Setup

```json
{
  "docsUrl": "https://docs.example.com",
  "analyticsProvider": "ga4",
  "trackingId": "G-XXXXXXXXXX"
}
```

### With Search Analytics

```json
{
  "docsUrl": "https://docs.example.com",
  "analyticsProvider": "ga4",
  "trackingId": "G-XXXXXXXXXX",
  "algoliaAppId": "YOUR_APP_ID",
  "algoliaApiKey": "YOUR_API_KEY"
}
```

## Key Metrics

### Engagement Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| Time on Page | Average reading time | > 2 minutes |
| Scroll Depth | How far users scroll | > 75% |
| Bounce Rate | Single-page visits | < 40% |
| Code Copy Events | Code block interactions | High |
| Feedback Score | Helpful/not helpful | > 80% |

### Search Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| Click-Through Rate | Searches resulting in clicks | > 60% |
| No Result Rate | Searches with no results | < 5% |
| Search Refinements | Users refining searches | Low |
| Time to Result | Time to find answer | < 30s |

## Google Analytics 4

### Basic Configuration

```javascript
// Initialize GA4
gtag('config', 'G-XXXXXXXXXX', {
  custom_map: {
    dimension1: 'doc_version',
    dimension2: 'doc_section',
  },
});
```

### Custom Events

```javascript
// Track code copy
function trackCodeCopy(language) {
  gtag('event', 'code_copy', {
    event_category: 'engagement',
    event_label: language,
  });
}

// Track feedback
function trackFeedback(helpful) {
  gtag('event', 'doc_feedback', {
    event_category: 'feedback',
    value: helpful ? 1 : 0,
  });
}

// Track scroll depth
function trackScrollDepth(percent) {
  gtag('event', 'scroll_depth', {
    event_category: 'engagement',
    value: percent,
  });
}
```

### Docusaurus Integration

```javascript
// docusaurus.config.js
module.exports = {
  plugins: [
    [
      '@docusaurus/plugin-google-gtag',
      {
        trackingID: 'G-XXXXXXXXXX',
        anonymizeIP: true,
      },
    ],
  ],
};
```

## Algolia Search Analytics

### DocSearch Integration

```javascript
import docsearch from '@docsearch/js';

docsearch({
  appId: 'YOUR_APP_ID',
  apiKey: 'YOUR_SEARCH_API_KEY',
  indexName: 'YOUR_INDEX_NAME',
  insights: true, // Enable analytics
});
```

### Search Analytics API

```javascript
// Get top searches
const topSearches = await analyticsClient.customRequest({
  method: 'GET',
  path: '/2/searches',
  data: {
    index: 'docs',
    startDate: '2026-01-01',
    endDate: '2026-01-24',
  },
});

// Get no-result searches
const noResults = await analyticsClient.customRequest({
  method: 'GET',
  path: '/2/searches/noResults',
  data: {
    index: 'docs',
    limit: 100,
  },
});
```

## Content Gap Analysis

### No-Result Search Analysis

```javascript
// Analyze searches with no results
function analyzeContentGaps(searches) {
  return searches.map((search) => ({
    query: search.search,
    count: search.count,
    category: categorizeQuery(search.search),
    priority: search.count > 100 ? 'high' : 'medium',
  }));
}
```

### Report Format

```json
{
  "contentGaps": [
    {
      "query": "webhook authentication",
      "count": 342,
      "category": "authentication",
      "priority": "high",
      "suggestedAction": "Create webhook auth guide"
    }
  ],
  "lowPerformingPages": [
    {
      "url": "/docs/api/errors",
      "bounceRate": 0.65,
      "avgTimeOnPage": 45,
      "recommendations": [
        "Add more examples",
        "Improve error descriptions"
      ]
    }
  ]
}
```

## User Journey Tracking

### Track Page Sequences

```javascript
const journey = {
  pages: [],
  searches: [],
};

function trackPage(url, title) {
  journey.pages.push({
    url,
    title,
    timestamp: Date.now(),
  });
}
```

### Common Path Analysis

```javascript
// Identify common documentation paths
function getCommonPaths(journeys) {
  const paths = {};
  journeys.forEach((j) => {
    const path = j.pages.slice(0, 5).join(' -> ');
    paths[path] = (paths[path] || 0) + 1;
  });
  return Object.entries(paths)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);
}
```

## Framework Integration

### Docusaurus

```javascript
// docusaurus.config.js
module.exports = {
  plugins: [
    ['@docusaurus/plugin-google-gtag', { trackingID: 'G-XXX' }],
  ],
  themeConfig: {
    algolia: {
      appId: 'XXX',
      apiKey: 'XXX',
      indexName: 'docs',
      insights: true,
    },
  },
};
```

### MkDocs Material

```yaml
# mkdocs.yml
extra:
  analytics:
    provider: google
    property: G-XXXXXXXXXX
    feedback:
      title: Was this page helpful?
      ratings:
        - icon: material/thumb-up
          name: This page was helpful
          data: 1
        - icon: material/thumb-down
          name: This page could be improved
          data: 0
```

### VitePress

```javascript
// .vitepress/config.js
export default {
  head: [
    ['script', { async: true, src: 'https://www.googletagmanager.com/gtag/js?id=G-XXX' }],
  ],
};
```

## Process Integration

| Process | Usage |
|---------|-------|
| `docs-audit.js` | Analyze documentation health |
| `content-strategy.js` | Data-driven content planning |
| `knowledge-base-setup.js` | Analytics configuration |
| `docs-testing.js` | Validate tracking |

## Reports

### Monthly Summary

```json
{
  "period": "2026-01",
  "metrics": {
    "pageviews": 125000,
    "uniqueVisitors": 45000,
    "avgSessionDuration": "3:42",
    "bounceRate": "38%"
  },
  "topPages": [
    { "url": "/getting-started", "views": 12500 },
    { "url": "/api/authentication", "views": 8900 }
  ],
  "topSearches": [
    { "query": "authentication", "count": 1543 },
    { "query": "api keys", "count": 1232 }
  ],
  "contentGaps": [
    { "query": "webhook setup", "count": 450 }
  ]
}
```

## Privacy Considerations

- Anonymize IP addresses
- Respect Do Not Track headers
- Provide cookie consent
- Consider privacy-friendly alternatives (Plausible, Fathom)
- Document data collection practices

## References

- [Google Analytics 4](https://developers.google.com/analytics/devguides/collection/ga4)
- [Algolia Analytics](https://www.algolia.com/doc/guides/search-analytics/overview/)
- [Plausible Analytics](https://plausible.io/) (Privacy-friendly)
- [Fathom Analytics](https://usefathom.com/) (Privacy-friendly)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-018
**Category:** Content Management
**Status:** Active
