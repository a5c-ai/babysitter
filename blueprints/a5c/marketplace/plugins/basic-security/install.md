# Basic Security — Install Instructions

This plugin copies selected security processes, skills, agents, and commands from the babysitter security-compliance library into your project's `.a5c` directory. It also sets up security-focused lint rules and git hooks for secrets detection and secure coding enforcement. After installation, it runs an initial security scan to provide immediate value.

---

## Step 1: Interview the User

Ask the user which security categories they want to install. They may select one or more categories, or choose "8" for all. Present the following menu:

> **Which security categories would you like to install?** (enter numbers separated by commas, or "8" for all)
>
> 1. **Core DevSecOps** (recommended for all projects)
> 2. **Incident Response**
> 3. **Compliance**
> 4. **Infrastructure Security**
> 5. **Advanced Testing**
> 6. **Governance**
> 7. **Security Lint Rules & Git Hooks** (recommended for all projects)
> 8. **All** — install everything

### Category Contents

**1. Core DevSecOps** (recommended for all projects):
- Processes: `codebase-security-audit.js`, `secrets-management.js`, `sast-pipeline.js`, `sca-dependency-management.js`, `vulnerability-management.js`
- Skills: `owasp-security-scanner`, `sast-analyzer`, `secret-detection-scanner`, `dependency-scanner`
- Agents: `secure-code-reviewer-agent`, `vulnerability-triage-agent`

**2. Incident Response**:
- Processes: `incident-response.js`
- Agents: `incident-triage-agent`, `forensic-analysis-agent`

**3. Compliance**:
- Processes: `gdpr-compliance.js`, `hipaa-compliance.js`, `pci-dss-compliance.js`, `soc2-compliance.js`, `iso27001-implementation.js`
- Skills: `gdpr-compliance-automator`, `hipaa-compliance-automator`, `pci-dss-compliance-automator`, `soc2-compliance-automator`, `compliance-evidence-collector`

**4. Infrastructure Security**:
- Processes: `container-security.js`, `iac-security-review.js`, `iam-access-control.js`, `encryption-standards.js`
- Skills: `container-security-scanner`, `iac-security-scanner`, `crypto-analyzer`
- Agents: `security-architecture-reviewer-agent`

**5. Advanced Testing**:
- Processes: `penetration-testing.js`, `dast-process.js`, `stride-threat-modeling.js`
- Skills: `dast-scanner`
- Agents: `threat-modeling-agent`

**6. Governance**:
- Processes: `security-policies.js`, `security-training.js`, `data-classification.js`, `third-party-risk.js`, `business-continuity.js`, `disaster-recovery-testing.js`
- Skills: `vendor-risk-monitor`, `vendor-security-questionnaire`, `secure-coding-training-skill`
- Agents: `security-requirements-agent`, `risk-scoring-agent`, `patch-management-agent`, `threat-intelligence-agent`

**7. Security Lint Rules & Git Hooks** (recommended for all projects):
- Security-focused ESLint rules (no-eval, no-implied-eval, no-new-func, etc.)
- ESLint security plugins (`eslint-plugin-security`, `eslint-plugin-no-secrets`)
- Pre-commit hook for secrets detection (gitleaks or trufflehog)
- Pre-commit hook for security lint checks
- `.gitignore` additions for sensitive files

**8. All** — installs every process, skill, agent, lint rule, and hook from all categories above.

Record the user's selections. If they select "8" or "All", treat it as selecting categories 1 through 7.

---

## Step 2: Copy Process Files

For each selected category, copy the corresponding process `.js` files from the babysitter security-compliance library into the project.

**Source directory:** `plugins/babysitter/skills/babysit/process/specializations/security-compliance/`
**Target directory:** `.a5c/processes/security/`

First, create the target directory:

```bash
mkdir -p .a5c/processes/security/
```

Then copy each process file for the selected categories. For example, if the user selected Core DevSecOps (category 1):

