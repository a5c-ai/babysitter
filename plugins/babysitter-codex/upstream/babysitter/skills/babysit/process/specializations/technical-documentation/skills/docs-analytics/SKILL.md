---
name: docs-analytics
description: Documentation usage analytics and insights. Integrate with Google Analytics, Algolia analytics, and custom tracking to measure documentation effectiveness, identify content gaps, and optimize user journeys.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
backlog-id: SK-018
metadata:
  author: babysitter-sdk
  version: "1.0.0"
---

# Documentation Analytics Skill

Measure documentation effectiveness with analytics integration, search insights, user journey analysis, and content performance metrics.

## Capabilities

- Google Analytics integration for documentation sites
- Algolia analytics for search patterns
- User journey analysis and flow tracking
- Content engagement metrics
- Search query analysis and gap identification
- Page performance metrics
- Heatmap integration (Hotjar, etc.)
- Custom event tracking
- Documentation ROI measurement

## Usage

Invoke this skill when you need to:
- Set up documentation analytics
- Analyze documentation usage patterns
- Identify content gaps from search data
- Measure documentation effectiveness
- Optimize user journeys through docs

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| docsUrl | string | Yes | Documentation site URL |
| analyticsProvider | string | No | ga4, algolia, plausible, custom |
| trackingId | string | No | Analytics tracking ID |
| algoliaAppId | string | No | Algolia application ID |
| algoliaApiKey | string | No | Algolia API key for analytics |
| enableHeatmaps | boolean | No | Enable heatmap tracking |
| customEvents | array | No | Custom events to track |

### Input Example

```json
{
  "docsUrl": "https://docs.example.com",
  "analyticsProvider": "ga4",
  "trackingId": "G-XXXXXXXXXX",
  "algoliaAppId": "ALGOLIA_APP_ID",
  "enableHeatmaps": true,
  "customEvents": [
    "code_copy",
    "feedback_submitted",
    "version_switch"
  ]
}
```

## Output Structure

```
analytics/
├── reports/
│   ├── monthly-summary.json
│   ├── search-analysis.json
│   ├── content-gaps.json
│   └── user-journeys.json
├── dashboards/
│   ├── overview.html
│   └── search-insights.html
└── config/
    ├── ga4-config.json
    └── algolia-config.json
```

## Google Analytics 4 Integration

### GA4 Configuration

```javascript
// analytics.js
window.dataLayer = window.dataLayer || [];
function gtag() {
  dataLayer.push(arguments);
}
gtag('js', new Date());
gtag('config', 'G-XXXXXXXXXX', {
  // Custom dimensions for docs
  custom_map: {
    dimension1: 'doc_version',
    dimension2: 'doc_section',
    dimension3: 'search_query',
    dimension4: 'code_language',
  },
});

// Track documentation version
gtag('set', 'user_properties', {
  doc_version: document.querySelector('meta[name="docs-version"]')?.content,
});
```

### Custom Events

```javascript
// Track code block copy
document.querySelectorAll('pre code').forEach((block) => {
  block.addEventListener('click', () => {
    gtag('event', 'code_copy', {
      event_category: 'engagement',
      event_label: block.className, // language
      page_location: window.location.href,
    });
  });
});

// Track documentation feedback
function trackFeedback(helpful, pageUrl) {
  gtag('event', 'doc_feedback', {
    event_category: 'feedback',
    event_label: helpful ? 'helpful' : 'not_helpful',
    page_location: pageUrl,
  });
}

// Track version switching
function trackVersionSwitch(fromVersion, toVersion) {
  gtag('event', 'version_switch', {
    event_category: 'navigation',
    from_version: fromVersion,
    to_version: toVersion,
  });
}

// Track time on page
let startTime = Date.now();
window.addEventListener('beforeunload', () => {
  const timeSpent = Math.round((Date.now() - startTime) / 1000);
  gtag('event', 'time_on_page', {
    event_category: 'engagement',
    value: timeSpent,
    page_location: window.location.href,
  });
});

// Track scroll depth
let maxScroll = 0;
window.addEventListener('scroll', () => {
  const scrollPercent = Math.round(
    (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
  );
  if (scrollPercent > maxScroll) {
    maxScroll = scrollPercent;
    if ([25, 50, 75, 90, 100].includes(scrollPercent)) {
      gtag('event', 'scroll_depth', {
        event_category: 'engagement',
        value: scrollPercent,
        page_location: window.location.href,
      });
    }
  }
});

// Track external link clicks
document.querySelectorAll('a[href^="http"]').forEach((link) => {
  link.addEventListener('click', () => {
    gtag('event', 'outbound_click', {
      event_category: 'engagement',
      event_label: link.href,
      page_location: window.location.href,
    });
  });
});
```

## Algolia Analytics Integration

### DocSearch Analytics

