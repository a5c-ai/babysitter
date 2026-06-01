# Basic Security — Configuration

This document covers how to customize the basic-security plugin after installation, including adding or removing individual components, configuring lint rules and git hooks, running specific scans, and scheduling periodic security assessments.

---

## 1. Adding Individual Security Processes Post-Install

To add a process that was not included during initial installation, copy it from the security-compliance library:

```bash
cp plugins/babysitter/skills/babysit/process/specializations/security-compliance/<process-name>.js .a5c/processes/security/<process-name>.js
```

### Available Processes

| Process File | Category | Description |
|-------------|----------|-------------|
| `codebase-security-audit.js` | Core DevSecOps | Comprehensive codebase security audit |
| `secrets-management.js` | Core DevSecOps | Secrets and credentials detection |
| `sast-pipeline.js` | Core DevSecOps | Static Application Security Testing |
| `sca-dependency-management.js` | Core DevSecOps | Software Composition Analysis for dependencies |
| `vulnerability-management.js` | Core DevSecOps | Vulnerability identification and prioritization |
| `incident-response.js` | Incident Response | Incident response workflow |
| `gdpr-compliance.js` | Compliance | GDPR compliance assessment |
| `hipaa-compliance.js` | Compliance | HIPAA compliance assessment |
| `pci-dss-compliance.js` | Compliance | PCI-DSS compliance assessment |
| `soc2-compliance.js` | Compliance | SOC2 compliance assessment |
| `iso27001-implementation.js` | Compliance | ISO 27001 ISMS assessment |
| `container-security.js` | Infrastructure | Container and Docker security scanning |
| `iac-security-review.js` | Infrastructure | Infrastructure as Code security review |
| `iam-access-control.js` | Infrastructure | IAM and access control review |
| `encryption-standards.js` | Infrastructure | Encryption and cryptography review |
| `penetration-testing.js` | Advanced Testing | Penetration testing planning and execution |
| `dast-process.js` | Advanced Testing | Dynamic Application Security Testing |
| `stride-threat-modeling.js` | Advanced Testing | STRIDE threat modeling |
| `security-policies.js` | Governance | Security policy generation and review |
| `security-training.js` | Governance | Secure coding training |
| `data-classification.js` | Governance | Data sensitivity classification |
| `third-party-risk.js` | Governance | Third-party vendor risk assessment |
| `business-continuity.js` | Governance | Business continuity planning |
| `disaster-recovery-testing.js` | Governance | Disaster recovery test planning |

### Removing Individual Processes

To remove a specific process without uninstalling the entire plugin:

```bash
rm .a5c/processes/security/<process-name>.js
```

After removing a process, also remove the corresponding slash command from `.a5c/commands/security-commands.md` by editing the file and deleting the relevant command section.

---

## 2. Customizing Active Skills and Agents

### Adding a Skill

Copy a skill from the library:

```bash
mkdir -p .a5c/skills/security/<skill-name>/
cp plugins/babysitter/skills/babysit/process/specializations/security-compliance/skills/<skill-name>/SKILL.md .a5c/skills/security/<skill-name>/SKILL.md
```

### Available Skills

| Skill | Category |
|-------|----------|
| `owasp-security-scanner` | Core DevSecOps |
| `sast-analyzer` | Core DevSecOps |
| `secret-detection-scanner` | Core DevSecOps |
| `dependency-scanner` | Core DevSecOps |
| `gdpr-compliance-automator` | Compliance |
| `hipaa-compliance-automator` | Compliance |
| `pci-dss-compliance-automator` | Compliance |
| `soc2-compliance-automator` | Compliance |
| `compliance-evidence-collector` | Compliance |
| `container-security-scanner` | Infrastructure |
| `iac-security-scanner` | Infrastructure |
| `crypto-analyzer` | Infrastructure |
| `dast-scanner` | Advanced Testing |
| `vendor-risk-monitor` | Governance |
| `vendor-security-questionnaire` | Governance |
| `secure-coding-training-skill` | Governance |

### Removing a Skill

```bash
rm -rf .a5c/skills/security/<skill-name>/
```

### Adding an Agent

Copy an agent from the library:

