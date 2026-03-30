---
name: social-listening-pr
description: Social media monitoring and conversation analysis for PR intelligence
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
  category: Reputation Monitoring
  skill-id: SK-002
  dependencies:
    - Sprinklr API
    - Talkwalker API
    - Native social APIs
---

# Social Listening Skill

## Overview

The Social Listening skill provides comprehensive social media monitoring and conversation analysis capabilities for PR intelligence. This skill enables real-time awareness of brand conversations, crisis signal detection, and social sentiment tracking across all major platforms.

## Capabilities

### Platform Monitoring
- Sprinklr social listening integration
- Talkwalker conversation analysis
- Platform-specific monitoring (Twitter/X, LinkedIn, Reddit, Facebook, Instagram)
- Forum and community monitoring
- Review site tracking

### Alert Configuration
- Mention alert configuration
- Hashtag and keyword tracking
- Influencer conversation monitoring
- Crisis signal detection
- Viral content detection

### Conversation Analysis
- Community conversation clustering
- Topic extraction and trending
- Conversation volume tracking
- Geographic analysis
- Demographic insights

### Sentiment Analysis
- Social sentiment analysis
- Platform-specific sentiment
- Emotion detection
- Sentiment trend tracking
- Comparative benchmarking

### Influencer Intelligence
- Influencer identification
- Engagement tracking
- Sentiment by influencer
- Amplification analysis
- Relationship mapping

## Usage

### Social Listening Configuration
```javascript
const socialListeningConfig = {
  platforms: ['twitter', 'linkedin', 'reddit', 'facebook', 'instagram'],
  monitoring: {
    brandTerms: ['@CompanyHandle', '#CompanyHashtag', 'Company Name'],
    products: ['Product1', 'Product2'],
    executives: ['CEO Name', '@CEOHandle'],
    competitors: ['@Competitor1', '@Competitor2'],
    industry: ['#IndustryTerm', 'Industry Topic']
  },
  alerts: {
    crisisKeywords: {
      terms: ['lawsuit', 'scandal', 'breach', 'layoffs'],
      threshold: 5,
      window: '1h',
      immediate: true
    },
    viralContent: {
      engagementThreshold: 1000,
      velocityThreshold: 100,
      immediate: true
    },
    influencerMention: {
      followerThreshold: 50000,
      immediate: true
    },
    sentimentShift: {
      changeThreshold: -20,
      immediate: true
    }
  },
  reporting: {
    realtime: ['crisis-dashboard'],
    daily: ['mention-summary', 'sentiment-report'],
    weekly: ['influencer-report', 'trending-topics']
  }
};
```

### Conversation Analysis
```javascript
const conversationAnalysis = {
  period: 'weekly',
  summary: {
    totalMentions: 3450,
    uniqueAuthors: 2890,
    engagements: 45000,
    potentialReach: 12000000
  },
  platformBreakdown: {
    twitter: { mentions: 1800, sentiment: 0.65 },
    linkedin: { mentions: 450, sentiment: 0.78 },
    reddit: { mentions: 200, sentiment: 0.45 },
    instagram: { mentions: 700, sentiment: 0.72 },
    facebook: { mentions: 300, sentiment: 0.58 }
  },
  topicsIdentified: [
    { topic: 'Product Launch', volume: 800, sentiment: 0.82 },
    { topic: 'Customer Service', volume: 450, sentiment: 0.35 },
    { topic: 'Industry News', volume: 320, sentiment: 0.60 }
  ],
  influencerActivity: [
    { handle: '@TechInfluencer', followers: 250000, mentions: 3, sentiment: 'positive' },
    { handle: '@IndustryAnalyst', followers: 150000, mentions: 2, sentiment: 'neutral' }
  ]
};
```

## Process Integration

This skill integrates with the following PR processes:

| Process | Integration Points |
|---------|-------------------|
| reputation-monitoring.js | Social channel tracking |
| reputation-risk-identification.js | Crisis signal detection |
| crisis-response-execution.js | Real-time monitoring |
| social-listening-pr.js | Full workflow support |

## Best Practices

1. **Multi-Platform Coverage**: Monitor all platforms where your audience engages
2. **Crisis Keywords**: Maintain updated crisis keyword lists
3. **Influencer Tracking**: Identify and track key voices proactively
4. **Context Matters**: Review mentions in context before escalating
5. **Response Speed**: Have protocols for rapid response to issues
6. **Competitive Intelligence**: Track competitor social activity

## Metrics and KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| Social Mentions | Total brand mentions | Growing trend |
| Social Sentiment | Average sentiment score | >65% positive |
| Response Time | Time to respond to issues | <1 hour |
| Influencer Engagement | Positive influencer mentions | Increasing |
| Crisis Detection | Time to detect issues | <15 minutes |

## Related Skills

- SK-001: Media Monitoring (traditional media)
- SK-006: Reputation Intelligence (reputation tracking)
- SK-015: Employee Advocacy (employee social)