```javascript
// Algolia DocSearch with analytics
import docsearch from '@docsearch/js';

docsearch({
  appId: 'YOUR_APP_ID',
  apiKey: 'YOUR_SEARCH_API_KEY',
  indexName: 'YOUR_INDEX_NAME',
  container: '#docsearch',
  debug: false,
  insights: true, // Enable Algolia analytics
  searchParameters: {
    analytics: true,
    clickAnalytics: true,
    enablePersonalization: false,
  },
});
```

### Search Analytics API

```javascript
// Fetch search analytics from Algolia
const algoliasearch = require('algoliasearch');
const analyticsClient = algoliasearch('APP_ID', 'ADMIN_API_KEY');

async function getSearchAnalytics() {
  const index = analyticsClient.initIndex('docs');

  // Get top searches
  const topSearches = await analyticsClient.customRequest({
    method: 'GET',
    path: '/2/searches',
    data: {
      index: 'docs',
      startDate: '2026-01-01',
      endDate: '2026-01-24',
      limit: 100,
      orderBy: 'searchCount',
    },
  });

  // Get searches with no results
  const noResultSearches = await analyticsClient.customRequest({
    method: 'GET',
    path: '/2/searches/noResults',
    data: {
      index: 'docs',
      startDate: '2026-01-01',
      endDate: '2026-01-24',
      limit: 100,
    },
  });

  // Get click-through rate
  const clickAnalytics = await analyticsClient.customRequest({
    method: 'GET',
    path: '/2/clicks/clickThroughRate',
    data: {
      index: 'docs',
      startDate: '2026-01-01',
      endDate: '2026-01-24',
    },
  });

  return {
    topSearches: topSearches.searches,
    noResultSearches: noResultSearches.searches,
    clickThroughRate: clickAnalytics,
  };
}
```

### Search Gap Analysis

```javascript
// Analyze search queries that return no results
async function analyzeContentGaps(noResultSearches) {
  const gaps = [];

  for (const search of noResultSearches) {
    // Categorize by topic
    const category = categorizeQuery(search.search);

    gaps.push({
      query: search.search,
      count: search.count,
      category,
      suggestedContent: generateContentSuggestion(search.search),
      priority: calculatePriority(search.count),
    });
  }

  return gaps.sort((a, b) => b.count - a.count);
}

function categorizeQuery(query) {
  const categories = {
    api: /api|endpoint|rest|graphql|webhook/i,
    authentication: /auth|login|oauth|token|api.?key/i,
    integration: /integrate|connect|setup|install/i,
    error: /error|fail|issue|problem|not.?work/i,
    pricing: /price|cost|plan|billing/i,
  };

  for (const [category, pattern] of Object.entries(categories)) {
    if (pattern.test(query)) return category;
  }
  return 'general';
}
```

## User Journey Analysis

### Journey Tracking

```javascript
// Track user journey through documentation
const journey = {
  sessionId: generateSessionId(),
  startTime: Date.now(),
  pages: [],
  searches: [],
  events: [],
};

// Track page views
function trackPageView(pageUrl, pageTitle) {
  journey.pages.push({
    url: pageUrl,
    title: pageTitle,
    timestamp: Date.now(),
    timeOnPrevPage: calculateTimeOnPrevPage(),
  });
}

// Track searches
function trackSearch(query, results) {
  journey.searches.push({
    query,
    resultsCount: results.length,
    timestamp: Date.now(),
    clickedResult: null,
  });
}

// Track search result click
function trackSearchClick(query, resultUrl, position) {
  const search = journey.searches.find((s) => s.query === query);
  if (search) {
    search.clickedResult = { url: resultUrl, position };
  }
}

// Analyze journey patterns
function analyzeJourney(journey) {
  return {
    totalPages: journey.pages.length,
    totalTime: Date.now() - journey.startTime,
    searchesBeforeSuccess: countSearchesBeforeSuccess(journey),
    commonPaths: identifyCommonPaths(journey.pages),
    dropOffPoints: identifyDropOffPoints(journey.pages),
  };
}
```

### Common Journey Patterns

```javascript
// Identify common documentation paths
async function getCommonPaths(journeys) {
  const pathCounts = {};

  journeys.forEach((journey) => {
    const path = journey.pages
      .map((p) => p.url)
      .slice(0, 5)
      .join(' -> ');
    pathCounts[path] = (pathCounts[path] || 0) + 1;
  });

  return Object.entries(pathCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([path, count]) => ({
      path,
      count,
      percentage: ((count / journeys.length) * 100).toFixed(1),
    }));
}
```

## Content Performance Metrics

### Engagement Metrics

