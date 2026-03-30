---
name: Mobile Security Testing Skill
description: Android and iOS application security testing
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Mobile Security Testing Skill

## Overview

This skill provides Android and iOS application security testing capabilities using dynamic instrumentation and analysis tools.

## Capabilities

- Execute Frida scripts for hooking
- Analyze APK/IPA files
- Bypass SSL pinning
- Extract app data and credentials
- Perform dynamic instrumentation
- Support Objection framework
- Run MobSF analysis
- Generate mobile security reports

## Target Processes

- mobile-app-security-research.js
- bug-bounty-workflow.js
- red-team-operations.js

## Dependencies

- Frida (frida-tools)
- Objection framework
- MobSF (Mobile Security Framework)
- adb (Android Debug Bridge)
- idevice tools (iOS)
- apktool, jadx (Android)

## Usage Context

This skill is essential for:
- Mobile application penetration testing
- App store security assessment
- Mobile malware analysis
- API security testing from mobile apps
- SSL/TLS inspection

## Integration Notes

- Supports both rooted and non-rooted testing
- Can automate common bypass techniques
- Integrates with CI/CD for mobile security
- Supports emulator and real device testing
- Can extract and analyze app binaries
