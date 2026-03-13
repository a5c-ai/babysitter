---
name: Feature Engineering Optimizer
description: Optimizes feature engineering pipelines and feature store configurations
version: 1.0.0
category: ML Engineering
skillId: SK-DEA-015
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Feature Engineering Optimizer

## Overview

Optimizes feature engineering pipelines and feature store configurations. This skill improves ML feature quality, performance, and serving efficiency.

## Capabilities

- Feature importance analysis
- Feature correlation detection
- Encoding strategy recommendations
- Feature freshness optimization
- Online/offline feature sync
- Feature versioning
- Point-in-time correctness validation
- Feature serving optimization

## Input Schema

```json
{
  "features": [{
    "name": "string",
    "definition": "string",
    "type": "string"
  }],
  "targetVariable": "string",
  "useCases": ["batch|realtime|streaming"],
  "performanceRequirements": "object"
}
```

## Output Schema

```json
{
  "optimizedFeatures": ["object"],
  "removedFeatures": ["string"],
  "engineeringRecommendations": ["object"],
  "servingConfig": "object"
}
```

## Target Processes

- Feature Store Setup
- A/B Testing Pipeline

## Usage Guidelines

1. Provide complete feature definitions
2. Specify target variable for importance analysis
3. Define use cases (batch, realtime, streaming)
4. Include performance requirements for serving optimization

## Best Practices

- Validate point-in-time correctness for training features
- Remove highly correlated features to reduce redundancy
- Optimize feature freshness based on actual requirements
- Version features alongside model versions
- Monitor feature drift in production
