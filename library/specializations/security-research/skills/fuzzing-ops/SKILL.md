---
name: Fuzzing Operations Skill
description: Comprehensive fuzzing operations with AFL++, libFuzzer, and OSS-Fuzz integration
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Fuzzing Operations Skill

## Overview

This skill provides comprehensive fuzzing capabilities for automated vulnerability discovery using industry-standard fuzzing frameworks.

## Capabilities

- Configure and launch AFL++ campaigns
- Build instrumented binaries with coverage
- Create and manage seed corpora
- Triage and deduplicate crash files
- Run afl-tmin and afl-cmin for minimization
- Monitor fuzzing progress and coverage
- Generate crash reproduction scripts
- Support libFuzzer and honggfuzz

## Target Processes

- fuzzing-campaign.js
- security-tool-development.js
- vulnerability-research-workflow.js

## Dependencies

- AFL++ (afl-fuzz, afl-gcc, afl-clang-fast)
- LLVM (for instrumentation)
- Sanitizers (ASAN, MSAN, UBSAN)
- libFuzzer (LLVM)
- honggfuzz (optional)
- Python for crash analysis scripts

## Usage Context

This skill is essential for:
- Automated vulnerability discovery
- Coverage-guided fuzzing campaigns
- Crash triage and root cause analysis
- Harness development for fuzzing
- Integration with CI/CD security testing

## Integration Notes

- Supports parallel fuzzing across multiple cores
- Can integrate with corpus management systems
- Generates reproducible crash test cases
- Supports various target types (binaries, libraries, protocols)
- Coverage reports in lcov/html format
