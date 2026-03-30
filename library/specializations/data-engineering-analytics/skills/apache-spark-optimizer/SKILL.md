---
name: Apache Spark Optimizer
description: Analyzes and optimizes Apache Spark jobs for performance, cost, and resource utilization
version: 1.0.0
category: Distributed Processing
skillId: SK-DEA-001
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Apache Spark Optimizer

## Overview

Analyzes and optimizes Apache Spark jobs for performance, cost, and resource utilization. This skill provides deep expertise in Spark execution plans, partitioning strategies, and resource configuration to maximize efficiency.

## Capabilities

- Spark execution plan analysis and optimization
- Partition strategy recommendations
- Shuffle reduction techniques
- Memory and executor configuration tuning
- Catalyst optimizer hints generation
- Data skew detection and mitigation
- Broadcast join optimization
- Caching strategy recommendations

## Input Schema

```json
{
  "sparkCode": "string",
  "clusterConfig": "object",
  "executionMetrics": "object",
  "dataCharacteristics": {
    "volumeGB": "number",
    "partitionCount": "number",
    "skewFactor": "number"
  }
}
```

## Output Schema

```json
{
  "optimizedCode": "string",
  "recommendations": ["string"],
  "expectedImprovement": {
    "executionTime": "percentage",
    "resourceUsage": "percentage",
    "cost": "percentage"
  },
  "configChanges": "object"
}
```

## Target Processes

- ETL/ELT Pipeline
- Streaming Pipeline
- Feature Store Setup
- Pipeline Migration

## Usage Guidelines

1. Provide the Spark code or job definition for analysis
2. Include cluster configuration details (executors, memory, cores)
3. Share execution metrics if available (from Spark UI or history server)
4. Describe data characteristics including volume, partitions, and known skew

## Best Practices

- Always analyze execution plans before and after optimization
- Test optimizations on representative data samples first
- Monitor resource utilization during optimization validation
- Document configuration changes for reproducibility
- Consider cost implications alongside performance gains
