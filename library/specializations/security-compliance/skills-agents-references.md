# Security, Compliance, and Risk Management - Skills and Agents References

This document catalogs community-created Claude skills, agents, plugins, and MCP servers that align with the identified skills and agents in the backlog for the Security, Compliance, and Risk Management specialization.

## Reference Sources Searched

- [GitHub Topics: claude-skills](https://github.com/topics/claude-skills)
- [ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills)
- [Trail of Bits/skills](https://github.com/trailofbits/skills)
- [zscole/adversarial-spec](https://github.com/zscole/adversarial-spec)
- [ccplugins/awesome-claude-code-plugins](https://github.com/ccplugins/awesome-claude-code-plugins)
- [hesreallyhim/awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code)
- GitHub security tool repositories and MCP server ecosystem

---

## 1. Security Testing Skills

### SAST (Static Application Security Testing)

| Resource | URL | Mapping | Description |
|----------|-----|---------|-------------|
| **sast-mcp** | [Sengtocxoen/sast-mcp](https://github.com/Sengtocxoen/sast-mcp) | sast-analyzer | Comprehensive MCP server integrating 23+ security tools with Claude Code including Semgrep, Bandit, ESLint Security, Gosec, Brakeman, Graudit, Bearer |
| **Semgrep MCP** | [semgrep/mcp](https://github.com/semgrep/mcp) | sast-analyzer | Official Semgrep MCP server for scanning code with 5,000+ security rules |
| **Trail of Bits static-analysis** | [trailofbits/skills](https://github.com/trailofbits/skills) | sast-analyzer | Static analysis toolkit with CodeQL, Semgrep, and SARIF parsing |
| **Trail of Bits semgrep-rule-creator** | [trailofbits/skills](https://github.com/trailofbits/skills) | sast-analyzer | Create and refine Semgrep rules for custom vulnerability detection |
| **SecOpsAgentKit sast-semgrep** | [AgentSecOps/SecOpsAgentKit](https://github.com/AgentSecOps/SecOpsAgentKit) | sast-analyzer | Multi-language static analysis using Semgrep |
| **SecOpsAgentKit sast-bandit** | [AgentSecOps/SecOpsAgentKit](https://github.com/AgentSecOps/SecOpsAgentKit) | sast-analyzer | Python vulnerability detection with CWE and OWASP mappings |
| **SecOpsAgentKit sast-horusec** | [AgentSecOps/SecOpsAgentKit](https://github.com/AgentSecOps/SecOpsAgentKit) | sast-analyzer | Multi-language SAST supporting 18+ languages |
| **Claude Code Security Review** | [anthropics/claude-code-security-review](https://github.com/anthropics/claude-code-security-review) | sast-analyzer | Official Anthropic GitHub Action for AI-powered security review |

### DAST (Dynamic Application Security Testing)

| Resource | URL | Mapping | Description |
|----------|-----|---------|-------------|
| **ZAP-MCP** | [ajtazer/ZAP-MCP](https://github.com/ajtazer/ZAP-MCP) | dast-scanner, owasp-security-scanner | AI-powered integration between OWASP ZAP and Claude |
| **mcp-zap-server** | [dtkmn/mcp-zap-server](https://github.com/dtkmn/mcp-zap-server) | dast-scanner, owasp-security-scanner | Spring Boot MCP server exposing OWASP ZAP capabilities |
| **OWASP ZAP MCP Server** | [LisBerndt/zap](https://www.pulsemcp.com/servers/lisberndt-zap) | dast-scanner, owasp-security-scanner | MCP server for OWASP ZAP security scanning |
| **pentestMCP** | [ramkansal/pentestMCP](https://github.com/ramkansal/pentestMCP) | dast-scanner | MCP server with OWASP ZAP, Nuclei, SQLMap integration (20+ tools) |
| **SecOpsAgentKit dast-zap** | [AgentSecOps/SecOpsAgentKit](https://github.com/AgentSecOps/SecOpsAgentKit) | dast-scanner | Dynamic application security testing with OWASP ZAP |
| **SecOpsAgentKit dast-nuclei** | [AgentSecOps/SecOpsAgentKit](https://github.com/AgentSecOps/SecOpsAgentKit) | dast-scanner | Template-based vulnerability scanning with Nuclei |
| **SecOpsAgentKit dast-ffuf** | [AgentSecOps/SecOpsAgentKit](https://github.com/AgentSecOps/SecOpsAgentKit) | dast-scanner | Web parameter and directory discovery fuzzing |
| **HexStrike AI** | [0x4m4/hexstrike-ai](https://github.com/0x4m4/hexstrike-ai) | dast-scanner, owasp-security-scanner | 150+ cybersecurity tools including Burp Suite, ZAP, Wfuzz, Commix |

### Dependency/SCA Scanning

| Resource | URL | Mapping | Description |
|----------|-----|---------|-------------|
| **SecOpsAgentKit sca-trivy** | [AgentSecOps/SecOpsAgentKit](https://github.com/AgentSecOps/SecOpsAgentKit) | dependency-scanner | Software composition analysis with Trivy CVE detection |
| **SecOpsAgentKit sca-blackduck** | [AgentSecOps/SecOpsAgentKit](https://github.com/AgentSecOps/SecOpsAgentKit) | dependency-scanner | Dependency analysis and license compliance with Synopsys Black Duck |
| **SecOpsAgentKit sbom-syft** | [AgentSecOps/SecOpsAgentKit](https://github.com/AgentSecOps/SecOpsAgentKit) | dependency-scanner | Software Bill of Materials generation with Syft |
| **sast-mcp (npm audit, pip-audit)** | [Sengtocxoen/sast-mcp](https://github.com/Sengtocxoen/sast-mcp) | dependency-scanner | Includes npm audit, Safety, OWASP Dependency-Check, Snyk |

### Container Security

| Resource | URL | Mapping | Description |
|----------|-----|---------|-------------|
| **Trivy MCP** | [aquasecurity/trivy-mcp](https://github.com/aquasecurity/trivy-mcp) | container-security-scanner | Official Aqua Security MCP plugin for Trivy container scanning |
| **Grype MCP** | [GitHub Topics: grype](https://github.com/topics/grype) | container-security-scanner | MCP server for Anchore Grype vulnerability scanning |
| **SecOpsAgentKit container-grype** | [AgentSecOps/SecOpsAgentKit](https://github.com/AgentSecOps/SecOpsAgentKit) | container-security-scanner | Container image vulnerability scanning with CVSS/EPSS scoring |
| **SecOpsAgentKit container-hadolint** | [AgentSecOps/SecOpsAgentKit](https://github.com/AgentSecOps/SecOpsAgentKit) | container-security-scanner | Dockerfile security linting with Hadolint |
| **sast-mcp (Trivy)** | [Sengtocxoen/sast-mcp](https://github.com/Sengtocxoen/sast-mcp) | container-security-scanner | Trivy integration for container scanning |

### IaC Security

| Resource | URL | Mapping | Description |
|----------|-----|---------|-------------|
| **SecOpsAgentKit iac-checkov** | [AgentSecOps/SecOpsAgentKit](https://github.com/AgentSecOps/SecOpsAgentKit) | iac-security-scanner | Infrastructure-as-Code scanning with 750+ built-in policies |
| **sast-mcp (Checkov, tfsec)** | [Sengtocxoen/sast-mcp](https://github.com/Sengtocxoen/sast-mcp) | iac-security-scanner | Checkov and tfsec integration for Terraform/K8s scanning |
| **Terraform MCP Server** | [HashiCorp Terraform MCP](https://github.com/hashicorp/terraform-mcp-server) | iac-security-scanner | Official HashiCorp MCP server for Terraform workflows |

### Secrets Detection

| Resource | URL | Mapping | Description |
|----------|-----|---------|-------------|
| **SecOpsAgentKit secrets-gitleaks** | [AgentSecOps/SecOpsAgentKit](https://github.com/AgentSecOps/SecOpsAgentKit) | secret-detection-scanner | Hardcoded credential detection with Gitleaks |
| **sast-mcp (TruffleHog, Gitleaks)** | [Sengtocxoen/sast-mcp](https://github.com/Sengtocxoen/sast-mcp) | secret-detection-scanner | TruffleHog and Gitleaks integration for secret scanning |
| **Offensive-MCP-AI** | [CyberSecurityUP/Offensive-MCP-AI](https://github.com/cybersecurityup/offensive-mcp-ai) | secret-detection-scanner | CI/CD DevSecOps integration with TruffleHog, Gitleaks |

---

## 2. Compliance Automation Skills

### Multi-Framework Compliance

| Resource | URL | Mapping | Description |
|----------|-----|---------|-------------|
| **compliance-automation-specialist** | [ccplugins/awesome-claude-code-plugins](https://github.com/ccplugins/awesome-claude-code-plugins) | soc2-compliance-automator, compliance-evidence-collector | Automates compliance checking and verification processes |
| **SecOpsAgentKit policy-opa** | [AgentSecOps/SecOpsAgentKit](https://github.com/AgentSecOps/SecOpsAgentKit) | soc2-compliance-automator | Policy-as-code enforcement with Open Policy Agent |
| **GraphGRC** | [engseclabs/graphgrc](https://github.com/engseclabs/graphgrc) | soc2-compliance-automator, gdpr-compliance-automator | Connect compliance frameworks (SOC 2, GDPR, ISO 27001) using SCF mappings |
| **Prowler** | [prowler-cloud/prowler](https://github.com/prowler-cloud/prowler) | compliance-evidence-collector | Supports CIS, NIST, PCI-DSS, GDPR, HIPAA, SOC2, ISO 27001 |

### Privacy/GDPR

| Resource | URL | Mapping | Description |
|----------|-----|---------|-------------|
| **data-privacy-engineer** | [ccplugins/awesome-claude-code-plugins](https://github.com/ccplugins/awesome-claude-code-plugins) | gdpr-compliance-automator | Data privacy implementation and protection measures |
| **legal-compliance-checker** | [ccplugins/awesome-claude-code-plugins](https://github.com/ccplugins/awesome-claude-code-plugins) | gdpr-compliance-automator, hipaa-compliance-automator | Validates adherence to legal and regulatory standards |

### Enterprise Security Review

| Resource | URL | Mapping | Description |
|----------|-----|---------|-------------|
| **enterprise-security-reviewer** | [ccplugins/awesome-claude-code-plugins](https://github.com/ccplugins/awesome-claude-code-plugins) | soc2-compliance-automator | Comprehensive security evaluations for enterprise environments |
| **audit** | [ccplugins/awesome-claude-code-plugins](https://github.com/ccplugins/awesome-claude-code-plugins) | compliance-evidence-collector | Audit capabilities for code and system review |
| **ai-ethics-governance-specialist** | [ccplugins/awesome-claude-code-plugins](https://github.com/ccplugins/awesome-claude-code-plugins) | Multiple compliance processes | AI ethics and governance frameworks |

---

## 3. Threat Modeling and Risk Assessment Agents

| Resource | URL | Mapping | Description |
|----------|-----|---------|-------------|
| **STRIDE-GPT** | [mrwadams/stride-gpt](https://github.com/mrwadams/stride-gpt) | threat-modeling-agent | AI-powered STRIDE threat modeling with Claude 4.5 support, OWASP Top 10 for Agentic AI |
| **skill-threat-modeling** | [fr33d3m0n/skill-threat-modeling](https://github.com/fr33d3m0n/skill-threat-modeling) | threat-modeling-agent | 8-phase workflow with STRIDE+CWE+CAPEC+ATT&CK mapping |
| **SecOpsAgentKit pytm** | [AgentSecOps/SecOpsAgentKit](https://github.com/AgentSecOps/SecOpsAgentKit) | threat-modeling-agent | STRIDE threat analysis and data flow diagramming with pytm |
| **adversarial-spec** | [zscole/adversarial-spec](https://github.com/zscole/adversarial-spec) | threat-modeling-agent, security-architecture-reviewer-agent | Multi-LLM adversarial specification refinement with security focus mode |
| **SecureVibes** | [anshumanbh/securevibes](https://github.com/anshumanbh/securevibes) | threat-modeling-agent | Multi-agent architecture with STRIDE Threat Modeling Agent |
| **k8sthreatmodeling** | [accuknox/k8sthreatmodeling](https://github.com/accuknox/k8sthreatmodeling) | threat-modeling-agent | STRIDE-based threat modeling for Kubernetes systems |
| **Trail of Bits sharp-edges** | [trailofbits/skills](https://github.com/trailofbits/skills) | risk-scoring-agent | Identify error-prone APIs, dangerous configurations, footgun designs |

---

## 4. Incident Response and SOC Agents

| Resource | URL | Mapping | Description |
|----------|-----|---------|-------------|
| **SOC Automation Lab** | [chalithah/soc-automation-lab](https://github.com/chalithah/SOC-Automation-Lab) | incident-triage-agent, forensic-analysis-agent | End-to-end SOC pipeline with Claude MCP triage, SOAR (n8n), SIEM (Splunk), DFIR-IRIS |
| **Claude Plugins Binary Analysis** | [DeepBitsTechnology/claude-plugins](https://github.com/DeepBitsTechnology/claude-plugins) | forensic-analysis-agent | Binary analysis for incident response, malware investigation, IoC identification |
| **SecOpsAgentKit forensics-osquery** | [AgentSecOps/SecOpsAgentKit](https://github.com/AgentSecOps/SecOpsAgentKit) | forensic-analysis-agent | SQL-based endpoint forensics with osquery |
| **SecOpsAgentKit ir-velociraptor** | [AgentSecOps/SecOpsAgentKit](https://github.com/AgentSecOps/SecOpsAgentKit) | forensic-analysis-agent, incident-triage-agent | Enterprise incident response and forensics with Velociraptor |
| **SecOpsAgentKit detection-sigma** | [AgentSecOps/SecOpsAgentKit](https://github.com/AgentSecOps/SecOpsAgentKit) | incident-triage-agent, threat-intelligence-agent | Universal SIEM rule creation with Sigma format |
| **threat-hunting-with-sigma-rules** | [jthack/threat-hunting-with-sigma-rules-skill](https://github.com/jthack/threat-hunting-with-sigma-rules-skill) | threat-intelligence-agent | Use Sigma detection rules to hunt for threats |
| **computer-forensics** | [mhattingpete/claude-skills-marketplace](https://github.com/mhattingpete/claude-skills-marketplace/tree/main/computer-forensics-skills/skills/computer-forensics) | forensic-analysis-agent | Digital forensics analysis and investigation techniques |
| **metadata-extraction** | [mhattingpete/claude-skills-marketplace](https://github.com/mhattingpete/claude-skills-marketplace/tree/main/computer-forensics-skills/skills/metadata-extraction) | forensic-analysis-agent | Extract and analyze file metadata for forensic purposes |
| **file-deletion** | [mhattingpete/claude-skills-marketplace](https://github.com/mhattingpete/claude-skills-marketplace/tree/main/computer-forensics-skills/skills/file-deletion) | forensic-analysis-agent | Secure file deletion and data sanitization methods |

---

## 5. Vulnerability Management Agents

| Resource | URL | Mapping | Description |
|----------|-----|---------|-------------|
| **Trail of Bits variant-analysis** | [trailofbits/skills](https://github.com/trailofbits/skills) | vulnerability-triage-agent | Find similar vulnerabilities across codebases using pattern analysis |
| **Trail of Bits fix-review** | [trailofbits/skills](https://github.com/trailofbits/skills) | remediation-guidance-agent | Verify fix commits address audit findings without introducing bugs |
| **Trail of Bits differential-review** | [trailofbits/skills](https://github.com/trailofbits/skills) | vulnerability-triage-agent | Security-focused differential review with git history analysis |
| **Trail of Bits audit-context-building** | [trailofbits/skills](https://github.com/trailofbits/skills) | vulnerability-triage-agent, remediation-guidance-agent | Build deep architectural context through ultra-granular code analysis |
| **SecOpsAgentKit (Combined Scanning)** | [AgentSecOps/SecOpsAgentKit](https://github.com/AgentSecOps/SecOpsAgentKit) | vulnerability-triage-agent | Combines SAST, DAST, SCA for comprehensive vulnerability management |

---

## 6. Code Security Agents

| Resource | URL | Mapping | Description |
|----------|-----|---------|-------------|
| **Claude Code Security Review** | [anthropics/claude-code-security-review](https://github.com/anthropics/claude-code-security-review) | secure-code-reviewer-agent | Official Anthropic AI-powered security review action |
| **code-reviewer skill** | [WomenDefiningAI/claude-code-skills](https://github.com/WomenDefiningAI/claude-code-skills/blob/main/skills/code-reviewer/README.md) | secure-code-reviewer-agent | OWASP Top 10 checks, CWE/OWASP references, SAST integration |
| **Trail of Bits building-secure-contracts** | [trailofbits/skills](https://github.com/trailofbits/skills) | secure-code-reviewer-agent | Smart contract security toolkit with vulnerability scanners |
| **Trail of Bits entry-point-analyzer** | [trailofbits/skills](https://github.com/trailofbits/skills) | secure-code-reviewer-agent | Identify state-changing entry points for security auditing |
| **Trail of Bits spec-to-code-compliance** | [trailofbits/skills](https://github.com/trailofbits/skills) | security-requirements-agent | Specification-to-code compliance checker |
| **Trail of Bits testing-handbook-skills** | [trailofbits/skills](https://github.com/trailofbits/skills) | secure-code-reviewer-agent | Fuzzers, static analysis, sanitizers, coverage skills |
| **Trail of Bits property-based-testing** | [trailofbits/skills](https://github.com/trailofbits/skills) | secure-code-reviewer-agent | Property-based testing for multiple languages |
| **Trail of Bits constant-time-analysis** | [trailofbits/skills](https://github.com/trailofbits/skills) | crypto-analyzer | Detect compiler-induced timing side-channels in cryptographic code |
| **security-guidance** | [ccplugins/awesome-claude-code-plugins](https://github.com/ccplugins/awesome-claude-code-plugins) | secure-code-reviewer-agent | Official plugin for security best practices |
| **SecureVibes** | [anshumanbh/securevibes](https://github.com/anshumanbh/securevibes) | secure-code-reviewer-agent | Multi-agent security scanner for 11 languages |

---

## 7. Cloud Security Skills

| Resource | URL | Mapping | Description |
|----------|-----|---------|-------------|
| **Prowler** | [prowler-cloud/prowler](https://github.com/prowler-cloud/prowler) | aws-security-scanner, azure-security-scanner, gcp-security-scanner, multi-cloud-security-posture | World's most widely used open-source cloud security platform with MCP server |
| **ScoutSuite** | [nccgroup/ScoutSuite](https://github.com/nccgroup/ScoutSuite) | aws-security-scanner, azure-security-scanner, gcp-security-scanner | NCC Group multi-cloud security auditing tool |
| **HexStrike AI (Cloud Tools)** | [0x4m4/hexstrike-ai](https://github.com/0x4m4/hexstrike-ai) | aws-security-scanner, azure-security-scanner, gcp-security-scanner | Supports Prowler and ScoutSuite integration |
| **multi-cloud-security-tooling** | [mikaelvesavuori/multi-cloud-security-tooling](https://github.com/mikaelvesavuori/multi-cloud-security-tooling) | multi-cloud-security-posture | Scripts and resources for multi-cloud (AWS, Azure, GCP) security |

---

## 8. Cryptography and Key Management Skills

| Resource | URL | Mapping | Description |
|----------|-----|---------|-------------|
| **Vault MCP Server (Official)** | [hashicorp/vault-mcp-server](https://github.com/hashicorp/vault-mcp-server) | key-management-orchestrator | Official HashiCorp MCP server for secrets management and encryption |
| **vault-mcp** | [rccyx/vault-mcp](https://github.com/rccyx/vault-mcp) | key-management-orchestrator | Full-featured MCP integration for Vault secret and policy management |
| **vault-mcp-server (cosmicjedi)** | [Cosmicjedi/vault-mcp-server](https://github.com/Cosmicjedi/vault-mcp-server) | key-management-orchestrator | Secure Vault access with TOTP support and credential management |
| **Trail of Bits constant-time-analysis** | [trailofbits/skills](https://github.com/trailofbits/skills) | crypto-analyzer | Detect timing side-channels in cryptographic code |

---

## 9. Penetration Testing Skills

| Resource | URL | Mapping | Description |
|----------|-----|---------|-------------|
| **pentestMCP** | [ramkansal/pentestMCP](https://github.com/ramkansal/pentestMCP) | owasp-security-scanner, dast-scanner | 20+ security tools including Nmap, Nuclei, ZAP, SQLMap |
| **HexStrike AI** | [0x4m4/hexstrike-ai](https://github.com/0x4m4/hexstrike-ai) | owasp-security-scanner, dast-scanner | 150+ cybersecurity tools for automated pentesting |
| **SecOpsAgentKit pentest-metasploit** | [AgentSecOps/SecOpsAgentKit](https://github.com/AgentSecOps/SecOpsAgentKit) | dast-scanner | Penetration testing framework with Metasploit |
| **SecOpsAgentKit recon-nmap** | [AgentSecOps/SecOpsAgentKit](https://github.com/AgentSecOps/SecOpsAgentKit) | dast-scanner | Network reconnaissance and port scanning |
| **SecOpsAgentKit webapp-sqlmap** | [AgentSecOps/SecOpsAgentKit](https://github.com/AgentSecOps/SecOpsAgentKit) | dast-scanner | SQL injection detection and exploitation |
| **SecOpsAgentKit webapp-nikto** | [AgentSecOps/SecOpsAgentKit](https://github.com/AgentSecOps/SecOpsAgentKit) | dast-scanner | Web server vulnerability scanning |
| **SecOpsAgentKit analysis-tshark** | [AgentSecOps/SecOpsAgentKit](https://github.com/AgentSecOps/SecOpsAgentKit) | forensic-analysis-agent | Network packet analysis with Wireshark tshark |
| **Trail of Bits burpsuite-project-parser** | [trailofbits/skills](https://github.com/trailofbits/skills) | dast-scanner | Search and extract data from Burp Suite project files |
| **Offensive-MCP-AI** | [CyberSecurityUP/Offensive-MCP-AI](https://github.com/cybersecurityup/offensive-mcp-ai) | dast-scanner | Offensive security toolkit with CI/CD DevSecOps integration |
| **sast-mcp (Kali Tools)** | [Sengtocxoen/sast-mcp](https://github.com/Sengtocxoen/sast-mcp) | owasp-security-scanner | Includes Nikto, Nmap, SQLMap, WPScan, DIRB, Lynis, ClamAV |

---

## 10. Comprehensive Security Toolkits

These resources provide broad coverage across multiple security skill categories:

| Resource | URL | Coverage | Description |
|----------|-----|----------|-------------|
| **SecOpsAgentKit** | [AgentSecOps/SecOpsAgentKit](https://github.com/AgentSecOps/SecOpsAgentKit) | 25+ skills | Security operations toolkit covering AppSec, DevSecOps, SDLC, Compliance, IR |
| **sast-mcp** | [Sengtocxoen/sast-mcp](https://github.com/Sengtocxoen/sast-mcp) | 23+ tools | Comprehensive SAST MCP server with multi-tool integration |
| **HexStrike AI** | [0x4m4/hexstrike-ai](https://github.com/0x4m4/hexstrike-ai) | 150+ tools | Advanced MCP server for autonomous cybersecurity operations |
| **Trail of Bits Skills** | [trailofbits/skills](https://github.com/trailofbits/skills) | 15+ skills | Professional security-focused skills for audit and vulnerability detection |

---

## Reference Summary by Backlog Category

| Backlog Category | Skills/Agents | References Found |
|------------------|---------------|------------------|
| Security Testing | 7 | 28 |
| Compliance Automation | 5 | 8 |
| Threat Modeling & Risk | 3 | 7 |
| Incident Response & SOC | 3 | 9 |
| Vulnerability Management | 3 | 5 |
| Code Security | 2 | 10 |
| Cloud Security | 4 | 4 |
| Security Training | 2 | 0 |
| Cryptography & Keys | 2 | 4 |
| Vendor Security | 2 | 0 |
| **Total** | **33** | **75** |

---

## Gaps Identified

The following backlog items have limited or no community references found:

### No References Found
1. **phishing-simulation-skill** - No Claude-specific phishing simulation integrations (GoPhish, KnowBe4 require custom integration)
2. **secure-coding-training-skill** - No Claude-specific developer training skills (Secure Code Warrior requires custom integration)
3. **vendor-security-questionnaire** - No Claude-specific vendor assessment tools (OneTrust, ProcessUnity require custom integration)
4. **vendor-risk-monitor** - No Claude-specific continuous vendor monitoring (BitSight, SecurityScorecard require custom integration)
5. **patch-management-agent** - No dedicated patch planning MCP servers found

### Limited Coverage
1. **hipaa-compliance-automator** - Generic compliance tools exist but no HIPAA-specific Claude integrations
2. **pci-dss-compliance-automator** - Generic compliance tools exist but no PCI-specific Claude integrations
3. **security-requirements-agent** - Trail of Bits spec-to-code-compliance provides partial coverage

---

## Implementation Recommendations

### High-Priority (Strong Community Support)
1. **sast-analyzer** - Multiple MCP servers and skills available (sast-mcp, Semgrep MCP, SecOpsAgentKit)
2. **dast-scanner** - Multiple OWASP ZAP MCP implementations available
3. **dependency-scanner** - Trivy MCP and multiple SCA tools available
4. **container-security-scanner** - Official Trivy MCP from Aqua Security
5. **threat-modeling-agent** - STRIDE-GPT and skill-threat-modeling provide excellent foundation
6. **key-management-orchestrator** - Official HashiCorp Vault MCP server available

### Medium-Priority (Partial Community Support)
1. **owasp-security-scanner** - Can be composed from ZAP-MCP + pentestMCP
2. **iac-security-scanner** - Checkov available via SecOpsAgentKit
3. **secret-detection-scanner** - Gitleaks/TruffleHog via sast-mcp and SecOpsAgentKit
4. **incident-triage-agent** - SOC Automation Lab provides good reference architecture
5. **forensic-analysis-agent** - DeepBits plugins and osquery skills available

### Requires Custom Development
1. **soc2-compliance-automator** - Need to integrate with Vanta/Drata APIs
2. **gdpr-compliance-automator** - Need to build on GraphGRC foundation
3. **hipaa-compliance-automator** - Requires custom HIPAA-specific implementation
4. **pci-dss-compliance-automator** - Requires custom PCI-specific implementation
5. **vendor-security-questionnaire** - Requires custom vendor assessment integration
6. **vendor-risk-monitor** - Requires custom BitSight/SecurityScorecard integration
7. **phishing-simulation-skill** - Requires GoPhish/KnowBe4 integration
8. **secure-coding-training-skill** - Requires custom training platform integration

---

## Next Steps

1. Evaluate and test high-priority references for compatibility with babysitter SDK
2. Create wrapper skills for best-in-class community tools
3. Document integration patterns for each recommended resource
4. Identify gaps requiring custom skill development
5. Establish contribution guidelines for community-sourced skills
6. Build test suites for validating skill integrations