```bash
cp plugins/babysitter/skills/babysit/process/specializations/security-compliance/codebase-security-audit.js .a5c/processes/security/codebase-security-audit.js
cp plugins/babysitter/skills/babysit/process/specializations/security-compliance/secrets-management.js .a5c/processes/security/secrets-management.js
cp plugins/babysitter/skills/babysit/process/specializations/security-compliance/sast-pipeline.js .a5c/processes/security/sast-pipeline.js
cp plugins/babysitter/skills/babysit/process/specializations/security-compliance/sca-dependency-management.js .a5c/processes/security/sca-dependency-management.js
cp plugins/babysitter/skills/babysit/process/specializations/security-compliance/vulnerability-management.js .a5c/processes/security/vulnerability-management.js
```

Repeat for each selected category using the process file lists in Step 1.

### Full Process-to-Category Mapping

| Category | Process Files |
|----------|--------------|
| Core DevSecOps | `codebase-security-audit.js`, `secrets-management.js`, `sast-pipeline.js`, `sca-dependency-management.js`, `vulnerability-management.js` |
| Incident Response | `incident-response.js` |
| Compliance | `gdpr-compliance.js`, `hipaa-compliance.js`, `pci-dss-compliance.js`, `soc2-compliance.js`, `iso27001-implementation.js` |
| Infrastructure Security | `container-security.js`, `iac-security-review.js`, `iam-access-control.js`, `encryption-standards.js` |
| Advanced Testing | `penetration-testing.js`, `dast-process.js`, `stride-threat-modeling.js` |
| Governance | `security-policies.js`, `security-training.js`, `data-classification.js`, `third-party-risk.js`, `business-continuity.js`, `disaster-recovery-testing.js` |

---

## Step 3: Copy Skills

For each selected category, copy the skill directories from the library into the project.

**Source directory:** `plugins/babysitter/skills/babysit/process/specializations/security-compliance/skills/`
**Target directory:** `.a5c/skills/security/`

For each skill in the selected categories, create the target directory and copy the `SKILL.md` file:

```bash
mkdir -p .a5c/skills/security/<skill-name>/
cp plugins/babysitter/skills/babysit/process/specializations/security-compliance/skills/<skill-name>/SKILL.md .a5c/skills/security/<skill-name>/SKILL.md
```

### Full Skill-to-Category Mapping

| Category | Skills |
|----------|--------|
| Core DevSecOps | `owasp-security-scanner`, `sast-analyzer`, `secret-detection-scanner`, `dependency-scanner` |
| Incident Response | *(none)* |
| Compliance | `gdpr-compliance-automator`, `hipaa-compliance-automator`, `pci-dss-compliance-automator`, `soc2-compliance-automator`, `compliance-evidence-collector` |
| Infrastructure Security | `container-security-scanner`, `iac-security-scanner`, `crypto-analyzer` |
| Advanced Testing | `dast-scanner` |
| Governance | `vendor-risk-monitor`, `vendor-security-questionnaire`, `secure-coding-training-skill` |

For example, if the user selected Core DevSecOps (category 1):

```bash
mkdir -p .a5c/skills/security/owasp-security-scanner/
cp plugins/babysitter/skills/babysit/process/specializations/security-compliance/skills/owasp-security-scanner/SKILL.md .a5c/skills/security/owasp-security-scanner/SKILL.md

mkdir -p .a5c/skills/security/sast-analyzer/
cp plugins/babysitter/skills/babysit/process/specializations/security-compliance/skills/sast-analyzer/SKILL.md .a5c/skills/security/sast-analyzer/SKILL.md

mkdir -p .a5c/skills/security/secret-detection-scanner/
cp plugins/babysitter/skills/babysit/process/specializations/security-compliance/skills/secret-detection-scanner/SKILL.md .a5c/skills/security/secret-detection-scanner/SKILL.md

mkdir -p .a5c/skills/security/dependency-scanner/
cp plugins/babysitter/skills/babysit/process/specializations/security-compliance/skills/dependency-scanner/SKILL.md .a5c/skills/security/dependency-scanner/SKILL.md
```

---

## Step 4: Copy Agents

For each selected category, copy the agent directories from the library into the project.

**Source directory:** `plugins/babysitter/skills/babysit/process/specializations/security-compliance/agents/`
**Target directory:** `.a5c/agents/security/`

For each agent in the selected categories, create the target directory and copy the `AGENT.md` file:

```bash
mkdir -p .a5c/agents/security/<agent-name>/
cp plugins/babysitter/skills/babysit/process/specializations/security-compliance/agents/<agent-name>/AGENT.md .a5c/agents/security/<agent-name>/AGENT.md
```

