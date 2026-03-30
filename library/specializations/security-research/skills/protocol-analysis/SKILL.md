---
name: Network Protocol Analysis Skill
description: Network protocol capture, analysis, and fuzzing capabilities
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Network Protocol Analysis Skill

## Overview

This skill provides network protocol capture, analysis, and fuzzing capabilities for security research.

## Capabilities

- Capture and analyze pcap files
- Write Wireshark dissectors (Lua)
- Create Scapy packet crafting scripts
- Execute network fuzzing with boofuzz
- Parse protocol state machines
- Generate protocol documentation
- Support TLS/SSL analysis
- Create network-based exploits

## Target Processes

- protocol-reverse-engineering.js
- network-penetration-testing.js
- malware-analysis.js
- firmware-analysis.js

## Dependencies

- Wireshark/tshark
- Scapy (Python)
- boofuzz
- tcpdump
- nmap
- Python 3.x

## Usage Context

This skill is essential for:
- Protocol reverse engineering
- Network vulnerability research
- C2 protocol analysis
- Custom protocol fuzzing
- Network-based exploit development

## Integration Notes

- Supports live capture and offline analysis
- Can generate reproducible packet sequences
- Integrates with protocol documentation tools
- Supports encrypted traffic analysis (with keys)
- Can create custom Wireshark dissectors
