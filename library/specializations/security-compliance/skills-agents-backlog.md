# Security, Compliance, and Risk Management - Skills and Agents Backlog

This document identifies specialized skills and agents (subagents) that would enhance the Security, Compliance, and Risk Management processes beyond general-purpose capabilities.

## Implementation Status

- [ ] = Not started
- [~] = In development
- [x] = Implemented

---

## 1. Security Testing Skills

### [ ] owasp-security-scanner
**Type**: Skill
**Purpose**: Automated OWASP Top 10 vulnerability detection and assessment
**Capabilities**:
- Run OWASP ZAP automated scans
- Detect injection vulnerabilities (SQL, XSS, LDAP, etc.)
- Identify broken authentication patterns
- Check for sensitive data exposure
- Analyze security misconfigurations
- Generate OWASP-compliant reports

**Integrations**: OWASP ZAP, Burp Suite Community, OWASP Dependency-Check
**Used By Processes**: DAST Process, Penetration Testing, Security Code Review

---

### [ ] sast-analyzer
**Type**: Skill
**Purpose**: Static Application Security Testing orchestration and analysis
**Capabilities**:
- Execute Semgrep security rules
- Run SonarQube security analysis
- Analyze Bandit (Python) security issues
- Execute ESLint security plugins
- Parse and prioritize findings
- Deduplicate across multiple tools
- Generate remediation guidance

**Integrations**: Semgrep, SonarQube, Bandit, ESLint, CodeQL, Checkmarx
**Used By Processes**: SAST Pipeline Integration, Secure SDLC, DevSecOps Pipeline

---

### [ ] dast-scanner
**Type**: Skill
**Purpose**: Dynamic Application Security Testing execution and management
**Capabilities**:
- Configure and execute OWASP ZAP scans
- Run Nuclei vulnerability templates
- Execute authenticated scanning
- Manage scan policies and scope
- Correlate findings with SAST results
- Generate vulnerability reports

**Integrations**: OWASP ZAP, Nuclei, Burp Suite, Nikto
**Used By Processes**: DAST Process, Penetration Testing, Vulnerability Management

---

### [ ] dependency-scanner
**Type**: Skill
**Purpose**: Software Composition Analysis and dependency vulnerability scanning
**Capabilities**:
- Scan npm, pip, maven, gradle dependencies
- Check CVE databases (NVD, OSV)
- Generate SBOM (CycloneDX, SPDX)
- Identify license compliance issues
- Track EPSS scores for prioritization
- Automate dependency updates via PRs

**Integrations**: Snyk, OWASP Dependency-Check, npm audit, pip-audit, Trivy
**Used By Processes**: SCA and Dependency Management, DevSecOps Pipeline, Vulnerability Management

---

### [ ] container-security-scanner
**Type**: Skill
**Purpose**: Container image and Kubernetes security scanning
**Capabilities**:
- Scan container images for CVEs
- Check Dockerfile best practices
- Run Kubernetes CIS benchmarks
- Detect secrets in images
- Verify image signatures
- Generate compliance reports

**Integrations**: Trivy, Grype, Syft, kube-bench, Falco, Anchore
**Used By Processes**: Container Security Scanning, DevSecOps Pipeline, IaC Security

---

### [ ] iac-security-scanner
**Type**: Skill
**Purpose**: Infrastructure as Code security scanning and policy enforcement
**Capabilities**:
- Scan Terraform configurations
- Analyze CloudFormation templates
- Check Kubernetes manifests
- Validate Pulumi code
- Enforce security policies
- Generate compliance mappings

**Integrations**: Checkov, tfsec, KICS, Terrascan, OPA/Rego
**Used By Processes**: IaC Security Scanning, Cloud Security Architecture, DevSecOps Pipeline

---

### [ ] secret-detection-scanner
**Type**: Skill
**Purpose**: Detect secrets, credentials, and sensitive data in code and configurations
**Capabilities**:
- Scan git history for secrets
- Detect API keys, tokens, passwords
- Check environment files
- Monitor CI/CD logs for exposure
- Generate remediation steps
- Track secret rotation status

