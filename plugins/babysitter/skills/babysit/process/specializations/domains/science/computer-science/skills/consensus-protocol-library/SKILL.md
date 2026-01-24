---
name: consensus-protocol-library
description: Reference implementations and specifications of consensus protocols including Paxos, Raft, and PBFT
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
  category: distributed-systems
  domain: computer-science
  tools:
    - TLA+ specifications
    - Reference implementations
    - Protocol analyzers
  processes:
    - distributed-consensus-protocol-design
---

# Consensus Protocol Library Skill

## Purpose

Provides reference implementations and formal specifications of consensus protocols for distributed system design and analysis.

## Capabilities

- **Protocol Specifications**: Paxos, Raft, PBFT specifications
- **Comparison Matrix**: Compare protocol properties
- **Property Templates**: Safety and liveness property templates
- **Complexity Analysis**: Message complexity analysis
- **Variant Catalog**: Catalog of protocol variants

## Usage Guidelines

1. **Protocol Selection**
   - Analyze system requirements
   - Compare protocol properties
   - Consider fault model

2. **Specification Study**
   - Review formal specification
   - Understand safety properties
   - Analyze liveness conditions

3. **Implementation**
   - Follow reference implementation
   - Verify against specification
   - Test with fault injection

4. **Best Practices**
   - Understand theoretical foundations
   - Verify safety properties formally
   - Test liveness under realistic conditions
   - Document protocol choices
