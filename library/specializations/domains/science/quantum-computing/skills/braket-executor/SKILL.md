---
name: braket-executor
description: Amazon Braket integration skill for multi-vendor quantum hardware access and hybrid workflows
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
metadata:
  specialization: quantum-computing
  domain: science
  category: quantum-framework
  phase: 6
---

# Braket Executor

## Purpose

Provides expert guidance on executing quantum circuits across multiple hardware vendors using Amazon Braket, enabling hybrid quantum-classical workflows in the AWS ecosystem.

## Capabilities

- Circuit execution on IonQ, Rigetti, OQC hardware
- Hybrid job execution with classical processing
- Quantum annealing on D-Wave
- Local simulator execution
- Cost estimation and job management
- Result storage in S3
- Batch job submission
- Noise simulation

## Usage Guidelines

1. **Device Selection**: Choose appropriate hardware based on circuit requirements and availability
2. **Circuit Translation**: Use Braket SDK to build or import circuits from other frameworks
3. **Hybrid Jobs**: Configure containerized hybrid workflows with classical compute
4. **Cost Management**: Monitor and estimate costs before job submission
5. **Result Retrieval**: Access results from S3 with proper error handling

## Tools/Libraries

- Amazon Braket SDK
- AWS Lambda
- Amazon S3
- Braket Hybrid Jobs
- Braket Local Simulator