**Integrations**: GitLeaks, TruffleHog, detect-secrets, git-secrets
**Used By Processes**: Secrets Management, SAST Pipeline, DevSecOps Pipeline

---

## 2. Compliance Automation Skills

### [ ] soc2-compliance-automator
**Type**: Skill
**Purpose**: SOC 2 Trust Services Criteria compliance automation
**Capabilities**:
- Map controls to TSC requirements
- Automate evidence collection
- Generate control matrices
- Track control effectiveness
- Prepare audit artifacts
- Monitor continuous compliance

**Integrations**: Vanta, Drata, Secureframe, custom scripts
**Used By Processes**: SOC 2 Compliance Audit Preparation, Continuous Compliance Monitoring

---

### [ ] gdpr-compliance-automator
**Type**: Skill
**Purpose**: GDPR compliance assessment and automation
**Capabilities**:
- Data mapping and inventory
- Consent management tracking
- Data Subject Access Request (DSAR) workflows
- Privacy Impact Assessment templates
- Breach notification tracking
- Cross-border transfer documentation

**Integrations**: OneTrust, TrustArc, BigID, custom GDPR tools
**Used By Processes**: GDPR Compliance Assessment, Privacy Impact Assessments

---

### [ ] hipaa-compliance-automator
**Type**: Skill
**Purpose**: HIPAA security and privacy compliance automation
**Capabilities**:
- ePHI inventory and tracking
- Administrative safeguards checklist
- Technical controls validation
- Physical security assessment
- BAA management
- Breach notification procedures

**Integrations**: Compliancy Group, HIPAA One, custom audit tools
**Used By Processes**: HIPAA Security and Privacy Compliance

---

### [ ] pci-dss-compliance-automator
**Type**: Skill
**Purpose**: PCI DSS compliance assessment and reporting
**Capabilities**:
- Cardholder data environment scoping
- SAQ questionnaire automation
- ASV scan orchestration
- Control validation
- Evidence collection
- Compliance reporting

**Integrations**: SecurityMetrics, Qualys, PCI Council tools
**Used By Processes**: PCI DSS Compliance Process

---

### [ ] compliance-evidence-collector
**Type**: Skill
**Purpose**: Automated evidence collection across compliance frameworks
**Capabilities**:
- Cloud configuration snapshots (AWS, Azure, GCP)
- Access control evidence gathering
- Log collection and verification
- Policy document versioning
- Screenshot automation
- Evidence chain of custody

**Integrations**: Cloud provider APIs, SIEM systems, IAM systems
**Used By Processes**: All compliance processes

---

## 3. Threat Modeling and Risk Assessment Agents

### [ ] threat-modeling-agent
**Type**: Agent (Subagent)
**Purpose**: AI-assisted threat identification and risk analysis
**Capabilities**:
- Generate data flow diagrams from code
- Identify STRIDE threats automatically
- Assess threat likelihood and impact
- Suggest security controls
- Prioritize threats by risk score
- Track threat mitigation status

**Context Requirements**: Architecture diagrams, deployment topology, data flows
**Used By Processes**: STRIDE Threat Modeling, Security Risk Assessment

---

### [ ] risk-scoring-agent
**Type**: Agent (Subagent)
**Purpose**: Intelligent risk scoring and prioritization
**Capabilities**:
- Calculate CVSS scores
- Integrate EPSS for exploit probability
- Factor business context into scoring
- Consider asset criticality
- Generate risk heat maps
- Recommend treatment strategies

**Context Requirements**: Vulnerability data, asset inventory, business context
**Used By Processes**: Vulnerability Management, Risk Assessment, Penetration Testing

---

### [ ] security-architecture-reviewer-agent
**Type**: Agent (Subagent)
**Purpose**: Security architecture analysis and recommendations
**Capabilities**:
- Review architecture diagrams
- Identify security gaps
- Suggest defense-in-depth controls
- Evaluate zero trust alignment
- Check compliance requirements
- Generate architecture recommendations