```javascript
// Calculate content engagement score
function calculateEngagementScore(pageMetrics) {
  const weights = {
    avgTimeOnPage: 0.3,
    scrollDepth: 0.2,
    codeBlockInteractions: 0.2,
    feedbackScore: 0.15,
    exitRate: -0.15, // Negative weight
  };

  return Object.entries(weights).reduce((score, [metric, weight]) => {
    return score + normalizeMetric(pageMetrics[metric]) * weight;
  }, 0);
}

// Page performance report
function generatePageReport(pageUrl) {
  return {
    url: pageUrl,
    metrics: {
      pageviews: getPageviews(pageUrl),
      uniqueVisitors: getUniqueVisitors(pageUrl),
      avgTimeOnPage: getAvgTimeOnPage(pageUrl),
      bounceRate: getBounceRate(pageUrl),
      exitRate: getExitRate(pageUrl),
      scrollDepth: {
        '25%': getScrollDepthPercent(pageUrl, 25),
        '50%': getScrollDepthPercent(pageUrl, 50),
        '75%': getScrollDepthPercent(pageUrl, 75),
        '100%': getScrollDepthPercent(pageUrl, 100),
      },
      feedback: {
        helpful: getHelpfulCount(pageUrl),
        notHelpful: getNotHelpfulCount(pageUrl),
        score: getFeedbackScore(pageUrl),
      },
      codeInteractions: getCodeInteractions(pageUrl),
    },
    engagementScore: calculateEngagementScore(pageMetrics),
    recommendations: generateRecommendations(pageMetrics),
  };
}
```

### Content Gap Report

```json
{
  "period": "2026-01",
  "summary": {
    "totalSearches": 45230,
    "uniqueSearches": 8432,
    "noResultSearches": 1234,
    "avgClickThroughRate": 0.68
  },
  "contentGaps": [
    {
      "query": "webhook authentication",
      "searchCount": 342,
      "category": "authentication",
      "suggestedContent": {
        "type": "guide",
        "title": "Webhook Authentication Guide",
        "outline": [
          "Introduction to webhook security",
          "Signature verification",
          "Best practices"
        ]
      },
      "priority": "high"
    },
    {
      "query": "rate limiting best practices",
      "searchCount": 256,
      "category": "api",
      "suggestedContent": {
        "type": "guide",
        "title": "Rate Limiting Best Practices",
        "outline": [
          "Understanding rate limits",
          "Handling 429 responses",
          "Exponential backoff implementation"
        ]
      },
      "priority": "high"
    }
  ],
  "topSearches": [
    { "query": "authentication", "count": 1543 },
    { "query": "api keys", "count": 1232 },
    { "query": "getting started", "count": 987 }
  ],
  "lowPerformingPages": [
    {
      "url": "/docs/advanced/caching",
      "issues": ["high bounce rate", "low scroll depth"],
      "recommendations": [
        "Add more code examples",
        "Include visual diagrams"
      ]
    }
  ]
}
```

## Dashboard Configuration

### Docusaurus Analytics

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
  themeConfig: {
    algolia: {
      appId: 'YOUR_APP_ID',
      apiKey: 'YOUR_SEARCH_API_KEY',
      indexName: 'YOUR_INDEX_NAME',
      insights: true,
    },
  },
  scripts: [
    {
      src: '/js/custom-analytics.js',
      async: true,
    },
  ],
};
```

### MkDocs Analytics

```yaml
# mkdocs.yml
plugins:
  - search:
      analytics:
        provider: algolia
        property: YOUR_INDEX_NAME

extra:
  analytics:
    provider: google
    property: G-XXXXXXXXXX
    feedback:
      title: Was this page helpful?
      ratings:
        - icon: material/emoticon-happy-outline
          name: This page was helpful
          data: 1
          note: Thanks for your feedback!
        - icon: material/emoticon-sad-outline
          name: This page could be improved
          data: 0
          note: Thanks! Help us improve by using the feedback form.
```

## Workflow

1. **Configure analytics** - Set up GA4 and/or Algolia
2. **Implement tracking** - Add custom event tracking
3. **Collect data** - Gather usage metrics
4. **Analyze patterns** - Identify trends and gaps
5. **Generate reports** - Create actionable insights
6. **Optimize content** - Improve based on data

## Dependencies

```json
{
  "dependencies": {
    "algoliasearch": "^4.0.0",
    "@docsearch/js": "^3.0.0"
  },
  "devDependencies": {
    "@google-analytics/data": "^4.0.0"
  }
}
```

## Best Practices Applied

- Track meaningful events, not just pageviews
- Analyze search queries for content gaps
- Measure engagement beyond time on page
- Create actionable insights from data
- Respect user privacy (GDPR compliance)
- Focus on documentation ROI

## References

- Google Analytics 4: https://developers.google.com/analytics/devguides/collection/ga4
- Algolia Analytics: https://www.algolia.com/doc/guides/search-analytics/overview/
- DocSearch: https://docsearch.algolia.com/
- Privacy-friendly: https://plausible.io/

## Target Processes

- docs-audit.js
- content-strategy.js
- knowledge-base-setup.js
- docs-testing.js