### Full Agent-to-Category Mapping

| Category | Agents |
|----------|--------|
| Core DevSecOps | `secure-code-reviewer-agent`, `vulnerability-triage-agent` |
| Incident Response | `incident-triage-agent`, `forensic-analysis-agent` |
| Compliance | *(none)* |
| Infrastructure Security | `security-architecture-reviewer-agent` |
| Advanced Testing | `threat-modeling-agent` |
| Governance | `security-requirements-agent`, `risk-scoring-agent`, `patch-management-agent`, `threat-intelligence-agent` |

For example, if the user selected Core DevSecOps (category 1):

```bash
mkdir -p .a5c/agents/security/secure-code-reviewer-agent/
cp plugins/babysitter/skills/babysit/process/specializations/security-compliance/agents/secure-code-reviewer-agent/AGENT.md .a5c/agents/security/secure-code-reviewer-agent/AGENT.md

mkdir -p .a5c/agents/security/vulnerability-triage-agent/
cp plugins/babysitter/skills/babysit/process/specializations/security-compliance/agents/vulnerability-triage-agent/AGENT.md .a5c/agents/security/vulnerability-triage-agent/AGENT.md
```

---

## Step 5: Set Up Security Lint Rules (Category 7)

If the user selected category 7 (Security Lint Rules & Git Hooks) or "All":

### Detect the project language and existing linter

Check for `package.json` (JS/TS), `requirements.txt`/`pyproject.toml` (Python), `go.mod` (Go), etc.

### TypeScript/JavaScript — ESLint Security Rules

#### Install security ESLint plugins:

```bash
npm install -D eslint-plugin-security eslint-plugin-no-secrets
```

#### Add security rules to the ESLint config:

If the project uses flat config (`eslint.config.mjs`), add a security block:

```javascript
import security from 'eslint-plugin-security';
import noSecrets from 'eslint-plugin-no-secrets';

// Add to the config array:
{
  plugins: { security, 'no-secrets': noSecrets },
  rules: {
    // Prevent dangerous code patterns
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',

    // Security plugin rules
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'warn',
    'security/detect-eval-with-expression': 'error',
    'security/detect-new-buffer': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-non-literal-fs-filename': 'warn',
    'security/detect-non-literal-regexp': 'warn',
    'security/detect-non-literal-require': 'warn',
    'security/detect-object-injection': 'warn',
    'security/detect-possible-timing-attacks': 'warn',
    'security/detect-pseudoRandomBytes': 'error',
    'security/detect-unsafe-regex': 'error',

    // Secrets detection in code
    'no-secrets/no-secrets': ['error', { tolerance: 4.5 }],
  },
}
```

If the project uses legacy config (`.eslintrc.*`), add to the `plugins` array and `rules` object accordingly.

#### For React/Next.js projects, also add:

```javascript
rules: {
  // Prevent XSS
  'react/no-danger': 'error',
  'react/no-danger-with-children': 'error',
}
```

#### For Express/Node.js API projects, also add:

```bash
npm install -D eslint-plugin-no-unsanitized
```

```javascript
import noUnsanitized from 'eslint-plugin-no-unsanitized';

// Rules:
'no-unsanitized/method': 'error',
'no-unsanitized/property': 'error',
```

### Python — Security Lint Rules

#### With ruff (recommended):

Add security-related rule sets to `ruff.toml` or `pyproject.toml`:

```toml
[lint]
select = [
  "E", "F", "W",   # Standard
  "S",              # flake8-bandit (security)
  "B",              # flake8-bugbear
  "A",              # flake8-builtins
  "INP",            # flake8-no-pep420 (implicit namespace packages)
  "T20",            # flake8-print (no print in production)
  "PIE",            # flake8-pie
  "PT",             # flake8-pytest-style
  "SIM",            # flake8-simplify
  "PTH",            # flake8-use-pathlib
]

[lint.per-file-ignores]
"tests/**" = ["S101", "S106"]  # Allow assert and hardcoded passwords in tests
```