**Context Requirements**: System architecture, security requirements, compliance scope
**Used By Processes**: Cloud Security Architecture Review, Security Risk Assessment

---

## 4. Incident Response and SOC Agents

### [ ] incident-triage-agent
**Type**: Agent (Subagent)
**Purpose**: Automated incident triage and initial classification
**Capabilities**:
- Parse security alerts and logs
- Classify incident severity
- Identify affected systems
- Correlate related events
- Generate initial incident reports
- Recommend containment actions

**Context Requirements**: SIEM data, alert context, asset information
**Used By Processes**: Security Incident Response, SOC Workflow

---

### [ ] forensic-analysis-agent
**Type**: Agent (Subagent)
**Purpose**: Digital forensic analysis assistance
**Capabilities**:
- Analyze log files
- Timeline reconstruction
- Identify indicators of compromise (IoCs)
- Malware behavior analysis
- Evidence preservation guidance
- Generate forensic reports

**Context Requirements**: Forensic artifacts, system logs, network captures
**Used By Processes**: Security Incident Response, SOC Workflow

---

### [ ] threat-intelligence-agent
**Type**: Agent (Subagent)
**Purpose**: Threat intelligence integration and analysis
**Capabilities**:
- Query threat intelligence feeds
- Match IoCs against intel databases
- Identify threat actor TTPs
- Assess threat relevance
- Generate intelligence reports
- Track emerging threats

**Integrations**: MISP, VirusTotal, OTX, MITRE ATT&CK
**Used By Processes**: Incident Response, SOC Workflow, Threat Modeling

---

## 5. Vulnerability Management Agents

### [ ] vulnerability-triage-agent
**Type**: Agent (Subagent)
**Purpose**: Intelligent vulnerability triage and prioritization
**Capabilities**:
- Analyze vulnerability context
- Deduplicate findings across tools
- Assess exploitability
- Factor in compensating controls
- Generate triage recommendations
- Track SLA compliance

**Context Requirements**: Vulnerability scan results, asset data, threat context
**Used By Processes**: Vulnerability Management Lifecycle, SAST/DAST pipelines

---

### [ ] remediation-guidance-agent
**Type**: Agent (Subagent)
**Purpose**: Generate contextual remediation guidance
**Capabilities**:
- Analyze vulnerability root cause
- Generate fix recommendations
- Provide code examples
- Suggest configuration changes
- Estimate remediation effort
- Track remediation progress

**Context Requirements**: Vulnerability details, affected code/config, language/framework
**Used By Processes**: Vulnerability Management, SAST/DAST, SCA

---

### [ ] patch-management-agent
**Type**: Agent (Subagent)
**Purpose**: Intelligent patch planning and validation
**Capabilities**:
- Analyze patch applicability
- Assess patch risk
- Generate patch schedules
- Validate patch deployment
- Track patch compliance
- Rollback planning

**Context Requirements**: System inventory, vulnerability data, change windows
**Used By Processes**: Vulnerability Management, Security Operations

---

## 6. Code Security Agents

### [ ] secure-code-reviewer-agent
**Type**: Agent (Subagent)
**Purpose**: AI-assisted security-focused code review
**Capabilities**:
- Review authentication/authorization logic
- Identify insecure coding patterns
- Check cryptography implementation
- Analyze input validation
- Review error handling
- Generate secure code suggestions

**Context Requirements**: Source code, security requirements, coding standards
**Used By Processes**: Security Code Review, Secure SDLC

---

### [ ] security-requirements-agent
**Type**: Agent (Subagent)
**Purpose**: Security requirements analysis and derivation
**Capabilities**:
- Derive security requirements from business needs
- Map to compliance frameworks
- Generate security user stories
- Create abuse cases
- Validate requirement coverage
- Track requirement implementation

**Context Requirements**: Business requirements, compliance scope, threat model
**Used By Processes**: Secure SDLC, Threat Modeling, Risk Assessment

---

## 7. Cloud Security Skills

### [ ] aws-security-scanner
**Type**: Skill
**Purpose**: AWS security configuration scanning and hardening
**Capabilities**:
- Run Prowler security assessments
- Check IAM policies and roles
- Verify S3 bucket configurations
- Analyze security groups and NACLs
- Check encryption settings
- Validate CloudTrail logging

