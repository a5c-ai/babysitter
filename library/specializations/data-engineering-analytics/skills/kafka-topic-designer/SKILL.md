---
name: Kafka Topic Designer
description: Designs and optimizes Apache Kafka topics and configurations
version: 1.0.0
category: Streaming
skillId: SK-DEA-007
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Kafka Topic Designer

## Overview

Designs and optimizes Apache Kafka topics and configurations. This skill provides expertise in topic architecture, partitioning strategies, and producer/consumer configuration for optimal streaming performance.

## Capabilities

- Topic naming convention design
- Partition strategy optimization
- Replication factor recommendations
- Retention policy configuration
- Compaction strategy design
- Schema registry integration
- Consumer group design
- Throughput capacity planning
- Security configuration (ACLs, encryption)

## Input Schema

```json
{
  "requirements": {
    "throughputMBps": "number",
    "messageSize": "number",
    "retentionDays": "number",
    "orderingRequirements": "string"
  },
  "existingTopics": ["object"],
  "clusterConfig": "object"
}
```

## Output Schema

```json
{
  "topicDesign": {
    "name": "string",
    "partitions": "number",
    "replicationFactor": "number",
    "configs": "object"
  },
  "schemaDefinition": "object",
  "producerConfig": "object",
  "consumerConfig": "object"
}
```

## Target Processes

- Streaming Pipeline
- ETL/ELT Pipeline (CDC)
- Feature Store Setup

## Usage Guidelines

1. Define throughput and latency requirements
2. Specify message size and retention needs
3. Document ordering requirements (per-partition, global)
4. Include existing topic configurations for consistency

## Best Practices

- Use consistent naming conventions across all topics
- Size partitions based on consumer parallelism needs
- Configure appropriate retention for compliance and replay scenarios
- Implement schema registry for schema evolution
- Set up proper ACLs for security