```bash
mkdir -p .a5c/agents/security/<agent-name>/
cp plugins/babysitter/skills/babysit/process/specializations/security-compliance/agents/<agent-name>/AGENT.md .a5c/agents/security/<agent-name>/AGENT.md
```

### Available Agents

| Agent | Category |
|-------|----------|
| `secure-code-reviewer-agent` | Core DevSecOps |
| `vulnerability-triage-agent` | Core DevSecOps |
| `incident-triage-agent` | Incident Response |
| `forensic-analysis-agent` | Incident Response |
| `security-architecture-reviewer-agent` | Infrastructure |
| `threat-modeling-agent` | Advanced Testing |
| `security-requirements-agent` | Governance |
| `risk-scoring-agent` | Governance |
| `patch-management-agent` | Governance |
| `threat-intelligence-agent` | Governance |

### Removing an Agent

```bash
rm -rf .a5c/agents/security/<agent-name>/
```

---

## 3. Configuring Security Lint Rules

### Adjusting rule severity

Edit the ESLint config to change rules from `error` to `warn` or vice versa:

```javascript
// Less strict — warn instead of error for object injection detection
'security/detect-object-injection': 'off',  // too many false positives
'security/detect-non-literal-fs-filename': 'off',  // if you use safe wrappers

// Stricter — escalate warnings to errors
'security/detect-child-process': 'error',  // was 'warn'
'security/detect-non-literal-regexp': 'error',
```

### Adding security rules for specific frameworks

#### For SQL/database projects:

```bash
npm install -D eslint-plugin-sql
```

```javascript
rules: {
  'sql/no-unsafe-query': 'error',
}
```

#### For GraphQL projects:

```bash
npm install -D @graphql-eslint/eslint-plugin
```

#### For Terraform/IaC:

Install **tfsec** for Terraform security scanning:

```bash
brew install tfsec  # macOS
# or scoop install tfsec  # Windows
```

### Customizing secrets detection sensitivity

Adjust the `no-secrets` tolerance (lower = more sensitive, higher = fewer false positives):

```javascript
'no-secrets/no-secrets': ['error', {
  tolerance: 3.5,  // was 4.5 — more sensitive
  additionalRegexes: {
    'AWS Key': 'AKIA[0-9A-Z]{16}',
    'Slack Token': 'xox[baprs]-[0-9a-zA-Z-]+',
    'GitHub Token': 'gh[ps]_[A-Za-z0-9_]{36,}',
  }
}],
```

### Customizing gitleaks rules

Edit `.gitleaks.toml` to add custom patterns or allowlists:

```toml
# Allow specific files
[allowlist]
paths = [
  '''\.env\.example''',
  '''test/fixtures/.*''',
  '''docs/examples/.*''',
]

# Allow specific patterns (e.g., placeholder values)
regexes = [
  '''EXAMPLE_.*''',
  '''placeholder.*''',
  '''your-.*-here''',
]

# Add custom rules
[[rules]]
id = "custom-internal-token"
description = "Internal service token"
regex = '''INTERNAL_SVC_[A-Z0-9]{32}'''
tags = ["internal", "token"]
```

### Disabling security lint for specific files

Add file-level overrides to the ESLint config:

```javascript
{
  files: ['scripts/seed-db.js', 'tools/generate-keys.js'],
  rules: {
    'security/detect-non-literal-fs-filename': 'off',
    'security/detect-child-process': 'off',
  },
}
```

Or use inline comments for one-off suppressions:
```javascript
// eslint-disable-next-line security/detect-object-injection
const value = obj[userInput];
```

---

## 4. Configuring Security Git Hooks

### Adding more hooks

#### Add a commit-msg hook for security ticket references:

Create `.husky/commit-msg` (or add to existing):

```bash
# Require security ticket references for security-related changes
if git diff --cached --name-only | grep -qE '(auth|security|crypto|encrypt|password|secret|token)'; then
  if ! grep -qE '(SEC-[0-9]+|SECURITY|security)' "$1"; then
    echo "WARNING: Security-related changes detected. Consider adding a SEC-XXX ticket reference."
  fi
fi
```

#### Add pre-push dependency audit:

Append to `.husky/pre-push`:

```bash
# Check for critical/high severity vulnerabilities
npm audit --audit-level=critical
```

### Temporarily bypassing hooks

For one-off commits where you need to skip hooks (e.g., WIP commits):

```bash
git commit --no-verify -m "WIP: work in progress"
git push --no-verify
```

**Important**: Only bypass hooks for legitimate reasons. Never bypass to avoid fixing actual security issues.

### Adjusting gitleaks sensitivity

If gitleaks produces false positives, add allowlists to `.gitleaks.toml` (see section 3).

If gitleaks is too slow on large repos, limit to staged files only (already the default for pre-commit):

```bash
# In .husky/pre-commit — already scanning staged only
gitleaks protect --staged --verbose
```

---

## 5. Running Specific Processes via Babysitter CLI

Each installed security process can be executed directly using the babysitter CLI. The general pattern is:

```bash
babysitter run:create \
  --process-id security/<process-name> \
  --entry .a5c/processes/security/<process-name>.js#process \
  --prompt "<description of what to scan or assess>" \
  --json
```

Then iterate the run to completion:

```bash
babysitter run:iterate --run-id <runId> --json
```

### Common Examples

**Run a full codebase security audit:**
```bash
babysitter run:create --process-id security/codebase-security-audit --entry .a5c/processes/security/codebase-security-audit.js#process --prompt "Run a comprehensive security audit of the entire codebase" --json
```

**Scan for hardcoded secrets:**
```bash
babysitter run:create --process-id security/secrets-management --entry .a5c/processes/security/secrets-management.js#process --prompt "Scan all files for hardcoded secrets, API keys, and credentials" --json
```

**Run dependency vulnerability scan:**
```bash
babysitter run:create --process-id security/sca-dependency-management --entry .a5c/processes/security/sca-dependency-management.js#process --prompt "Scan all project dependencies for known CVEs" --json
```

**Run GDPR compliance check:**
```bash
babysitter run:create --process-id security/gdpr-compliance --entry .a5c/processes/security/gdpr-compliance.js#process --prompt "Assess GDPR compliance for data processing operations" --json
```

**Perform STRIDE threat modeling:**
```bash
babysitter run:create --process-id security/stride-threat-modeling --entry .a5c/processes/security/stride-threat-modeling.js#process --prompt "Perform STRIDE threat modeling on the authentication system" --json
```

### Checking Run Status

```bash
babysitter run:status --run-id <runId> --json
```

### Viewing Run Events

```bash
babysitter run:events --run-id <runId> --json
```

---

## 6. Available Slash Commands

After installation, the following slash commands are available depending on which categories were installed. All commands are defined in `.a5c/commands/security-commands.md`.

| Command | Category | Description |
|---------|----------|-------------|
| `/security-audit` | Core DevSecOps | Comprehensive codebase security audit |
| `/secrets-scan` | Core DevSecOps | Scan for hardcoded secrets and credentials |
| `/sast-scan` | Core DevSecOps | Static Application Security Testing |
| `/dependency-scan` | Core DevSecOps | Scan dependencies for known CVEs |
| `/vuln-scan` | Core DevSecOps | Vulnerability management assessment |
| `/incident-response` | Incident Response | Incident response workflow |
| `/compliance-check` | Compliance | General compliance check (specify framework) |
| `/gdpr-check` | Compliance | GDPR compliance assessment |
| `/hipaa-check` | Compliance | HIPAA compliance assessment |
| `/pci-dss-check` | Compliance | PCI-DSS compliance assessment |
| `/soc2-check` | Compliance | SOC2 compliance assessment |
| `/iso27001-check` | Compliance | ISO 27001 compliance assessment |
| `/container-scan` | Infrastructure | Container and Docker security scan |
| `/iac-scan` | Infrastructure | Infrastructure as Code security scan |
| `/iam-review` | Infrastructure | IAM and access control review |
| `/encryption-review` | Infrastructure | Encryption standards review |
| `/pentest` | Advanced Testing | Penetration testing |
| `/dast-scan` | Advanced Testing | Dynamic Application Security Testing |
| `/threat-model` | Advanced Testing | STRIDE threat modeling |
| `/security-policy` | Governance | Security policy review and generation |
| `/security-training` | Governance | Secure coding training session |
| `/data-classification` | Governance | Data sensitivity classification |
| `/vendor-risk` | Governance | Third-party vendor risk assessment |
| `/business-continuity` | Governance | Business continuity planning |
| `/disaster-recovery-test` | Governance | Disaster recovery test planning |