**Integrations**: Prowler, AWS Security Hub, AWS Config
**Used By Processes**: Cloud Security Architecture Review, Compliance Monitoring

---

### [ ] azure-security-scanner
**Type**: Skill
**Purpose**: Azure security configuration scanning and hardening
**Capabilities**:
- Run Azure Security Center assessments
- Check Azure AD configurations
- Analyze NSGs and firewall rules
- Verify Key Vault settings
- Check Azure Policy compliance
- Validate activity logging

**Integrations**: Azure Security Center, Azure Policy, ScoutSuite
**Used By Processes**: Cloud Security Architecture Review, Compliance Monitoring

---

### [ ] gcp-security-scanner
**Type**: Skill
**Purpose**: GCP security configuration scanning and hardening
**Capabilities**:
- Run GCP Security Command Center
- Check IAM policies and service accounts
- Analyze VPC firewall rules
- Verify Cloud KMS configurations
- Check audit logging
- Validate organization policies

**Integrations**: GCP Security Command Center, Forseti, ScoutSuite
**Used By Processes**: Cloud Security Architecture Review, Compliance Monitoring

---

### [ ] multi-cloud-security-posture
**Type**: Skill
**Purpose**: Unified cloud security posture management across providers
**Capabilities**:
- Aggregate findings across clouds
- Normalize security metrics
- Compare against CIS benchmarks
- Track remediation status
- Generate unified reports
- Alert on drift

**Integrations**: Cloud provider APIs, CSPM tools (Wiz, Orca, Prisma Cloud)
**Used By Processes**: Cloud Security Architecture, Continuous Compliance

---

## 8. Security Training and Awareness Skills

### [ ] phishing-simulation-skill
**Type**: Skill
**Purpose**: Phishing simulation campaign execution and analysis
**Capabilities**:
- Generate phishing templates
- Execute simulation campaigns
- Track user responses
- Generate awareness reports
- Identify high-risk users
- Recommend targeted training

**Integrations**: KnowBe4, Proofpoint, GoPhish
**Used By Processes**: Security Awareness Training Program

---

### [ ] secure-coding-training-skill
**Type**: Skill
**Purpose**: Developer security training and assessment
**Capabilities**:
- Deliver secure coding modules
- Track completion status
- Generate skill assessments
- Identify knowledge gaps
- Recommend training paths
- Issue certifications

**Integrations**: Secure Code Warrior, HackEDU, OWASP WebGoat
**Used By Processes**: Security Awareness Training, Secure SDLC

---

## 9. Cryptography and Key Management Skills

### [ ] crypto-analyzer
**Type**: Skill
**Purpose**: Cryptographic implementation analysis and validation
**Capabilities**:
- Analyze encryption implementations
- Check algorithm strength
- Verify key sizes
- Identify deprecated algorithms
- Check certificate validity
- Recommend cryptographic improvements

**Integrations**: OpenSSL, cryptographic libraries, certificate scanners
**Used By Processes**: Cryptography and Key Management, Security Code Review

---

### [ ] key-management-orchestrator
**Type**: Skill
**Purpose**: Key management lifecycle orchestration
**Capabilities**:
- Generate cryptographic keys
- Manage key rotation schedules
- Track key usage
- Orchestrate key destruction
- Integrate with HSMs
- Audit key operations

**Integrations**: HashiCorp Vault, AWS KMS, Azure Key Vault, GCP Cloud KMS
**Used By Processes**: Cryptography and Key Management, Secrets Management

---

## 10. Vendor Security Assessment Skills

### [ ] vendor-security-questionnaire
**Type**: Skill
**Purpose**: Automated vendor security assessment
**Capabilities**:
- Generate security questionnaires
- Parse questionnaire responses
- Score vendor security posture
- Track assessment status
- Generate risk reports
- Monitor vendor compliance

**Integrations**: OneTrust, ProcessUnity, SecurityScorecard
**Used By Processes**: Third-Party Vendor Security Assessment