Key `S` (bandit) rules this enables:
- `S101` — assert used (not in tests)
- `S104` — binding to all interfaces
- `S105`/`S106`/`S107` — hardcoded passwords/secrets
- `S108` — insecure temp file usage
- `S110` — try/except/pass (silenced errors)
- `S301`/`S302` — pickle usage (deserialization attacks)
- `S303`/`S304`/`S305` — insecure hash/cipher/mode
- `S501` — requests with `verify=False`
- `S602`/`S603`/`S604`/`S605`/`S606`/`S607` — subprocess and shell injection

#### With bandit standalone:

```bash
pip install bandit
bandit -r src/ -ll  # Low severity and above
```

### Go — Security Lint Rules

Add security linters to `.golangci.yml`:

```yaml
linters:
  enable:
    - gosec         # Security scanner
    - bodyclose     # HTTP response body close checker
    - sqlclosecheck # SQL rows/stmt close checker
    - exportloopref # Loop variable capture
    - noctx         # HTTP requests without context
```

---

## Step 6: Set Up Security Git Hooks (Category 7)

If the user selected category 7 or "All":

### Install a Secrets Scanner

Recommend **gitleaks** (fast, supports all languages) as the pre-commit secrets scanner:

```bash
# macOS
brew install gitleaks

# Windows (via scoop or winget)
scoop install gitleaks
# or: winget install zricethezav.gitleaks

# Linux
# Download from https://github.com/gitleaks/gitleaks/releases
# or via package manager
sudo apt install gitleaks  # if available
```

Verify installation:
```bash
gitleaks version
```

Create a gitleaks config at `.gitleaks.toml` (optional, for customizing rules):

```toml
[allowlist]
description = "Allow test fixtures and examples"
paths = [
  '''test/fixtures/.*''',
  '''__tests__/.*''',
  '''.*\.test\..*''',
  '''.*\.spec\..*''',
]
```

### TypeScript/JavaScript (husky)

If husky is not already installed (e.g., testing-suite plugin wasn't installed):

```bash
npm install -D husky lint-staged
npx husky init
```

#### Create pre-commit hook (`.husky/pre-commit`):

```bash
# Security: scan staged files for secrets
gitleaks protect --staged --verbose

# Security: run security lint rules on staged files
npx lint-staged
```

#### Configure lint-staged for security linting in `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix --max-warnings=0"
    ]
  }
}
```

If the testing-suite plugin is also installed and already has lint-staged config, merge the entries — don't overwrite.

#### Create pre-push hook (`.husky/pre-push`):

```bash
# Security: full secrets scan of the repo
gitleaks detect --verbose

# Security: run dependency audit
npm audit --audit-level=high
```

### Python (pre-commit framework)

If pre-commit is not already installed:

```bash
pip install pre-commit
```

Add security hooks to `.pre-commit-config.yaml` (create if not present, or merge into existing):

```yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.21.2
    hooks:
      - id: gitleaks
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.8.0
    hooks:
      - id: ruff
        args: [--select, S, --fix]  # Security rules only
  - repo: https://github.com/PyCQA/bandit
    rev: 1.8.0
    hooks:
      - id: bandit
        args: [-ll, -r, src/]
  - repo: local
    hooks:
      - id: pip-audit
        name: pip-audit
        entry: pip-audit
        language: system
        pass_filenames: false
        stages: [pre-push]
```

Install the hooks:
```bash
pre-commit install
pre-commit install --hook-type pre-push
```

### Go

Add to `lefthook.yml` (create if not present, or merge):

```yaml
pre-commit:
  commands:
    gitleaks:
      run: gitleaks protect --staged --verbose
    gosec:
      glob: "*.go"
      run: golangci-lint run --enable gosec
pre-push:
  commands:
    gitleaks-full:
      run: gitleaks detect --verbose
    govulncheck:
      run: govulncheck ./...
