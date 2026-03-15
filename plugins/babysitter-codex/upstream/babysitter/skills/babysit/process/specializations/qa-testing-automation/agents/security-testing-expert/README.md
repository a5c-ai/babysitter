# Security Testing Expert Agent

## Overview

The `security-testing-expert` agent is a specialized AI agent embodying the expertise of a Senior Security Test Engineer. It provides deep knowledge for application security testing, vulnerability assessment, penetration testing automation, and compliance validation.

## Persona

| Attribute | Value |
|-----------|-------|
| **Role** | Senior Security Test Engineer |
| **Experience** | 7+ years application security |
| **Certifications** | OSCP, CEH equivalent |
| **Background** | Penetration testing, security automation |

## Expertise Areas

| Area | Capabilities |
|------|--------------|
| **OWASP Top 10** | Comprehensive vulnerability testing |
| **SAST/DAST** | Static and dynamic security analysis |
| **Penetration Testing** | Automated security testing |
| **Dependency Scanning** | Vulnerable component detection |
| **Compliance** | PCI DSS, HIPAA, SOC 2 testing |
| **Threat Modeling** | Risk assessment and mitigation |

## Usage

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(securityExpertTask, {
  agentName: 'security-testing-expert',
  prompt: {
    role: 'Senior Security Test Engineer',
    task: 'Perform security assessment of authentication system',
    context: {
      target: 'https://app.example.com',
      scope: ['authentication', 'session-management'],
      compliance: ['OWASP', 'PCI-DSS']
    },
    instructions: [
      'Test for OWASP Top 10 vulnerabilities',
      'Verify authentication security controls',
      'Check session management implementation',
      'Provide remediation recommendations'
    ],
    outputFormat: 'JSON'
  }
});
```

### Direct Invocation

```bash
# Security assessment
/agent security-testing-expert assess \
  --target https://app.example.com \
  --scope authentication,api \
  --compliance owasp

# Vulnerability analysis
/agent security-testing-expert analyze-vulnerability \
  --type sql-injection \
  --endpoint /api/search

# Compliance check
/agent security-testing-expert compliance-check \
  --standard pci-dss \
  --requirements 6.5,6.6
```

## Common Tasks

### 1. Security Assessment

Comprehensive security evaluation:

```bash
/agent security-testing-expert full-assessment \
  --target https://app.example.com \
  --include owasp-top-10,headers,authentication \
  --output-format report
```

Output includes:
- Vulnerability findings with severity
- CVSS scores and OWASP mapping
- Remediation recommendations
- Compliance status

### 2. Vulnerability Testing

Focused vulnerability testing:

```bash
/agent security-testing-expert test-vulnerability \
  --type injection \
  --endpoints /api/users,/api/search \
  --payloads standard
```

### 3. Compliance Validation

Regulatory compliance testing:

```bash
/agent security-testing-expert compliance-test \
  --standard pci-dss \
  --scope authentication,data-protection \
  --generate-report
```

### 4. Threat Modeling

Risk assessment and threat analysis:

```bash
/agent security-testing-expert threat-model \
  --system authentication-service \
  --methodology stride \
  --assets credentials,sessions
```

## Process Integration

### Processes Using This Agent

| Process | Agent Role |
|---------|------------|
| `security-testing.js` | All security testing phases |
| `api-testing.js` | API security validation |
| `quality-gates.js` | Security gate enforcement |
| `continuous-testing.js` | CI/CD security integration |

### Task Definition Example

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const securityAssessmentTask = defineTask({
  name: 'security-assessment',
  description: 'Run security assessment with expert agent',

  async run(inputs, taskCtx) {
    return {
      kind: 'agent',
      title: 'Security Assessment',
      agent: {
        name: 'security-testing-expert',
        prompt: {
          role: 'Senior Security Test Engineer',
          task: 'Perform comprehensive security assessment',
          context: {
            target: inputs.target,
            scope: inputs.scope,
            compliance: inputs.compliance || ['OWASP']
          },
          instructions: [
            'Test for OWASP Top 10 vulnerabilities',
            'Check security headers',
            'Verify authentication controls',
            'Assess data protection',
            'Provide prioritized remediation plan'
          ],
          outputFormat: 'JSON'
        },
        outputSchema: {
          type: 'object',
          required: ['findings', 'summary', 'recommendations'],
          properties: {
            findings: { type: 'array' },
            summary: { type: 'object' },
            recommendations: { type: 'array' }
          }
        }
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
      }
    };
  }
});
```

## OWASP Top 10 Coverage

| Category | Testing Approach |
|----------|-----------------|
| **A01: Broken Access Control** | IDOR, privilege escalation, CORS |
| **A02: Cryptographic Failures** | TLS config, data encryption, key management |
| **A03: Injection** | SQLi, XSS, command injection |
| **A04: Insecure Design** | Business logic, authentication flows |
| **A05: Security Misconfiguration** | Headers, default creds, error handling |
| **A06: Vulnerable Components** | Dependency scanning, CVE detection |
| **A07: Auth Failures** | Password policy, session management |
| **A08: Integrity Failures** | CI/CD security, code signing |
| **A09: Logging Failures** | Audit logs, monitoring |
| **A10: SSRF** | Internal access, cloud metadata |

## Severity Classification

| Severity | CVSS Range | Examples | Response |
|----------|------------|----------|----------|
| **Critical** | 9.0-10.0 | RCE, Auth bypass | Immediate fix |
| **High** | 7.0-8.9 | SQLi, XSS stored | Fix before release |
| **Medium** | 4.0-6.9 | CSRF, info disclosure | Plan fix |
| **Low** | 0.1-3.9 | Missing headers | Backlog |
| **Info** | 0.0 | Best practices | Consider |

## Interaction Guidelines

### What to Expect

- **Comprehensive analysis** with evidence
- **Prioritized findings** by risk
- **Actionable remediation** steps
- **Compliance mapping** where applicable
- **Reference documentation** links

### Best Practices

1. Define clear scope and rules of engagement
2. Provide authentication credentials if needed
3. Specify compliance requirements
4. Include previous security findings
5. Mention known sensitive areas

## Related Resources

- [owasp-zap-security skill](../skills/owasp-zap-security/) - ZAP integration
- [api-testing skill](../skills/api-testing/) - API security testing
- [test-environment-expert agent](../agents/test-environment-expert/) - Isolated test environments

## References

- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [CVSS Calculator](https://www.first.org/cvss/calculator/3.1)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** AG-005
**Category:** Security Testing
**Status:** Active
