---
name: Debugger Integration Skill
description: Advanced debugging integration for vulnerability research
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Debugger Integration Skill

## Overview

This skill provides advanced debugging integration for vulnerability research and exploit development.

## Capabilities

- Control GDB/LLDB sessions programmatically
- Set conditional breakpoints
- Trace function calls and returns
- Monitor memory allocations
- Analyze crash dumps
- Support WinDbg for Windows
- Enable rr for record/replay
- Create debugging scripts

## Target Processes

- dynamic-analysis-runtime-testing.js
- exploit-development.js
- binary-reverse-engineering.js
- vulnerability-root-cause-analysis.js

## Dependencies

- GDB with pwndbg or gef
- LLDB
- WinDbg (Windows)
- rr (record/replay)
- Python 3.x (GDB Python API)

## Usage Context

This skill is essential for:
- Dynamic vulnerability analysis
- Exploit debugging
- Root cause analysis
- Memory corruption research
- Runtime behavior analysis

## Integration Notes

- Supports scripted debugging sessions
- Can record and replay executions
- Integrates with reverse engineering tools
- Supports remote debugging
- Can generate debugging reports
