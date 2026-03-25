---
name: Ghidra/IDA Reverse Engineering Skill
description: Deep integration with Ghidra and IDA Pro for binary analysis and reverse engineering
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Ghidra/IDA Reverse Engineering Skill

## Overview

This skill provides deep integration with Ghidra and IDA Pro for comprehensive binary analysis and reverse engineering tasks.

## Capabilities

- Execute Ghidra headless analysis scripts
- Parse and interpret disassembly output
- Generate and run Ghidra Python scripts
- Analyze decompiled code for vulnerabilities
- Extract function signatures and data structures
- Create and apply Ghidra type definitions
- Export analysis artifacts (call graphs, data flows)
- Support IDA Pro scripting (IDAPython)

## Target Processes

- binary-reverse-engineering.js
- firmware-analysis.js
- malware-analysis.js
- vulnerability-root-cause-analysis.js

## Dependencies

- Ghidra CLI (analyzeHeadless)
- IDA Pro (optional, for IDAPython support)
- Python 3.x with ghidra_bridge or ghidrathon
- Java Runtime Environment (for Ghidra)

## Usage Context

This skill is essential for:
- Static binary analysis workflows
- Vulnerability discovery in compiled code
- Malware reverse engineering
- Firmware extraction and analysis
- Protocol reverse engineering from binaries

## Integration Notes

- Ghidra headless mode enables automated analysis pipelines
- Results can be exported as JSON, XML, or custom formats
- Supports both script-based and interactive analysis workflows
- Can generate Ghidra project files for manual follow-up
