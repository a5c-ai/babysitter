---
name: video-marketing
description: Video platform optimization and analytics for YouTube and other video channels
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - WebFetch
metadata:
  specialization: digital-marketing
  domain: business
  category: Content Marketing
  skill-id: SK-014
  dependencies:
    - YouTube Data API
    - YouTube Analytics API
---

# Video Marketing Skill

## Overview

The Video Marketing skill provides specialized capabilities for video platform optimization and analytics, with deep integration into YouTube Studio and third-party video optimization tools. This skill enables comprehensive video SEO optimization, performance analysis, and content strategy execution across video platforms.

## Capabilities

### YouTube Studio API Integration
- Channel management and configuration
- Video upload and metadata management
- Playlist creation and organization
- End screen and card configuration
- Comment moderation settings
- Channel branding customization

### TubeBuddy Optimization Recommendations
- Tag suggestions and optimization
- SEO score analysis
- Best time to publish recommendations
- Competitor tag analysis
- Keyword explorer integration
- A/B testing for thumbnails

### vidIQ Competitor Analysis
- Competitor channel tracking
- Video performance benchmarking
- Trend alerts and opportunities
- Keyword research and scoring
- Channel audit capabilities
- Views per hour tracking

### Video SEO Optimization
- Title optimization with keywords
- Description template creation
- Tag strategy and implementation
- Transcript optimization
- Closed caption management
- Metadata best practices

### Thumbnail A/B Testing
- Thumbnail performance tracking
- Click-through rate analysis
- Design recommendation generation
- Split testing configuration
- Winner selection automation
- Historical performance comparison

### End Screen and Card Configuration
- End screen template design
- Card placement optimization
- CTA strategy implementation
- Cross-promotion setup
- Subscriber conversion tracking
- Link click analysis

### Playlist Management
- Playlist structure optimization
- Series playlist configuration
- Auto-add rules setup
- Playlist SEO optimization
- Watch time optimization
- Playlist performance tracking

### YouTube Analytics Interpretation
- Watch time analysis
- Audience retention metrics
- Traffic source breakdown
- Demographic insights
- Revenue analytics (if monetized)
- Subscriber growth tracking
- Click-through rate trends
- Impression analysis

### Video Transcription and Captions
- Auto-caption review and editing
- Multi-language caption support
- Transcript generation
- SRT/VTT file management
- Accessibility compliance
- Search optimization through captions

## Usage

### Basic Video Optimization
```javascript
const videoOptimization = {
  videoId: 'VIDEO_ID',
  optimizations: {
    title: {
      current: 'My Video Title',
      suggested: 'How to [Keyword] - Complete Guide 2026',
      keywords: ['primary keyword', 'secondary keyword']
    },
    description: {
      template: 'structured-description',
      includeTimestamps: true,
      includeCTAs: true,
      includeLinks: true
    },
    tags: {
      primary: ['main keyword', 'topic'],
      secondary: ['related terms', 'variations'],
      longtail: ['specific phrases']
    },
    thumbnail: {
      testVariants: 3,
      trackCTR: true
    }
  }
};
```

### Analytics Query
```javascript
const analyticsQuery = {
  channelId: 'CHANNEL_ID',
  dateRange: {
    start: '2026-01-01',
    end: '2026-01-24'
  },
  metrics: [
    'views',
    'watchTime',
    'averageViewDuration',
    'subscribersGained',
    'estimatedRevenue',
    'impressions',
    'impressionsCTR'
  ],
  dimensions: ['video', 'day'],
  filters: {
    videoIds: ['VIDEO_ID_1', 'VIDEO_ID_2']
  }
};
```

### Playlist Optimization
```javascript
const playlistConfig = {
  playlistId: 'PLAYLIST_ID',
  optimization: {
    title: 'SEO optimized playlist title',
    description: 'Keyword-rich description',
    ordering: 'engagement-based',
    autoAdd: {
      enabled: true,
      rules: ['tag:series-name', 'title:contains:keyword']
    }
  }
};
```

## Process Integration

This skill integrates with the following digital marketing processes:

| Process | Integration Points |
|---------|-------------------|
| video-content-production.js | Video optimization, analytics, thumbnail testing |
| content-marketing-strategy.js | Video content planning, performance analysis |
| social-content-calendar.js | Video scheduling, cross-platform distribution |

## Best Practices

1. **Title Optimization**: Place primary keywords at the beginning of titles while maintaining viewer appeal
2. **Description Structure**: Use timestamps, include relevant links, and front-load keywords
3. **Thumbnail Testing**: Always test multiple thumbnail variants for important videos
4. **Tags Strategy**: Use a mix of broad and specific tags, include common misspellings
5. **End Screens**: Add end screens to every video longer than 25 seconds
6. **Cards**: Use cards strategically to promote related content or CTAs
7. **Playlists**: Organize content into themed playlists to increase session duration
8. **Captions**: Review auto-generated captions for accuracy, especially for technical terms
9. **Analytics Review**: Check analytics weekly to identify trends and opportunities
10. **Competitor Analysis**: Regularly monitor competitor channels for strategy insights

## Metrics and KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| Watch Time | Total minutes watched | Increase MoM |
| Average View Duration | Mean watch time per view | >50% of video length |
| Click-Through Rate | Impressions to views ratio | >5% |
| Subscriber Conversion | Views to subscribers ratio | >2% |
| Audience Retention | Percentage of video watched | >40% |
| Traffic Sources | Distribution of view origins | Diversified |

## Related Skills

- SK-008: Social Media Management (cross-platform video distribution)
- SK-012: Content Management (video content in CMS)
- SK-013: Content Optimization (video content strategy)
