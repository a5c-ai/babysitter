---
name: cirq-circuit-builder
description: Google Cirq integration skill for quantum circuit design and execution on Google quantum processors
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

# Cirq Circuit Builder

## Purpose

Provides expert guidance on quantum circuit design and execution using Google Cirq framework, enabling development and deployment to Google quantum processors.

## Capabilities

- Quantum circuit construction using Cirq
- Device-aware circuit compilation
- Noise simulation and characterization
- Virtual and XEB calibration
- Floquet calibration support
- Circuit serialization and import/export
- Sycamore processor targeting
- Custom gate definitions

## Usage Guidelines

1. **Circuit Design**: Build circuits using Cirq operations and moments
2. **Device Compilation**: Use device specifications for topology-aware compilation
3. **Noise Simulation**: Configure noise models for realistic simulation
4. **Calibration**: Integrate calibration data for accurate hardware mapping
5. **Serialization**: Export circuits for sharing and version control

## Tools/Libraries

- Cirq
- Cirq-Google
- TensorFlow Quantum
- Cirq-IonQ
- Cirq-AQT
