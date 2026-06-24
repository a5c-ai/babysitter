[Docs](../index.md) › [Reference](./index.md) › Security

# Security Guide

**Version:** 1.1
**Last Updated:** 2026-06-22

Comprehensive security guidelines for using Babysitter in development and production environments. This guide covers best practices for handling code, credentials, and network security.

---

## On this page

- [Overview](#overview)
- [General Security](#general-security)
  - [Best Practices](#best-practices)
  - [.gitignore Configuration](#gitignore-configuration)
- [Credential Management](#credential-management)
  - [Environment Variables](#environment-variables)
  - [Breakpoints for Sensitive Operations](#breakpoints-for-sensitive-operations)
  - [Journal File Review](#journal-file-review)
  - [Secrets in the Adapters CLI and CI Triggers](#secrets-in-the-adapters-cli-and-ci-triggers)
- [Tamper-Evident Approvals](#tamper-evident-approvals)
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
- Use [breakpoints](./glossary.md) before deploying to production
- Keep `.a5c/` directories out of version control (add to `.gitignore`)
- Regularly update to latest versions
- Run with least privilege necessary

**DON'T:**
- Commit `.a5c/` directories with sensitive data
- Run untrusted process definitions without review
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
grep -i "password\|secret\|key\|token" .a5c/runs/*/journal/*.json
```

**Security tip:** Always set `BABYSITTER_ALLOW_SECRET_LOGS=false` in production to prevent sensitive data from appearing in logs.

### Secrets in the Adapters CLI and CI Triggers

The host-side `adapters` CLI (package `@a5c-ai/adapters-cli`) launches and authenticates harnesses on your machine, so it can touch provider credentials. Keep secrets out of arguments and shell history:

- **Prefer ambient credentials.** Use `adapters auth check` and `adapters auth setup <agent>` to verify and configure provider auth rather than passing keys inline. See the [Adapters CLI Reference](./adapters-cli.md).
- **Avoid keys on the command line.** When launching a provider, prefer the provider's own credential chain over `--api-key`; for token-based providers use `--auth-command` to emit a short-lived bearer token instead of a static key. Anything passed as an argument may be captured in shell history and process listings.
- **Scope environment injection.** When passing variables into a run with `adapters run --env KEY=VALUE`, pass secret *names* sourced from your environment, never literal secret values.

For CI, Babysitter v6 **Triggers** normalize inbound webhooks from GitHub, GitLab, and Bitbucket (via the `adapters-triggers` action). Treat trigger pipelines like any other secret-bearing CI job:

- Store provider keys and tokens as CI secrets and reference them by name (e.g. repository/organization secrets), never inline in workflow files.
- Grant the workflow only the token scopes it needs.
- Be cautious with triggers that run on untrusted input (such as PRs from forks), which can expose secrets to attacker-controlled code.

See [GitHub Actions Setup](../../github-actions-setup-babysitter.md) for end-to-end CI configuration.

---

## Tamper-Evident Approvals

The **Breakpoints Adapter** (v6) records human-in-the-loop approvals to a durable backend and **cryptographically signs** each approval - the "proven" approval model. This makes the approval trail *verifiable* rather than merely *trusted*: you can confirm who approved what, and detect after-the-fact tampering, instead of relying on an unsigned log that could be edited.

This complements the [journal audit trail](#audit-trail): the journal records that an approval happened, while signed approvals let you cryptographically verify the record is authentic and unaltered.

The Breakpoints Adapter replaces the legacy `breakpoints-pro` package (now deprecated). For the approval workflow and how to route breakpoints to a durable backend, see [Breakpoints](../features/breakpoints.md).

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

1. **Use VPN** for secure access
2. **Implement authentication** on all services
3. **Use HTTPS** for all external connections
4. **Audit access logs** regularly

### Network Configuration Checklist

| Requirement | Implementation |
|-------------|----------------|
| Local-only binding | `--host 127.0.0.1` |
| Access logging | Review service logs |
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
cat .a5c/runs/<runId>/journal/*.json | jq .

# Filter for approval events (breakpoints resolve via EFFECT_RESOLVED)
jq 'select(.type=="EFFECT_RESOLVED")' .a5c/runs/*/journal/*.json
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
gpg --symmetric --cipher-algo AES256 .a5c/runs/sensitive-run/journal/000001.*.json
```

---

## Related Documentation

- [Breakpoints](../features/breakpoints.md) - Approval workflow and the Breakpoints Adapter ("proven" signed approvals)
- [GitHub Actions Setup](../../github-actions-setup-babysitter.md) - CI configuration, Triggers, and secret handling
- [Adapters CLI Reference](./adapters-cli.md) - The host-side `adapters` CLI and its auth commands
- [Configuration Reference](./configuration.md) - Environment variables and settings
- [CLI Reference](./cli-reference.md) - Command-line options
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions
- [Glossary](./glossary.md) - Term definitions

---

## Next steps

- **Next:** [Configuration](./configuration.md)
- **Related:** [Breakpoints](../features/breakpoints.md), [Troubleshooting](./troubleshooting.md)