---

### [ ] vendor-risk-monitor
**Type**: Skill
**Purpose**: Continuous vendor security monitoring
**Capabilities**:
- Monitor vendor security ratings
- Track breach notifications
- Check certificate status
- Monitor dark web for exposures
- Alert on risk changes
- Generate monitoring reports

**Integrations**: BitSight, SecurityScorecard, RiskRecon
**Used By Processes**: Third-Party Vendor Security Assessment, Continuous Compliance

---

## Skills and Agents Summary

### By Category

| Category | Skills | Agents | Total |
|----------|--------|--------|-------|
| Security Testing | 7 | 0 | 7 |
| Compliance Automation | 5 | 0 | 5 |
| Threat Modeling & Risk | 0 | 3 | 3 |
| Incident Response & SOC | 0 | 3 | 3 |
| Vulnerability Management | 0 | 3 | 3 |
| Code Security | 0 | 2 | 2 |
| Cloud Security | 4 | 0 | 4 |
| Security Training | 2 | 0 | 2 |
| Cryptography & Keys | 2 | 0 | 2 |
| Vendor Security | 2 | 0 | 2 |
| **Total** | **22** | **11** | **33** |

### Shared/Reusable Candidates

The following skills and agents have high reuse potential across multiple specializations:

1. **secret-detection-scanner** - Useful for DevOps, CI/CD, general development
2. **compliance-evidence-collector** - Applicable to any compliance framework
3. **threat-modeling-agent** - Valuable for architecture and design across domains
4. **secure-code-reviewer-agent** - Applicable to any software development
5. **aws-security-scanner** / **azure-security-scanner** / **gcp-security-scanner** - Useful for cloud-native development
6. **crypto-analyzer** - Valuable for any application handling sensitive data
7. **risk-scoring-agent** - Applicable to general risk management
8. **vendor-security-questionnaire** - Useful for procurement and vendor management

---

## Implementation Priority

### Phase 1: Core Security Testing (Highest Value)
1. sast-analyzer
2. dependency-scanner
3. owasp-security-scanner
4. vulnerability-triage-agent
5. secret-detection-scanner

### Phase 2: Compliance Automation
6. soc2-compliance-automator
7. compliance-evidence-collector
8. gdpr-compliance-automator
9. threat-modeling-agent
10. risk-scoring-agent

### Phase 3: Incident Response & Cloud
11. incident-triage-agent
12. aws-security-scanner
13. azure-security-scanner
14. container-security-scanner
15. iac-security-scanner

### Phase 4: Specialized Capabilities
16. forensic-analysis-agent
17. secure-code-reviewer-agent
18. remediation-guidance-agent
19. threat-intelligence-agent
20. All remaining skills and agents

---

## Integration Patterns

### Typical Process Enhancement Pattern

```javascript
// Before: Using general-purpose agent
agent: {
  name: 'general-purpose',
  prompt: { ... }
}

// After: Using specialized security agent
agent: {
  name: 'vulnerability-triage-agent',
  prompt: { ... }
}

// Or invoking a specialized skill
skill: {
  name: 'sast-analyzer',
  context: { ... }
}
```

### Skill Chaining Example

```javascript
// Chain multiple security skills for comprehensive scanning
const scanPipeline = async (ctx) => {
  const sastResults = await ctx.invokeSkill('sast-analyzer', { path: ctx.input.codePath });
  const scaResults = await ctx.invokeSkill('dependency-scanner', { manifest: ctx.input.manifest });
  const secretResults = await ctx.invokeSkill('secret-detection-scanner', { repo: ctx.input.repo });

  return await ctx.invokeAgent('vulnerability-triage-agent', {
    findings: [...sastResults, ...scaResults, ...secretResults]
  });
};
```

---

## Next Steps

1. Prioritize skills/agents based on process implementation status
2. Define detailed specifications for Phase 1 skills
3. Implement integration interfaces with security tools
4. Create test suites for skill validation
5. Document skill usage patterns
6. Build example configurations
7. Establish security tool prerequisites
