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
  - Task
metadata:
  version: "1.0"
  category: quantum-frameworks
  domain: quantum-computing
  tools:
    - Amazon Braket SDK
    - AWS Lambda
    - S3
  processes:
    - multi-platform-deployment
    - quantum-optimization-application
    - quantum-classical-hybrid-system-integration
---

# Braket Executor Skill

## Purpose

Provides Amazon Braket capabilities for executing quantum circuits on multiple hardware vendors including IonQ, Rigetti, and D-Wave through a unified interface.

## Capabilities

- **Multi-Vendor Execution**: Run on IonQ, Rigetti, OQC hardware
- **Hybrid Jobs**: Execute hybrid quantum-classical workflows
- **Quantum Annealing**: Access D-Wave quantum annealers
- **Local Simulation**: Test circuits locally before hardware
- **Cost Estimation**: Estimate and track execution costs
- **S3 Integration**: Store results in S3 buckets

## Usage Guidelines

1. **Circuit Definition**
   - Use Braket SDK for circuit construction
   - Apply gates supported by target device
   - Configure measurements

2. **Backend Selection**
   - Compare device capabilities
   - Check availability and queue times
   - Consider cost per shot

3. **Job Execution**
   - Submit circuits as tasks
   - Monitor job status
   - Retrieve results from S3

4. **Best Practices**
   - Test on local simulator first
   - Use hybrid jobs for iterative algorithms
   - Track costs carefully
   - Document device selection rationale
