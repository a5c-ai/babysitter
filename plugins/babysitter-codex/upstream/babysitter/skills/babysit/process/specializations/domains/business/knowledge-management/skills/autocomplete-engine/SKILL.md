---
name: autocomplete-engine
description: Search autocomplete and type-ahead suggestion optimization for knowledge bases
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - WebFetch
metadata:
  specialization: knowledge-management
  domain: business
  category: Search Optimization
  skill-id: SK-016
---

# Autocomplete Engine Skill

## Overview

The Autocomplete Engine skill provides specialized capabilities for configuring, optimizing, and maintaining search autocomplete and type-ahead suggestion systems within knowledge management platforms. This skill enables intelligent, responsive search suggestions that improve user experience and reduce time-to-knowledge.

## Capabilities

### Suggestion Index Configuration
- Design and configure suggestion index structures
- Set up index mappings for autocomplete data
- Configure index refresh and update strategies
- Implement index sharding for performance

### Query Log Analysis
- Analyze search query logs for suggestion mining
- Identify popular and trending queries
- Detect query patterns and variations
- Extract actionable insights from search behavior

### Popular Query Mining
- Extract frequently searched terms and phrases
- Identify emerging search trends
- Build suggestion pools from historical data
- Prioritize suggestions based on usage patterns

### Personalized Suggestions
- Implement user-based personalization
- Configure role-based suggestion filtering
- Design context-aware suggestion systems
- Enable recent search integration

### Category-aware Suggestions
- Configure category facets in suggestions
- Implement content-type filtering
- Design hierarchical suggestion structures
- Enable scoped search suggestions

### Typo Tolerance Configuration
- Configure fuzzy matching algorithms
- Set up Levenshtein distance thresholds
- Implement phonetic matching
- Design error correction pipelines

### Multi-language Support
- Configure language-specific analyzers
- Implement cross-language suggestions
- Design transliteration support
- Enable language detection and routing

### Suggestion Ranking Algorithms
- Design relevance scoring models
- Implement popularity-based ranking
- Configure freshness signals
- Balance precision and recall

### Real-time Suggestion Updates
- Configure real-time indexing pipelines
- Implement streaming updates
- Design cache invalidation strategies
- Monitor suggestion freshness

## Dependencies

- Elasticsearch Suggesters (completion, phrase, term)
- Algolia Query Suggestions
- OpenSearch Completion API
- Redis for caching
- Apache Kafka for real-time updates

## Process Integration

This skill primarily integrates with:

- **search-optimization.js**: Core integration for all autocomplete and suggestion optimization workflows

## Usage

### Basic Suggestion Index Setup

```yaml
task: Configure autocomplete suggestion index
skill: autocomplete-engine
parameters:
  platform: elasticsearch
  index_name: knowledge-base-suggestions
  config:
    analyzer: standard
    max_suggestions: 10
    min_chars: 2
```

### Query Log Analysis

```yaml
task: Analyze query logs for suggestion mining
skill: autocomplete-engine
parameters:
  log_source: search-analytics
  time_range: 30d
  min_frequency: 10
  output: suggestion-candidates.json
```

### Personalization Configuration

```yaml
task: Configure personalized suggestions
skill: autocomplete-engine
parameters:
  personalization:
    user_history: true
    role_based: true
    recent_searches: 5
    weight: 0.3
```

## Best Practices

1. **Start with query log analysis** - Understand what users actually search for before configuring suggestions
2. **Balance speed and relevance** - Suggestions must be fast (under 100ms) while remaining relevant
3. **Monitor zero-suggest scenarios** - Track when suggestions fail to help users
4. **Implement A/B testing** - Continuously test and improve suggestion quality
5. **Consider mobile users** - Design suggestions for smaller screens and touch interfaces
6. **Respect privacy** - Ensure personalized suggestions don't expose sensitive information
7. **Plan for scale** - Design suggestion systems that handle traffic spikes gracefully

## Metrics

Key metrics to track for autocomplete optimization:

| Metric | Description | Target |
|--------|-------------|--------|
| Suggestion Latency | Time to return suggestions | < 100ms |
| Suggestion Acceptance Rate | % of searches using suggestions | > 40% |
| Position-1 Click Rate | % clicking first suggestion | > 25% |
| Zero-Suggest Rate | % queries with no suggestions | < 10% |
| Typo Recovery Rate | % typos successfully corrected | > 80% |

## Related Skills

- **search-engine** (SK-005): Enterprise search configuration
- **algolia-search** (SK-006): Algolia-specific search optimization
- **taxonomy-management** (SK-007): Category and taxonomy integration

## Related Agents

- **search-expert** (AG-004): Search and findability specialist
- **taxonomy-specialist** (AG-002): Category-aware suggestion design
