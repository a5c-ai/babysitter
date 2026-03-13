---
name: security-hardening
description: AIDefence security layer with prompt injection blocking, input validation, sandboxed execution, output sanitization, and STRIDE threat modeling.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, WebFetch, WebSearch, Agent, AskUserQuestion
---

# Security Hardening

## Overview

Multi-layered security audit pipeline implementing the AIDefence architecture. Protects against prompt injection, path traversal, and other attack vectors while ensuring compliance with security best practices.

## When to Use

- Before deploying code to production
- When processing untrusted inputs
- Security audits of agent-generated code
- Compliance verification (OWASP Top 10, CIS)

## AIDefence Layers

1. **Prompt Injection Detection** - Pattern + heuristic blocking
2. **Input Validation** - Path traversal, type coercion, parameter sanitization
3. **Static Analysis (SAST)** - Vulnerability scanning, CWE matching
4. **Sandboxed Execution** - Network isolation, filesystem restrictions, resource limits
5. **Output Sanitization** - Secrets, PII, injection vector redaction

## Security Levels

| Level | Layers | Use Case |
|-------|--------|----------|
| standard | SAST + validation + sanitization | Routine audits |
| elevated | + threat modeling + compliance | Pre-release audits |
| maximum | + sandbox + full STRIDE + remediation | Critical systems |

## Agents Used

- `agents/security-auditor/` - Vulnerability detection
- `agents/reviewer/` - Code quality verification

## Tool Use

Invoke via babysitter process: `methodologies/ruflo/ruflo-security-audit`
