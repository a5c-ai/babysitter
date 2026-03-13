---
name: security-scanning
description: AgentShield security audit with 5 scanning categories, 102 static analysis rules, and optional red-team simulation.
allowed-tools: Read, Bash, Grep, Glob
---

# Security Scanning

## Overview

AgentShield security audit methodology adapted from the Everything Claude Code project. Scans across 5 categories with 102 static analysis rules.

## Scanning Categories

### 1. Secrets Detection (14 Pattern Categories)
- AWS access keys (AKIA pattern)
- GitHub tokens (ghp_, gho_, ghs_, ghr_)
- Generic API keys and bearer tokens
- Database connection strings with credentials
- Private keys (RSA, EC, SSH)
- JWT secrets and signing keys
- OAuth client secrets
- Slack tokens and webhooks
- Cloud provider credentials (GCP, Azure)

### 2. Permission Auditing
- File system read/write scope
- Network calls and protocols
- Process execution (child_process)
- File permissions (777, world-writable)
- CORS and CSP headers
- Docker privilege escalation

### 3. Hook Injection Analysis
- Git hooks for command injection
- npm lifecycle scripts (preinstall, postinstall)
- Claude Code hooks for unsafe patterns
- eval()/Function()/dynamic code execution
- Unvalidated user input in shell commands

### 4. MCP Risk Profiling
- Tool permission inventory
- Data exposure risk mapping
- Transport security (stdio vs SSE vs HTTP)
- Prompt injection via tool descriptions
- Rate limiting verification

### 5. Agent Config Review
- Model settings integrity
- Prompt injection resistance
- Tool allowlist scoping
- Output validation and sanitization
- Information leakage in error messages

## Optional: Red Team Simulation
- Attack simulation against found vulnerabilities
- Exploitability rating: trivial, moderate, difficult, theoretical
- Blue-team defense recommendations

## When to Use

- Pre-deployment security review
- New dependency introduction
- Hook or plugin configuration changes
- Agent or MCP server setup

## Agents Used

- `security-reviewer` (primary consumer)
