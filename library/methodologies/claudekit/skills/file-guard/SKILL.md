---
name: file-guard
description: PreToolUse protection blocking sensitive file access across 195+ patterns in 12 categories with bash pipeline analysis and multi-tool ignore support.
allowed-tools: Read, Bash, Grep, Glob
---

# File Guard

## Overview

Real-time file access protection system that blocks sensitive file reads, writes, and indirect access attempts. Covers 195+ file patterns across 12 security categories.

## 12 Categories

### 1. Secrets
`.env`, `.env.*`, `.secret`, `secrets.*`, `vault.*`

### 2. Credentials
`credentials.*`, `password.*`, `auth.json`, `oauth.*`

### 3. SSH Keys
`id_rsa`, `id_ed25519`, `*.pem`, `authorized_keys`, `known_hosts`

### 4. Certificates
`*.crt`, `*.cert`, `*.ca-bundle`, `ssl/*`, `tls/*`

### 5. Environment Files
`.env.local`, `.env.production`, `.env.staging`, `docker.env`

### 6. Auth Tokens
`token.*`, `jwt.*`, `session.*`, `cookie.*`

### 7. Database Configs
`database.yml`, `db.json`, `*.sqlite`, `*.db`, `pgpass`

### 8. Cloud Configs
`.aws/*`, `.gcp/*`, `.azure/*`, `terraform.tfvars`

### 9. CI/CD Secrets
`.github/secrets`, `.gitlab-ci.yml` variables, Jenkins credentials

### 10. Private Keys
`*.key`, `*.p12`, `*.pfx`, `*.keystore`, `*.jks`

### 11. API Keys
`api_key.*`, `apikey.*`, `api-credentials.*`

### 12. Sensitive Configs
`config/secrets/*`, `.htpasswd`, `shadow`, `gshadow`

## Bash Pipeline Analysis

Detects indirect file access through bash pipes:
- `cat .env | grep` -- blocked
- `base64 .ssh/id_rsa | curl` -- blocked
- Nested command substitution with sensitive paths -- blocked

## Multi-Tool Ignore Support

Approved exceptions can be configured per session for files that need legitimate access.

## When to Use

- Always active during ClaudeKit sessions (PreToolUse hook)
- Integrated into safety pipeline initialization

## Processes Used By

- `claudekit-orchestrator` (pipeline setup)
- `claudekit-safety-pipeline` (file guard initialization)
