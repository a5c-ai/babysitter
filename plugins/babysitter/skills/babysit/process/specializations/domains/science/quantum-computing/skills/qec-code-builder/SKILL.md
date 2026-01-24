---
name: qec-code-builder
description: Quantum error correction code design skill for constructing and analyzing stabilizer codes
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
  category: error-management
  domain: quantum-computing
  tools:
    - Stim
    - PyMatching
    - LDPC libraries
  processes:
    - quantum-error-correction-design
    - fault-tolerant-circuit-design
    - quantum-memory-protocol-development
---

# QEC Code Builder Skill

## Purpose

Provides quantum error correction code construction capabilities for designing, analyzing, and implementing stabilizer codes including surface codes, color codes, and LDPC codes.

## Capabilities

- **Stabilizer Code Design**: Construct CSS and non-CSS codes
- **Surface Code Layout**: Design planar and toric codes
- **Color Code Construction**: Build 2D and 3D color codes
- **LDPC Codes**: Design quantum LDPC codes
- **Code Parameter Analysis**: Calculate distance and rate
- **Syndrome Extraction**: Design measurement circuits

## Usage Guidelines

1. **Code Selection**
   - Analyze error model and threshold requirements
   - Consider hardware connectivity
   - Balance overhead with protection

2. **Code Construction**
   - Define stabilizer generators
   - Build parity check matrices
   - Design logical operators

3. **Circuit Implementation**
   - Design syndrome extraction circuits
   - Plan logical gate implementation
   - Configure decoding strategy

4. **Best Practices**
   - Start with well-understood codes
   - Verify code parameters
   - Test with realistic noise models
   - Document code properties