To add or remove slash commands, edit `.a5c/commands/security-commands.md` directly. Each command entry follows this format:

```markdown
### /command-name
Description of what the command does.
- Process: `.a5c/processes/security/<process-name>.js`
- Usage: `/command-name`
```

---

## 7. Scheduling Periodic Security Scans

The basic-security plugin does not include a built-in scheduler, but you can set up periodic scans using several approaches.

### Using Babysitter Hooks

Add a hook to run security scans at the start of each session. Create or edit `.a5c/hooks/on-session-start.js`:

```javascript
// Run a secrets scan at the start of each coding session
module.exports = async function onSessionStart(context) {
  console.log('[basic-security] Running periodic secrets scan...');
  // The scan will be triggered as part of session initialization
};
```

### Using CI/CD Integration

Add security scans to your CI/CD pipeline by invoking the babysitter CLI:

```yaml
# Example: GitHub Actions
security-scan:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: Install gitleaks
      run: |
        curl -sSfL https://github.com/gitleaks/gitleaks/releases/latest/download/gitleaks_$(uname -s)_$(uname -m).tar.gz | tar xz
        sudo mv gitleaks /usr/local/bin/
    - name: Secrets scan
      run: gitleaks detect --verbose
    - name: Security lint
      run: npm run lint 2>&1 | grep -c "security/" || true
    - name: Dependency audit
      run: npm audit --audit-level=high
    - name: Run security audit
      run: |
        npx babysitter run:create \
          --process-id security/codebase-security-audit \
          --entry .a5c/processes/security/codebase-security-audit.js#process \
          --prompt "Periodic security audit" \
          --json
```

### Using Cron or Task Scheduler

For local periodic scans, create a shell script and schedule it:

```bash
#!/bin/bash
# security-scan.sh — Run weekly security scans
cd /path/to/your/project

echo "=== Gitleaks secrets scan ==="
gitleaks detect --verbose

echo "=== Dependency audit ==="
npm audit --audit-level=high

echo "=== Running codebase security audit ==="
npx babysitter run:create \
  --process-id security/codebase-security-audit \
  --entry .a5c/processes/security/codebase-security-audit.js#process \
  --prompt "Weekly automated security audit" \
  --json
```

Schedule with cron (Linux/macOS) or Task Scheduler (Windows):

```bash
# Run every Monday at 9 AM
0 9 * * 1 /path/to/security-scan.sh >> /var/log/security-scan.log 2>&1
```

### Recommended Scan Cadence

| Scan Type | Recommended Frequency | Rationale |
|-----------|----------------------|-----------|
| Secrets scan (gitleaks) | Every commit (pre-commit hook) | Prevents secrets from entering version control |
| Security lint rules | Every commit (pre-commit hook) | Catches insecure patterns as they're written |
| Dependency audit | Every push (pre-push hook) + weekly | New CVEs are published continuously |
| SAST scan | Every PR or weekly | Catches code-level vulnerabilities early |
| Full security audit | Weekly or bi-weekly | Comprehensive review of security posture |
| Compliance checks | Monthly or quarterly | Regulatory compliance typically assessed periodically |
| Penetration testing | Quarterly | Simulates real-world attacks on evolving codebase |
| Threat modeling | Per-feature or quarterly | Architectural changes introduce new threat surfaces |

---

## 8. Updating the Plugin

When a new version of the basic-security plugin is available in the marketplace, update it:

```bash
babysitter plugin:update basic-security --marketplace-name marketplace --project --json
```

This will re-run the install instructions, allowing you to pick up new processes, skills, or agents that were added in the update. Existing customizations in `.a5c/commands/security-commands.md` may need to be manually merged.

To check the currently installed version:

```bash
babysitter plugin:list-installed --project --json
```
