# Security Guide

**Version:** 1.0
**Last Updated:** 2026-01-31

Comprehensive security guidelines for using Babysitter in development and production environments. This guide covers best practices for handling code, credentials, and network security.

---

## Table of Contents

- [Overview](#overview)
- [General Security](#general-security)
- [Breakpoints Service Security](#breakpoints-service-security)
  - [Production Setup](#production-setup)
  - [Authentication Configuration](#authentication-configuration)
- [Credential Management](#credential-management)
  - [Environment Variables](#environment-variables)
  - [Breakpoints for Sensitive Operations](#breakpoints-for-sensitive-operations)
  - [Journal File Review](#journal-file-review)
- [Code Review Security](#code-review-security)
  - [Reviewing Generated Code](#reviewing-generated-code)
  - [Security Test Coverage](#security-test-coverage)
  - [Security Scanning](#security-scanning)
- [Network Security](#network-security)
- [Compliance Considerations](#compliance-considerations)
- [Related Documentation](#related-documentation)

---

## Overview

Babysitter handles code generation, execution, and may interact with credentials during workflows. Following proper security practices ensures that:

- Sensitive data is not exposed in logs or version control
- Production systems are protected through approval gates
- Network services are properly secured
- Audit trails are maintained for compliance

---

## General Security

### Best Practices

**DO:**
- Review all code changes before final approval
- Use breakpoints before deploying to production
- Keep `.a5c/` directories out of version control (add to `.gitignore`)
- Regularly update to latest versions
- Run with least privilege necessary

**DON'T:**
- Commit `.a5c/` directories with sensitive data
- Run untrusted process definitions without review
- Expose breakpoints service publicly without authentication
- Store credentials in journal files

### .gitignore Configuration

Ensure your `.gitignore` includes:

```gitignore
# Babysitter run data
.a5c/

# Environment files with secrets
.env
.env.local
.env.*.local

# Credentials
*.pem
*.key
credentials.json
```

---

## Breakpoints Service Security

The breakpoints service provides a web UI and API for human-in-the-loop interactions. When exposing this service externally, proper security measures are essential.

### Production Setup

**1. Use HTTPS with ngrok/tunneling:**

```bash
# Bad: HTTP exposed publicly
ngrok http 3184

# Better: Use authentication
ngrok http 3184 --basic-auth "user:secure-password"
```

**2. Or use Telegram notifications:**
- No public endpoint needed
- Notifications via Telegram bot
- Configure in breakpoints UI
- More secure for production

**3. Firewall rules:**
- Restrict access to known IPs
- Use VPN for team access
- Don't expose to 0.0.0.0 in production

### Example Production Setup

```bash
# Start with localhost only
npx -y @a5c-ai/babysitter-sdk@latest breakpoints:start --host 127.0.0.1

# Use SSH tunnel for remote access
ssh -L 3184:localhost:3184 production-server

# Or use Telegram (recommended)
# Configure in UI at http://localhost:3184
```

### Authentication Configuration

Configure authentication tokens for API access:

```bash
# Set authentication tokens
export AGENT_TOKEN=secure-agent-token-here
export HUMAN_TOKEN=secure-human-token-here

# Start the service
breakpoints start --host 127.0.0.1
```

API usage with tokens:

```bash
# Agent creating breakpoint
curl -X POST http://localhost:3185/api/breakpoints \
  -H "Authorization: Bearer $AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question": "Approve?", "title": "Review"}'

# Human providing feedback
curl -X POST http://localhost:3185/api/breakpoints/<id>/feedback \
  -H "Authorization: Bearer $HUMAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"author": "reviewer", "comment": "Approved", "release": true}'
```

---

## Credential Management

### Environment Variables

Use environment variables for secrets (recommended):

```javascript
// In process definition
const apiKey = process.env.API_KEY;
await ctx.task(deployTask, { apiKey });
```

**Never hardcode credentials:**

```javascript
// BAD - Don't do this!
const apiKey = "sk-1234567890abcdef";

// GOOD - Use environment variables
const apiKey = process.env.API_KEY;
```

### Breakpoints for Sensitive Operations

Use breakpoints to require human approval for sensitive operations:

```javascript
await ctx.breakpoint({
  question: 'Deploy with production credentials?',
  title: 'Production Deployment',
  context: { environment: 'production', critical: true }
});
```

### Journal File Review

Review journal files before sharing to ensure no secrets were leaked:

```bash
# Check for leaked secrets
grep -i "password\|secret\|key\|token" .a5c/runs/*/journal/journal.jsonl
```

**Security tip:** Always set `BABYSITTER_ALLOW_SECRET_LOGS=false` in production to prevent sensitive data from appearing in logs.

---

## Code Review Security

### Reviewing Generated Code

Before approving breakpoints, review generated code for security issues:

- **SQL injection vulnerabilities** - Ensure parameterized queries are used
- **XSS vulnerabilities** - Check for proper output encoding
- **Insecure dependencies** - Review any new package additions
- **Hardcoded secrets** - Scan for API keys, passwords, tokens

### Security Test Coverage

Check test coverage for security-related tests:

- Authentication tests
- Authorization tests
- Input validation tests
- Error handling tests

### Security Scanning

Run security scans before approval:

```javascript
const security = await ctx.task(securityScanTask, {
  tools: ['npm audit', 'eslint-plugin-security']
});
```

**Recommended security tools:**

| Tool | Purpose |
|------|---------|
| `npm audit` | Dependency vulnerability scanning |
| `eslint-plugin-security` | Static analysis for security issues |
| `snyk` | Comprehensive vulnerability detection |
| `semgrep` | Code pattern matching for security |

---

## Network Security

### For Distributed Teams

1. **Use VPN** for breakpoints service access
2. **Implement authentication** on breakpoints UI
3. **Use HTTPS** for all external connections
4. **Audit access logs** regularly

### Network Configuration Checklist

| Requirement | Implementation |
|-------------|----------------|
| Local-only binding | `--host 127.0.0.1` |
| Encrypted transport | HTTPS via reverse proxy or ngrok |
| Authentication | `AGENT_TOKEN` and `HUMAN_TOKEN` |
| Access logging | Review breakpoints service logs |
| Firewall rules | Restrict to known IPs/VPN |

---

## Compliance Considerations

### For Regulated Environments

Babysitter provides several features that support compliance requirements:

| Requirement | Babysitter Feature |
|-------------|-------------------|
| **Audit trail** | Journal provides complete event history |
| **Approval gates** | Breakpoints create approval records |
| **Access control** | Limit who can approve production deployments |
| **Data retention** | Define policy for old run cleanup |
| **Encryption** | Encrypt `.a5c/` directories if needed |

### Audit Trail

Every action in Babysitter is logged in the journal:

```bash
# View complete event history for a run
cat .a5c/runs/<runId>/journal/journal.jsonl | jq .

# Filter for approval events
jq 'select(.type=="BREAKPOINT_RELEASED")' .a5c/runs/*/journal/journal.jsonl
```

### Data Retention Policy

Implement a cleanup policy for old runs:

```bash
# Example: Remove runs older than 30 days
find .a5c/runs -maxdepth 1 -type d -mtime +30 -exec rm -rf {} \;
```

### Encryption at Rest

For sensitive environments, encrypt the `.a5c/` directory:

```bash
# Using encrypted filesystem
# Mount encrypted volume at .a5c/

# Or use encryption tools
gpg --symmetric --cipher-algo AES256 .a5c/runs/sensitive-run/journal/journal.jsonl
```

---

## Related Documentation

- [Configuration Reference](./configuration.md) - Environment variables and settings
- [CLI Reference](./cli-reference.md) - Command-line options
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions
- [Glossary](./glossary.md) - Term definitions
