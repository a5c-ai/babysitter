---
name: feast-feature-store
description: Feature store management skill for online/offline feature serving, feature registration, and training-serving consistency.
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

# feast-feature-store

## Overview

Feature store management skill using Feast for online/offline feature serving, feature registration, and ensuring training-serving consistency in ML systems.

## Capabilities

- Feature definition and registration
- Online feature serving setup
- Offline feature retrieval for training
- Point-in-time correctness validation
- Feature freshness monitoring
- Entity management
- Feature view creation and management
- Materialization scheduling

## Target Processes

- Feature Store Implementation and Management
- Feature Engineering Design and Implementation
- Model Training Pipeline

## Tools and Libraries

- Feast
- Redis (online store)
- PostgreSQL/BigQuery/Snowflake (offline store)
- Parquet files

## Input Schema

```json
{
  "type": "object",
  "required": ["action"],
  "properties": {
    "action": {
      "type": "string",
      "enum": ["apply", "materialize", "get-online", "get-historical", "list", "teardown"],
      "description": "Feast action to perform"
    },
    "featureRepo": {
      "type": "string",
      "description": "Path to feature repository"
    },
    "features": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Feature references (feature_view:feature_name)"
    },
    "entityDf": {
      "type": "string",
      "description": "Path to entity DataFrame for historical retrieval"
    },
    "materializationWindow": {
      "type": "object",
      "properties": {
        "startDate": { "type": "string" },
        "endDate": { "type": "string" }
      }
    }
  }
}
```

## Output Schema

```json
{
  "type": "object",
  "required": ["status", "action"],
  "properties": {
    "status": {
      "type": "string",
      "enum": ["success", "error"]
    },
    "action": {
      "type": "string"
    },
    "features": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "dtype": { "type": "string" },
          "featureView": { "type": "string" },
          "freshness": { "type": "string" }
        }
      }
    },
    "materializationStatus": {
      "type": "object",
      "properties": {
        "lastMaterialized": { "type": "string" },
        "rowsProcessed": { "type": "integer" }
      }
    },
    "retrievedData": {
      "type": "string",
      "description": "Path to retrieved feature data"
    }
  }
}
```

## Usage Example

```javascript
{
  kind: 'skill',
  title: 'Retrieve training features',
  skill: {
    name: 'feast-feature-store',
    context: {
      action: 'get-historical',
      featureRepo: 'feature_repo/',
      features: ['user_features:age', 'user_features:tenure', 'transaction_features:avg_amount'],
      entityDf: 'data/training_entities.parquet'
    }
  }
}
```