```

Install go vulnerability checker:
```bash
go install golang.org/x/vuln/cmd/govulncheck@latest
```

### Update .gitignore

Add sensitive file patterns to `.gitignore` (append, don't overwrite):

```gitignore
# Security — sensitive files that should never be committed
.env
.env.*
!.env.example
*.pem
*.key
*.p12
*.pfx
*.jks
*.keystore
credentials.json
service-account*.json
**/secrets/**
!**/secrets/.gitkeep
```

Check if any of these files are already tracked and warn the user:

```bash
git ls-files --cached | grep -E '\.(pem|key|p12|pfx)$|\.env$|credentials\.json|service-account' || echo "No sensitive files tracked"
```

If any are found, advise the user to remove them from tracking:
```bash
git rm --cached <file>
```

---

## Step 7: Create Security Commands

Create the file `.a5c/commands/security-commands.md` with slash commands corresponding to the installed processes. Only include commands for the categories the user selected.

```bash
mkdir -p .a5c/commands/
```

Write the following content to `.a5c/commands/security-commands.md`, including only sections for installed categories:

```markdown
# Security Commands

These commands are provided by the basic-security plugin. Each command runs the corresponding security process from `.a5c/processes/security/`.

---

## Core DevSecOps

### /security-audit
Run a comprehensive security audit of the codebase. Analyzes source code for vulnerabilities, misconfigurations, and security anti-patterns.
- Process: `.a5c/processes/security/codebase-security-audit.js`
- Usage: `/security-audit`

### /secrets-scan
Scan the codebase for hardcoded secrets, API keys, tokens, and credentials. Identifies secrets in code, configuration files, and environment files.
- Process: `.a5c/processes/security/secrets-management.js`
- Usage: `/secrets-scan`

### /sast-scan
Run Static Application Security Testing (SAST) on the codebase. Performs deep code analysis to find security flaws without executing the application.
- Process: `.a5c/processes/security/sast-pipeline.js`
- Usage: `/sast-scan`

### /dependency-scan
Scan project dependencies for known vulnerabilities using Software Composition Analysis (SCA). Checks all package manifests and lock files.
- Process: `.a5c/processes/security/sca-dependency-management.js`
- Usage: `/dependency-scan`

### /vuln-scan
Run a vulnerability management assessment. Identifies, classifies, and prioritizes vulnerabilities across the project.
- Process: `.a5c/processes/security/vulnerability-management.js`
- Usage: `/vuln-scan`

---

## Incident Response

### /incident-response
Initiate or simulate an incident response workflow. Guides through detection, containment, eradication, and recovery phases.
- Process: `.a5c/processes/security/incident-response.js`
- Usage: `/incident-response`

---

## Compliance

### /compliance-check
Run a general compliance assessment. Specify the framework as an argument.
- Supported frameworks: GDPR, HIPAA, PCI-DSS, SOC2, ISO27001
- Usage: `/compliance-check [framework]`

### /gdpr-check
Assess GDPR compliance. Reviews data processing, consent mechanisms, data subject rights, and cross-border transfers.
- Process: `.a5c/processes/security/gdpr-compliance.js`
- Usage: `/gdpr-check`

### /hipaa-check
Assess HIPAA compliance. Reviews PHI handling, access controls, audit trails, and administrative safeguards.
- Process: `.a5c/processes/security/hipaa-compliance.js`
- Usage: `/hipaa-check`

### /pci-dss-check
Assess PCI-DSS compliance. Reviews cardholder data handling, network security, and access controls.
- Process: `.a5c/processes/security/pci-dss-compliance.js`
- Usage: `/pci-dss-check`

### /soc2-check
Assess SOC2 compliance. Reviews trust service criteria: security, availability, processing integrity, confidentiality, and privacy.
- Process: `.a5c/processes/security/soc2-compliance.js`
- Usage: `/soc2-check`

### /iso27001-check
Assess ISO 27001 compliance. Reviews information security management system (ISMS) controls.
- Process: `.a5c/processes/security/iso27001-implementation.js`
- Usage: `/iso27001-check`

---

## Infrastructure Security

### /container-scan
Scan container images and Dockerfiles for vulnerabilities, misconfigurations, and best practice violations.
- Process: `.a5c/processes/security/container-security.js`
- Usage: `/container-scan`

### /iac-scan
Scan Infrastructure as Code (Terraform, CloudFormation, Kubernetes manifests) for security issues.
- Process: `.a5c/processes/security/iac-security-review.js`
- Usage: `/iac-scan`

### /iam-review
Review IAM policies, roles, and access controls for least-privilege violations and excessive permissions.
- Process: `.a5c/processes/security/iam-access-control.js`
- Usage: `/iam-review`

### /encryption-review
Review encryption standards, key management, and cryptographic implementations.
- Process: `.a5c/processes/security/encryption-standards.js`
- Usage: `/encryption-review`

---

## Advanced Testing

### /pentest
Run or plan a penetration testing exercise. Simulates real-world attack scenarios against the application.
- Process: `.a5c/processes/security/penetration-testing.js`
- Usage: `/pentest`

### /dast-scan
Run Dynamic Application Security Testing (DAST). Tests the running application for vulnerabilities by sending crafted requests.
- Process: `.a5c/processes/security/dast-process.js`
- Usage: `/dast-scan`

### /threat-model
Perform STRIDE threat modeling. Systematically identifies Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, and Elevation of Privilege threats.
- Process: `.a5c/processes/security/stride-threat-modeling.js`
- Usage: `/threat-model`

---

## Governance

### /security-policy
Review or generate security policies for the organization. Covers acceptable use, data handling, incident response, and more.
- Process: `.a5c/processes/security/security-policies.js`
- Usage: `/security-policy`

### /security-training
Initiate a secure coding training session. Covers common vulnerabilities, secure patterns, and language-specific guidance.
- Process: `.a5c/processes/security/security-training.js`
- Usage: `/security-training`

### /data-classification
Classify data assets by sensitivity level. Identifies PII, PHI, financial data, and proprietary information.
- Process: `.a5c/processes/security/data-classification.js`
- Usage: `/data-classification`

### /vendor-risk
Assess third-party vendor security risk. Reviews vendor security posture, data handling, and contractual obligations.
- Process: `.a5c/processes/security/third-party-risk.js`
- Usage: `/vendor-risk`

### /business-continuity
Review or create business continuity plans. Assesses recovery objectives, dependencies, and continuity strategies.
- Process: `.a5c/processes/security/business-continuity.js`
- Usage: `/business-continuity`

### /disaster-recovery-test
Plan or execute disaster recovery testing. Validates backup procedures, failover mechanisms, and recovery time objectives.
- Process: `.a5c/processes/security/disaster-recovery-testing.js`
- Usage: `/disaster-recovery-test`
```

Only include the sections that correspond to the categories the user selected in Step 1. If the user selected "All", include all sections.

---

## Step 8: Register Plugin

Register the basic-security plugin in the project-level plugin registry:

```bash
babysitter plugin:update-registry --plugin-name basic-security --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

Verify registration succeeded by checking the output. The JSON response should include the plugin entry with status information.

---

## Step 9: Run Initial Security Scan

After installation is complete, run an initial security scan to demonstrate the installed tools and provide immediate value to the user.

**If Core DevSecOps was installed (category 1 or 8):**

Run the codebase security audit process:

```bash
babysitter run:create --process-id security/codebase-security-audit --entry .a5c/processes/security/codebase-security-audit.js#process --prompt "Run initial security audit of the codebase" --json
```

After the run is created, iterate on it to completion:

```bash
babysitter run:iterate --run-id <runId> --json
```

Present the scan results to the user as a summary, highlighting:
- Total number of findings by severity (critical, high, medium, low, informational)
- Top 3 most important findings with brief descriptions
- Recommended next steps for remediation

**If Security Lint Rules & Git Hooks was installed (category 7 or 8):**

Run the lint security check and gitleaks scan:

```bash
# Run security lint rules
npm run lint 2>&1 | grep -i "security\|no-eval\|no-secrets" || echo "No security lint issues found"

# Run gitleaks on the repo
gitleaks detect --verbose 2>&1 | tail -5
```

**If neither Core DevSecOps nor Security Lint Rules was installed**, skip the initial scan and instead print a summary of what was installed.

---

## Post-Installation Summary

After all steps are complete, present the user with a summary:

```
Basic Security Plugin — Installation Complete

Installed categories: [list selected categories]
Processes:  [count] copied to .a5c/processes/security/
Skills:     [count] copied to .a5c/skills/security/
Agents:     [count] copied to .a5c/agents/security/
Commands:   See .a5c/commands/security-commands.md
Lint rules: [yes/no] security ESLint rules configured
Git hooks:  [yes/no] pre-commit secrets scan + security lint
.gitignore: [yes/no] sensitive file patterns added

Run /security-audit to scan your codebase at any time.
```
